import axios from 'axios';

/**
 * Subscribes a Meta WhatsApp Business Account (WABA) to app webhooks.
 * Uses Meta Graph API: POST https://graph.facebook.com/v22.0/{waba_id}/subscribed_apps
 *
 * @param {Object} params
 * @param {string} params.wabaMetaId - The Meta WhatsApp Business Account ID (numeric string)
 * @param {string} params.accessToken - The WABA/Business access token from Meta OAuth
 * @returns {Promise<{ success: boolean, status?: number, data?: any, error?: string, metaError?: any }>}
 */
export const subscribeWabaToWebhooks = async ({ wabaMetaId, accessToken }) => {
  if (!wabaMetaId) {
    return { success: false, error: 'WABA Meta ID is required for webhook subscription' };
  }
  if (!accessToken) {
    return { success: false, error: 'WABA Access Token is required for webhook subscription' };
  }

  const cleanWabaMetaId = String(wabaMetaId).trim();
  const graphApiVersion = process.env.META_GRAPH_API_VERSION || 'v22.0';

  console.log('[WABA_SUBSCRIPTION] Subscribing WABA to WhatsApp webhooks:', {
    wabaMetaId: cleanWabaMetaId,
    graphApiVersion
  });

  try {
    const res = await axios.post(
      `https://graph.facebook.com/${graphApiVersion}/${cleanWabaMetaId}/subscribed_apps`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('[WABA_SUBSCRIPTION] WABA webhook subscription successful:', {
      wabaMetaId: cleanWabaMetaId,
      success: res.data?.success
    });

    return {
      success: true,
      status: res.status,
      data: res.data
    };
  } catch (err) {
    const metaErrObj = err?.response?.data?.error || {};
    const statusCode = err?.response?.status || 500;
    const errorMessage = metaErrObj.message || err.message || 'Failed to subscribe WABA to webhooks';

    console.error('[WABA_SUBSCRIPTION] WABA webhook subscription failed:', {
      wabaMetaId: cleanWabaMetaId,
      status: statusCode,
      message: errorMessage,
      type: metaErrObj.type || null,
      code: metaErrObj.code || null,
      error_subcode: metaErrObj.error_subcode || null,
      fbtrace_id: metaErrObj.fbtrace_id || null
    });

    return {
      success: false,
      status: statusCode,
      error: errorMessage,
      metaError: metaErrObj
    };
  }
};
