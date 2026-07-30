import Setting from '../models/setting.model.js';
import Language from '../models/language.model.js';
import Currency from '../models/currency.model.js';


export async function fixSettingsData() {
  try {
    console.log('Starting settings data fix...');

    const settings = await Setting.findOne();
    if (!settings) {
      console.log('No settings found, nothing to fix.');
      return;
    }

    let needsUpdate = false;
    const updateData = {};

    if (typeof settings.maintenance_mode === 'string') {
      updateData.maintenance_mode = settings.maintenance_mode === 'true';
      needsUpdate = true;
      console.log('Fixed maintenance_mode field type');
    }

    if (typeof settings.maintenance_allowed_ips === 'string') {
      try {
        updateData.maintenance_allowed_ips = JSON.parse(settings.maintenance_allowed_ips);
      } catch {
        updateData.maintenance_allowed_ips = settings.maintenance_allowed_ips
          .split(',')
          .map(item => item.trim())
          .filter(item => item);
      }
      needsUpdate = true;
      console.log('Fixed maintenance_allowed_ips field type');
    }

    if (typeof settings.allowed_file_upload_types === 'string') {
      try {
        updateData.allowed_file_upload_types = JSON.parse(settings.allowed_file_upload_types);
      } catch {
        updateData.allowed_file_upload_types = settings.allowed_file_upload_types
          .split(',')
          .map(item => item.trim())
          .filter(item => item);
      }
      needsUpdate = true;
      console.log('Fixed allowed_file_upload_types field type');
    }

    if (settings.whatsapp_webhook_url && typeof settings.whatsapp_webhook_url === 'string') {
      let path = settings.whatsapp_webhook_url.trim();
      if (/^https?:\/\//i.test(path)) {
        try {
          path = new URL(path).pathname;
        } catch {
          path = path.replace(/^https?:\/\/[^/]+/i, '');
        }
      }
      path = path.replace(/\/+/g, '/');
      if (path === '/whatsapp/webhook' || !path.startsWith('/webhook/')) {
        path = '/webhook/whatsapp';
      }
      if (path !== settings.whatsapp_webhook_url) {
        updateData.whatsapp_webhook_url = path;
        needsUpdate = true;
        console.log('Normalized whatsapp_webhook_url to path-only');
      }
    } else if (!settings.whatsapp_webhook_url) {
      updateData.whatsapp_webhook_url = '/webhook/whatsapp';
      needsUpdate = true;
    }

    if (!settings.enabled_connection_methods?.length) {
      const legacy = settings.connection_method;
      updateData.enabled_connection_methods =
        legacy && legacy !== 'manual'
          ? [legacy]
          : ['manual', 'qr_scan', 'embedded_signup'];
      needsUpdate = true;
      console.log('Initialized enabled_connection_methods');
    }

    if (!settings.facebook_lead_webhook_verify_token && process.env.FACEBOOK_LEAD_WEBHOOK_VERIFY_TOKEN) {
      updateData.facebook_lead_webhook_verify_token = process.env.FACEBOOK_LEAD_WEBHOOK_VERIFY_TOKEN;
      needsUpdate = true;
      console.log('Initialized facebook_lead_webhook_verify_token from env');
    }

    if (settings.show_whatsapp_config === undefined) {
      updateData.show_whatsapp_config = true;
      needsUpdate = true;
      console.log('Initialized show_whatsapp_config');
    }

    if (settings.show_email_config === undefined) {
      updateData.show_email_config = true;
      needsUpdate = true;
      console.log('Initialized show_email_config');
    }

    if (!settings.default_language) {
      const defaultLang = await Language.findOne({ is_default: true, deleted_at: null });
      if (defaultLang) {
        updateData.default_language = defaultLang.locale;
        needsUpdate = true;
        console.log('Default language initialized from Language model');
      } else {
        const fallbackLang = await Language.findOne({ locale: 'en', deleted_at: null });
        if (fallbackLang) {
          fallbackLang.is_default = true;
          await fallbackLang.save();
          updateData.default_language = fallbackLang.locale;
          needsUpdate = true;
          console.log('Fallback to English as default language');
        }
      }
    }


    if (!settings.default_currency) {
      const defaultCurr = await Currency.findOne({ is_default: true, deleted_at: null });
      if (defaultCurr) {
        updateData.default_currency = defaultCurr._id;
        needsUpdate = true;
        console.log('Default currency initialized from Currency model');
      } else {
        const fallbackCurr = await Currency.findOne({ code: 'INR', deleted_at: null });
        if (fallbackCurr) {
          fallbackCurr.is_default = true;
          await fallbackCurr.save();
          updateData.default_currency = fallbackCurr._id;
          needsUpdate = true;
          console.log('Fallback to INR as default currency');
        }
      }
    }

    if (needsUpdate) {
      await Setting.findByIdAndUpdate(settings._id, updateData);
      console.log('Settings data fixed successfully!');
    } else {
      console.log('No settings data needed fixing.');
    }
  } catch (error) {
    console.error('Error fixing settings data:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fixSettingsData()
    .then(() => {
      console.log('Settings data fix completed.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Settings data fix failed:', error);
      process.exit(1);
    });
}
