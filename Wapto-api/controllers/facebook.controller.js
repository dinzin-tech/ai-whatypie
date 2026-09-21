import mongoose from 'mongoose';
import { Setting, FacebookConnection, FacebookPage, FacebookAdAccount, WhatsappPhoneNumber } from '../models/index.js';
import crypto from 'crypto';
import axios from 'axios';
import { FB_GRAPH_VERSION } from '../utils/meta-config.js';

const fetchAllFacebookPages = async (accessToken, fbUserId, userId) => {
  let allPages = [];

  let pagesUrl = `https://graph.facebook.com/${FB_GRAPH_VERSION}/me/accounts?access_token=${accessToken}&fields=id,name,access_token,category,picture.type(large),is_verified,tasks,business&limit=100`;
  while (pagesUrl) {
    try {
      const response = await axios.get(pagesUrl);
      const batch = response.data.data || [];
      allPages = [...allPages, ...batch];
      pagesUrl = response.data.paging?.next || null;
    } catch (error) {
      console.error('Error fetching personal pages:', error?.response?.data?.error?.message || error.message);
      break;
    }
  }

  let businessesUrl = `https://graph.facebook.com/${FB_GRAPH_VERSION}/me/businesses?access_token=${accessToken}&fields=id,name&limit=100`;
  let businesses = [];
  while (businessesUrl) {
    try {
      const resp = await axios.get(businessesUrl);
      businesses = [...businesses, ...(resp.data.data || [])];
      businessesUrl = resp.data.paging?.next || null;
    } catch (error) {
      console.error('Error fetching businesses:', error?.response?.data?.error?.message || error.message);
      break;
    }
  }

  for (const biz of businesses) {
    const bizEndpoints = [
      `https://graph.facebook.com/${FB_GRAPH_VERSION}/${biz.id}/owned_pages`,
      `https://graph.facebook.com/${FB_GRAPH_VERSION}/${biz.id}/client_pages`
    ];

    for (const endpoint of bizEndpoints) {
      let bizPagesUrl = `${endpoint}?access_token=${accessToken}&fields=id,name,access_token,category,picture.type(large),is_verified,business&limit=100`;
      while (bizPagesUrl) {
        try {
          const bizResp = await axios.get(bizPagesUrl);
          allPages = [...allPages, ...(bizResp.data.data || [])];
          bizPagesUrl = bizResp.data.paging?.next || null;
        } catch (error) {
          console.warn(`Failed to fetch pages from ${endpoint}:`, error?.response?.data?.error?.message || error.message);
          break;
        }
      }
    }
  }

  // Fetch user's registered WhatsApp phone numbers to match against page WhatsApp numbers
  const userPhoneNumbers = userId
    ? await WhatsappPhoneNumber.find({ user_id: userId, is_active: true, deleted_at: null }).lean()
    : [];
  const knownPhoneSet = new Set(userPhoneNumbers.map(p => (p.display_phone_number || p.phone_number || '').replace(/\D/g, '')));

  const uniquePages = [];
  const pageIds = new Set();

  for (const page of allPages) {
    if (!pageIds.has(page.id)) {
      let isPageWhatsappConnected = false;
      const pageToken = page.access_token || accessToken;
      try {
        const pageWaRes = await axios.get(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${page.id}`, {
          params: { fields: 'whatsapp_number,connected_whatsapp_business_account', access_token: pageToken }
        });
        const waNum = pageWaRes.data?.whatsapp_number;
        const connectedWaba = pageWaRes.data?.connected_whatsapp_business_account?.id;
        
        if (waNum) {
          isPageWhatsappConnected = true;
          page.whatsapp_number = waNum;
        } else if (connectedWaba) {
          isPageWhatsappConnected = true;
        } else if (knownPhoneSet.size > 0 && pageWaRes.data?.whatsapp_number) {
          const cleanPageNum = pageWaRes.data.whatsapp_number.replace(/\D/g, '');
          isPageWhatsappConnected = knownPhoneSet.has(cleanPageNum);
        }
      } catch (err) {
        // Fallback: If page inspection fails, leave as false unless page explicitly has whatsapp_number
        isPageWhatsappConnected = !!page.whatsapp_number;
      }

      page.is_whatsapp_connected = isPageWhatsappConnected;
      uniquePages.push(page);
      pageIds.add(page.id);
    }
  }

  return uniquePages;
};


export const handleFacebookCallback = async (req, res) => {
  try {
    const { access_token } = req.body;
    const userId = req.user.owner_id || req.user.id;

    if (!access_token) {
      return res.status(400).json({ success: false, error: 'Access token is required from FB SDK' });
    }

    const metaSettings = await Setting.findOne().lean();

    const dbAppId = metaSettings?.app_id ? String(metaSettings.app_id).trim() : null;
    const dbAppSecret = metaSettings?.app_secret ? String(metaSettings.app_secret).trim() : null;

    const envAppId = (process.env.FACEBOOK_APP_ID || process.env.META_APP_ID || process.env.APP_ID || process.env.app_id || '').trim() || null;
    const envAppSecret = (process.env.FACEBOOK_APP_SECRET || process.env.META_APP_SECRET || process.env.APP_SECRET || process.env.app_secret || '').trim() || null;

    const dbPairValid = Boolean(dbAppId && /^\d+$/.test(dbAppId) && dbAppSecret);
    const envPairValid = Boolean(envAppId && /^\d+$/.test(envAppId) && envAppSecret);

    const dbAppIdEqualsEnvAppId = (dbAppId === envAppId);
    const dbSecretEqualsEnvSecret = (dbAppSecret === envAppSecret);

    let app_id = null;
    let app_secret = null;

    if (dbPairValid && envPairValid) {
      if (dbAppIdEqualsEnvAppId && dbSecretEqualsEnvSecret) {
        app_id = dbAppId;
        app_secret = dbAppSecret;
      } else {
        console.error('[FB_CALLBACK] SECURITY FAIL-CLOSED: Database and Environment Meta credentials conflict!');
        return res.status(500).json({
          success: false,
          error: 'Meta App credentials conflict between database settings and environment configuration. Synchronize the App ID and App Secret before continuing.'
        });
      }
    } else if (dbPairValid) {
      app_id = dbAppId;
      app_secret = dbAppSecret;
    } else if (envPairValid) {
      app_id = envAppId;
      app_secret = envAppSecret;
    }

    if (!app_id || !app_secret) {
      return res.status(500).json({
        success: false,
        error: 'Meta app configuration not found. Please update App ID and App Secret in Settings or environment variables.'
      });
    }

    let accessToken = access_token;
    try {
      const longLivedTokenRes = await axios.get(`https://graph.facebook.com/${FB_GRAPH_VERSION}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: app_id,
          client_secret: app_secret,
          fb_exchange_token: accessToken
        }
      });
      accessToken = longLivedTokenRes.data.access_token || accessToken;
    } catch (e) {
      console.warn('Could not exchange for long lived token:', e.message);
    }

    let grantedScopes = [];
    try {
      const appToken = `${app_id}|${app_secret}`;
      const debugRes = await axios.get(`https://graph.facebook.com/debug_token`, {
        params: { input_token: accessToken, access_token: appToken }
      });
      grantedScopes = debugRes.data?.data?.scopes || [];
      console.log('[FB_CALLBACK] Token Debug Result:', {
        userId,
        fbUserId: debugRes.data?.data?.user_id,
        scopesCount: grantedScopes.length,
        hasAdsRead: grantedScopes.includes('ads_read'),
        hasAdsManagement: grantedScopes.includes('ads_management'),
        isValid: debugRes.data?.data?.is_valid
      });
    } catch (debugErr) {
      console.warn('Could not debug token:', debugErr?.response?.data || debugErr.message);
    }

    const meRes = await axios.get(`https://graph.facebook.com/${FB_GRAPH_VERSION}/me`, {
      params: { access_token: accessToken, fields: 'id,name,email' }
    });
    const fbUser = meRes.data;

    const connection = await FacebookConnection.findOneAndUpdate(
      { user_id: userId },
      {
        fb_user_id: fbUser.id,
        name: fbUser.name,
        email: fbUser.email,
        long_lived_access_token: accessToken,
        granted_scopes: grantedScopes,
        connection_status: 'CONNECTED',
        last_synced_at: new Date(),
        is_active: true
      },
      { upsert: true, new: true }
    );

    let pages = [];
    let adAccounts = [];
    let seenAdAccountIds = new Set();
    try {
      pages = await fetchAllFacebookPages(accessToken, fbUser.id, userId);

      // Multi-tier Ad Account Discovery: Personal + Business Portfolio
      // 1. Personal Ad Accounts
      try {
        let accountsUrl = `https://graph.facebook.com/${FB_GRAPH_VERSION}/me/adaccounts?access_token=${accessToken}&fields=id,name,account_id,currency,account_status,funding_source_details,is_prepay_account,balance&limit=100`;
        while (accountsUrl) {
          const accResp = await axios.get(accountsUrl);
          const batch = accResp.data?.data || [];
          for (const acc of batch) {
            if (!seenAdAccountIds.has(acc.id)) {
              seenAdAccountIds.add(acc.id);
              adAccounts.push(acc);
            }
          }
          accountsUrl = accResp.data.paging?.next || null;
        }
      } catch (accErr) {
        console.warn('[FB_CALLBACK] Personal ad account discovery warning:', {
          userId,
          metaErrorCode: accErr?.response?.data?.error?.code,
          metaErrorMsg: accErr?.response?.data?.error?.message || accErr.message
        });
      }

      // 2. Business Portfolio Ad Accounts
      try {
        let bizUrl = `https://graph.facebook.com/${FB_GRAPH_VERSION}/me/businesses?access_token=${accessToken}&fields=id,name&limit=100`;
        let businesses = [];
        while (bizUrl) {
          const bizResp = await axios.get(bizUrl);
          businesses = [...businesses, ...(bizResp.data?.data || [])];
          bizUrl = bizResp.data.paging?.next || null;
        }

        for (const biz of businesses) {
          const endpoints = [
            `https://graph.facebook.com/${FB_GRAPH_VERSION}/${biz.id}/owned_ad_accounts`,
            `https://graph.facebook.com/${FB_GRAPH_VERSION}/${biz.id}/client_ad_accounts`
          ];
          for (const ep of endpoints) {
            let accUrl = `${ep}?access_token=${accessToken}&fields=id,name,account_id,currency,account_status,funding_source_details,is_prepay_account,balance&limit=100`;
            while (accUrl) {
              try {
                const accResp = await axios.get(accUrl);
                const batch = accResp.data?.data || [];
                for (const acc of batch) {
                  if (!seenAdAccountIds.has(acc.id)) {
                    seenAdAccountIds.add(acc.id);
                    adAccounts.push(acc);
                  }
                }
                accUrl = accResp.data.paging?.next || null;
              } catch {
                break;
              }
            }
          }
        }
      } catch (bizErr) {
        console.warn('[FB_CALLBACK] Business portfolio ad account discovery warning:', bizErr?.response?.data?.error?.message || bizErr.message);
      }

      console.log('[FB_CALLBACK] Discovery Completed:', {
        userId,
        pagesCount: pages.length,
        adAccountsCount: adAccounts.length
      });

      const validPages = pages.filter(p => !!p.access_token);
      if (validPages.length > 0) {
        await FacebookPage.deleteMany({ connection_id: connection._id });

        const pageDocs = validPages.map(p => ({
          user_id: userId,
          connection_id: connection._id,
          page_id: p.id,
          page_name: p.name,
          page_access_token: p.access_token,
          category: p.category,
          picture_url: p.picture?.data?.url,
          is_meta_verified: p.is_verified || false,
          business_id: p.business?.id || null,
          is_whatsapp_connected: !!p.is_whatsapp_connected,
          is_active: true
        }));

        await FacebookPage.insertMany(pageDocs);
      }

      if (adAccounts.length > 0) {
        const adAccountStatusMap = {
          1: 'Active', 2: 'Disabled', 3: 'Unsettled', 7: 'Pending Review',
          9: 'In Grace Period', 100: 'Pending Closure', 101: 'Test Account', 201: 'Closed'
        };

        const adDocs = adAccounts.map(acc => {
          const hasPaymentMethod = !!(acc.funding_source_details?.id);
          return {
            user_id: userId,
            connection_id: connection._id,
            ad_account_id: acc.id,
            name: acc.name,
            currency: acc.currency,
            account_status: acc.account_status,
            status_label: adAccountStatusMap[acc.account_status] || 'Unknown',
            has_payment_method: hasPaymentMethod,
            can_create_ads: acc.account_status === 1 && hasPaymentMethod,
            balance: acc.balance,
            is_active: true
          };
        });

        await FacebookAdAccount.deleteMany({ connection_id: connection._id });
        await FacebookAdAccount.insertMany(adDocs);
      }
    } catch (pageErr) {
      console.warn('Failed to fetch Facebook pages/ad accounts during connection:', pageErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Facebook account linked successfully!',
      pages: pages.length || 0,
      adAccounts: adAccounts.length || 0,
      data: pages
    });

  } catch (error) {
    console.error('Error handling Facebook callback:', error?.response?.data || error);

    return res.status(500).json({
      success: false,
      error: 'Failed to complete Facebook setup',
      details: error?.response?.data?.error?.message || error.message
    });
  }
};

export const getFacebookPages = async (req, res) => {
  try {
    const userId = req.user.owner_id || req.user.id;
    const connection = await FacebookConnection.findOne({ user_id: userId, is_active: true }).lean();
    let pages = await FacebookPage.find({ user_id: userId, is_active: true }).select('-page_access_token').lean();

    if (connection?.default_page_id) {
      pages = pages.map(page => ({
        ...page,
        is_default: page._id.toString() === connection.default_page_id.toString()
      }));
    }

    return res.status(200).json({
      success: true,
      isConnected: !!connection,
      data: pages
    });
  } catch (error) {
    console.error('Error fetching Facebook pages:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch Facebook pages',
      details: error.message
    });
  }
};

export const syncFacebookPages = async (req, res) => {
  try {
    const userId = req.user.owner_id || req.user.id;


    const connection = await FacebookConnection.findOne({ user_id: userId, is_active: true });
    if (!connection) {
      return res.status(404).json({ success: false, error: 'No active Facebook connection found' });
    }


    const pages = await fetchAllFacebookPages(connection.long_lived_access_token, connection.fb_user_id, userId);


    const validPages = pages.filter(p => !!p.access_token);

    if (validPages.length > 0) {

      await FacebookPage.deleteMany({ connection_id: connection._id });

      const pageDocs = validPages.map(p => ({
        user_id: userId,
        connection_id: connection._id,
        page_id: p.id,
        page_name: p.name,
        page_access_token: p.access_token,
        category: p.category,
        picture_url: p.picture?.data?.url,
        is_meta_verified: p.is_verified || false,
        business_id: p.business?.id || null,
        is_whatsapp_connected: !!p.is_whatsapp_connected,
        is_active: true
      }));

      await FacebookPage.insertMany(pageDocs);
    } else {
      await FacebookPage.deleteMany({ connection_id: connection._id });
    }

    return res.status(200).json({
      success: true,
      message: 'Facebook pages synchronized successfully!',
      count: pages.length
    });

  } catch (error) {
    console.error('Error synchronizing Facebook pages:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to synchronize Facebook pages',
      details: error.message
    });
  }
};

export const syncLinkedSocialAccounts = async (req, res) => {
  try {
    const userId = req.user.owner_id || req.user.id;

    const connection = await FacebookConnection.findOne({ user_id: userId, is_active: true });
    if (!connection) {
      return res.status(400).json({ success: false, error: 'No active Facebook connection found. Please connect your Facebook account first.' });
    }

    let localPages = await FacebookPage.find({ connection_id: connection._id, is_active: true });

    if (localPages.length === 0) {
      try {
        const fetchedPages = await fetchAllFacebookPages(connection.long_lived_access_token, connection.fb_user_id, userId);
        const validPages = fetchedPages.filter(p => !!p.access_token);
        if (validPages.length > 0) {
          await FacebookPage.deleteMany({ connection_id: connection._id });
          const pageDocs = validPages.map(p => ({
            user_id: userId,
            connection_id: connection._id,
            page_id: p.id,
            page_name: p.name,
            page_access_token: p.access_token,
            category: p.category,
            picture_url: p.picture?.data?.url,
            is_meta_verified: p.is_verified || false,
            business_id: p.business?.id || null,
            is_whatsapp_connected: !!p.is_whatsapp_connected,
            is_active: true
          }));
          await FacebookPage.insertMany(pageDocs);
          localPages = await FacebookPage.find({ connection_id: connection._id, is_active: true });
        }
      } catch (fetchErr) {
        console.warn('Failed to auto-fetch pages during linked accounts sync:', fetchErr.message);
      }
    }

    if (localPages.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No Facebook pages found on your connected account.',
        pages_checked: 0,
        pages_updated: 0
      });
    }

    let updatedPages = 0;
    const activeWaba = await WhatsappPhoneNumber.findOne({ user_id: userId, is_active: true, deleted_at: null }).lean();

    let globalWhatsappConnected = false;
    try {
      const wabaRes = await axios.get(`https://graph.facebook.com/${FB_API_VERSION}/me/whatsapp_business_accounts`, {
        params: { fields: 'id', access_token: connection.long_lived_access_token }
      });
      globalWhatsappConnected = (wabaRes.data.data || []).length > 0;
    } catch (e) {
    }

    if (!globalWhatsappConnected && activeWaba) {
      globalWhatsappConnected = true;
    }

    for (const page of localPages) {
      try {
        const response = await axios.get(`https://graph.facebook.com/${FB_API_VERSION}/${page.page_id}`, {
          params: {
            fields: 'business,instagram_business_account{id,username}',
            access_token: page.page_access_token || connection.long_lived_access_token
          }
        });

        const pageData = response.data;
        const businessId = pageData.business?.id;
        const hasInstagram = !!pageData.instagram_business_account?.id;
        const instagramUsername = pageData.instagram_business_account?.username || null;

        await FacebookPage.findByIdAndUpdate(page._id, {
          is_instagram_connected: hasInstagram,
          instagram_username: instagramUsername,
          is_whatsapp_connected: globalWhatsappConnected || page.is_whatsapp_connected,
          business_id: businessId || page.business_id
        });

        updatedPages++;
      } catch (err) {
        console.warn(`Failed to sync Instagram/Business for page ${page.page_id}:`, err?.response?.data || err.message);
      }
    }
    return res.status(200).json({
      success: true,
      message: 'Linked social accounts synced successfully',
      pages_checked: localPages.length,
      pages_updated: updatedPages
    });

  } catch (error) {
    console.error('Error syncing linked social accounts:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to sync linked social accounts',
      details: error.message
    });
  }
};

export const updateFacebookDefaults = async (req, res) => {
  try {
    const userId = req.user.owner_id || req.user.id;
    const { default_page_id } = req.body;

    const connection = await FacebookConnection.findOneAndUpdate(
      { user_id: userId, is_active: true },
      {
        $set: {
          default_page_id: default_page_id || null
        }
      },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({ success: false, error: 'No active Facebook connection found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Facebook defaults updated successfully',
      data: {
        default_page_id: connection.default_page_id
      }
    });

  } catch (error) {
    console.error('Error updating Facebook defaults:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update Facebook defaults',
      details: error.message
    });
  }
};

