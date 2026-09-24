import UserSetting from '../models/user-setting.model.js';
import User from '../models/user.model.js';
import { Subscription, Setting, AIModel } from '../models/index.js';
import { encrypt, decryptApiKey, maskApiKey, isEncrypted } from '../utils/encryption-utils.js';
import { testAIModel } from '../utils/ai-utils.js';


const checkUserSubscriptionStatus = async (userId, userRole = null) => {

  let effectiveUserId = userId;

  if (userRole === 'agent') {
    const agent = await User.findById(userId)
      .select('created_by')
      .lean();

    if (agent?.created_by) {
      effectiveUserId = agent.created_by;
    }
  }

  if (userRole === 'super_admin') {
    const subscription = await Subscription.findOne({
      user_id: effectiveUserId,
      deleted_at: null,
      status: { $in: ['active', 'trial'] },
      current_period_end: { $gte: new Date() },
    })
      .populate('plan_id')
      .lean();

    return {
      is_subscribed: !!subscription,
      subscription: subscription || null,
      is_free_trial: false,
      free_trial_days_remaining: 0,
      plan: subscription?.plan_id || null
    };
  }

  const subscription = await Subscription.findOne({
    user_id: effectiveUserId,
    deleted_at: null,
    status: { $in: ['active', 'trial'] }
  })
    .populate('plan_id')
    .lean();

  if (subscription && subscription.plan_id) {
    return {
      is_subscribed: true,
      subscription: subscription,
      plan: subscription.plan_id,
      is_free_trial: false,
      free_trial_days_remaining: 0,
    };
  }

  const adminSettings = await Setting.findOne()
    .select('free_trial_enabled free_trial_days')
    .lean();
    console.log("adminSettings", adminSettings?.free_trial_enabled);
  if (adminSettings?.free_trial_enabled && adminSettings?.free_trial_days > 0) {
    const user = await User.findById(effectiveUserId)
      .select('created_at')
      .lean();

    if (user?.created_at) {
      const daysSinceRegistration = Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      console.log("daysSinceRegistration", daysSinceRegistration);
      if (daysSinceRegistration <= adminSettings.free_trial_days) {
        return {
          is_subscribed: true,
          is_free_trial: true,
          free_trial_days_remaining: Math.max(
            0,
            adminSettings.free_trial_days - daysSinceRegistration
          ),
          subscription: null,
          plan: null
        };
      }
    }
  }

  return {
    is_subscribed: false,
    subscription: null,
    is_free_trial: false,
    free_trial_days_remaining: 0,
    plan: null
  };
};


export const getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    let userSettings = await UserSetting.findOne({ user_id: userId });

    if (!userSettings) {
      userSettings = await UserSetting.create({
        user_id: userId,
        ai_model: null,
        api_key: null
      });
    }

    let decryptedKey = null;
    if (userSettings.api_key) {
      if (!isEncrypted(userSettings.api_key)) {
        decryptedKey = userSettings.api_key;
        userSettings.api_key = encrypt(userSettings.api_key);
        await userSettings.save();
      } else {
        decryptedKey = decryptApiKey(userSettings.api_key);
      }
    }

    const maskedKey = maskApiKey(decryptedKey);
    const subscriptionStatus = await checkUserSubscriptionStatus(userId, req.user?.role);

    res.status(200).json({
      success: true,
      data: {
        ai_model: userSettings.ai_model,
        is_show_phone_no: userSettings.is_show_phone_no,
        api_key: maskedKey,
        api_key_configured: !!decryptedKey,
        api_key_masked: maskedKey,
        notification_tone: userSettings.notification_tone || 'default',
        notifications_enabled: userSettings.notifications_enabled ?? true,
        is_subscribed: subscriptionStatus.is_subscribed,
        is_free_trial: subscriptionStatus.is_free_trial,
        free_trial_days_remaining: subscriptionStatus.free_trial_days_remaining,
        features: subscriptionStatus.plan?.features || null,
        theme_color: userSettings.theme_color || '#128C7E',
        user_bubble_color: userSettings.user_bubble_color || '#DCF8C6',
        contact_bubble_color: userSettings.contact_bubble_color || '#FFFFFF',
        bg_color: userSettings.bg_color || '#E5DDD5',
        bg_image: userSettings.bg_image || null,
        user_text_color: userSettings.user_text_color || '#000000',
        contact_text_color: userSettings.contact_text_color || '#000000',
        payment_success_message: userSettings.payment_success_message,
        payment_failed_message: userSettings.payment_failed_message,
        payment_reminder_enabled: userSettings.payment_reminder_enabled,
        payment_reminder_delay: userSettings.payment_reminder_delay,
        payment_reminder_unit: userSettings.payment_reminder_unit,
        payment_reminder_message: userSettings.payment_reminder_message,
        disable_admin_quick_reply: userSettings.disable_admin_quick_reply ?? false,
      },
    });
  } catch (error) {
    console.error('Error getting user settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user settings',
      details: error.message
    });
  }
};


export const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const body = req.body || {};
    const { ai_model, api_key, is_show_phone_no, notification_tone, notifications_enabled, theme_color, user_bubble_color, contact_bubble_color, bg_color, user_text_color, contact_text_color, payment_success_message, payment_failed_message, payment_reminder_enabled, payment_reminder_delay, payment_reminder_unit, payment_reminder_message, disable_admin_quick_reply } = body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let userSettings = await UserSetting.findOne({ user_id: userId });

    const normalizedAiModel =
      ai_model === '' || ai_model === undefined ? undefined : ai_model;

    if (userSettings) {
      if (normalizedAiModel !== undefined) userSettings.ai_model = normalizedAiModel;

      if (api_key !== undefined) {
        if (api_key === null || api_key === '' || api_key === 'CLEAR_API_KEY') {
          userSettings.api_key = null;
        } else if (typeof api_key === 'string' && (api_key.startsWith('••••') || isEncrypted(api_key))) {
          // Keep existing encrypted key
        } else if (typeof api_key === 'string' && api_key.trim().length > 0) {
          userSettings.api_key = encrypt(api_key.trim());
        }
      }

      if (is_show_phone_no !== undefined)
        userSettings.is_show_phone_no = is_show_phone_no;
      if (notification_tone !== undefined) userSettings.notification_tone = notification_tone;
      if (notifications_enabled !== undefined) userSettings.notifications_enabled = notifications_enabled;

      if (theme_color !== undefined) userSettings.theme_color = theme_color;
      if (user_bubble_color !== undefined) userSettings.user_bubble_color = user_bubble_color;
      if (contact_bubble_color !== undefined) userSettings.contact_bubble_color = contact_bubble_color;
      if (bg_color !== undefined) userSettings.bg_color = bg_color;

      if (user_text_color !== undefined) userSettings.user_text_color = user_text_color;
      if (contact_text_color !== undefined) userSettings.contact_text_color = contact_text_color;
      if (payment_success_message !== undefined) userSettings.payment_success_message = payment_success_message;
      if (payment_failed_message !== undefined) userSettings.payment_failed_message = payment_failed_message;
      if (payment_reminder_enabled !== undefined) userSettings.payment_reminder_enabled = payment_reminder_enabled;
      if (payment_reminder_delay !== undefined) userSettings.payment_reminder_delay = payment_reminder_delay;
      if (payment_reminder_unit !== undefined) userSettings.payment_reminder_unit = payment_reminder_unit;
      if (payment_reminder_message !== undefined) userSettings.payment_reminder_message = payment_reminder_message;
      if (disable_admin_quick_reply !== undefined) userSettings.disable_admin_quick_reply = disable_admin_quick_reply;

      if (req.files && req.files.bg_image) {
        const file = Array.isArray(req.files.bg_image) ? req.files.bg_image[0] : req.files.bg_image;
        userSettings.bg_image = file.path.startsWith('http') ? file.path : `/${file.path}`;
        userSettings.bg_color = null; 
      } else if (body.bg_image === 'null' || body.bg_image === '') {
        userSettings.bg_image = null;
      }

      await userSettings.save();
    } else {
      let encryptedApiKey = null;
      if (typeof api_key === 'string' && api_key.trim().length > 0 && !api_key.startsWith('••••')) {
        encryptedApiKey = encrypt(api_key.trim());
      }

      userSettings = await UserSetting.create({
        user_id: userId,
        ai_model: normalizedAiModel ?? null,
        api_key: encryptedApiKey,
        is_show_phone_no: is_show_phone_no ?? false,
        notification_tone: notification_tone ?? 'default',
        notifications_enabled: notifications_enabled ?? true,
        theme_color: theme_color ?? '#128C7E',
        user_bubble_color: user_bubble_color ?? '#DCF8C6',
        contact_bubble_color: contact_bubble_color ?? '#FFFFFF',
        bg_color: bg_color ?? '#E5DDD5',
        user_text_color: user_text_color ?? '#000000',
        contact_text_color: contact_text_color ?? '#000000',
        payment_success_message: payment_success_message,
        payment_failed_message: payment_failed_message,
        payment_reminder_enabled: payment_reminder_enabled,
        payment_reminder_delay: payment_reminder_delay,
        payment_reminder_unit: payment_reminder_unit,
        payment_reminder_message: payment_reminder_message,
        disable_admin_quick_reply: disable_admin_quick_reply ?? false,
        bg_image: (req.files && req.files.bg_image) ? (
          (Array.isArray(req.files.bg_image) ? req.files.bg_image[0] : req.files.bg_image).path.startsWith('http') 
            ? (Array.isArray(req.files.bg_image) ? req.files.bg_image[0] : req.files.bg_image).path 
            : `/${(Array.isArray(req.files.bg_image) ? req.files.bg_image[0] : req.files.bg_image).path}`
        ) : null
      });
    }

    const decryptedKey = decryptApiKey(userSettings.api_key);
    const maskedKey = maskApiKey(decryptedKey);

    const subscriptionStatus = await checkUserSubscriptionStatus(
      userId,
      req.user?.role
    );

    res.status(200).json({
      success: true,
      message: 'User settings updated successfully',
      data: {
        ai_model: userSettings.ai_model,
        api_key: maskedKey,
        api_key_configured: !!decryptedKey,
        api_key_masked: maskedKey,
        notification_tone: userSettings.notification_tone ?? 'default',
        notifications_enabled: userSettings.notifications_enabled ?? true,
        is_subscribed: subscriptionStatus.is_subscribed,
        is_free_trial: subscriptionStatus.is_free_trial,
        free_trial_days_remaining: subscriptionStatus.free_trial_days_remaining,
        theme_color: userSettings.theme_color,
        user_bubble_color: userSettings.user_bubble_color,
        contact_bubble_color: userSettings.contact_bubble_color,
        bg_color: userSettings.bg_color,
        bg_image: userSettings.bg_image,
        user_text_color: userSettings.user_text_color,
        contact_text_color: userSettings.contact_text_color,
        payment_success_message: userSettings.payment_success_message,
        payment_failed_message: userSettings.payment_failed_message,
        payment_reminder_enabled: userSettings.payment_reminder_enabled,
        payment_reminder_delay: userSettings.payment_reminder_delay,
        payment_reminder_unit: userSettings.payment_reminder_unit,
        payment_reminder_message: userSettings.payment_reminder_message,
        disable_admin_quick_reply: userSettings.disable_admin_quick_reply ?? false,
      }
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user settings',
      details: error.message
    });
  }
};

export const testUserAiConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ai_model, api_key } = req.body || {};

    let selectedModelId = ai_model;
    let rawApiKey = api_key;

    const userSettings = await UserSetting.findOne({ user_id: userId });

    if (!selectedModelId) {
      selectedModelId = userSettings?.ai_model;
    }

    if (!selectedModelId) {
      return res.status(400).json({
        success: false,
        code: 'MODEL_NOT_FOUND',
        message: 'No AI model selected. Please select an AI model first.'
      });
    }

    const aiModel = await AIModel.findOne({
      _id: selectedModelId,
      deleted_at: null
    }).lean();

    if (!aiModel) {
      return res.status(404).json({
        success: false,
        code: 'MODEL_NOT_FOUND',
        message: 'The selected AI model was not found.'
      });
    }

    if (aiModel.status !== 'active') {
      return res.status(400).json({
        success: false,
        code: 'MODEL_INACTIVE',
        message: 'The selected AI model is currently inactive.'
      });
    }

    if (!rawApiKey || rawApiKey.startsWith('••••') || rawApiKey.trim() === '') {
      rawApiKey = userSettings?.api_key ? decryptApiKey(userSettings.api_key) : null;
    } else {
      rawApiKey = decryptApiKey(rawApiKey);
    }

    if (!rawApiKey) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_API_KEY',
        message: 'No API key provided or configured.'
      });
    }

    const testPrompt = 'Reply with exactly: WhatyPie AI connection successful.';

    const result = await testAIModel(aiModel, testPrompt, rawApiKey);

    return res.status(200).json({
      success: true,
      message: 'Connection tested successfully',
      data: {
        provider: aiModel.provider,
        model: aiModel.display_name,
        latency_ms: result.latencyMs,
        response: result.responseText
      }
    });
  } catch (error) {
    console.error('Test user AI connection error:', error.message);
    return res.status(error.status || 500).json({
      success: false,
      code: error.code || 'UNKNOWN_PROVIDER_ERROR',
      message: error.message || 'AI provider connection test failed.'
    });
  }
};

export default {
  getUserSettings,
  updateUserSettings,
  testUserAiConnection
};
