import DripCampaign from '../models/drip-campaign.model.js';
import DripRecipient from '../models/drip-recipient.model.js';
import Contact from '../models/contact.model.js';
import Template from '../models/template.model.js';
import Message from '../models/message.model.js';
import WhatsappWaba from '../models/whatsapp-waba.model.js';
import { WhatsappPhoneNumber } from '../models/index.js';
import unifiedWhatsAppService from '../services/whatsapp/unified-whatsapp.service.js';
import {
  resolveVariablesForContact,
  isNewVariablesFormat,
  toOrderedTemplateParamValues
} from './campaign-job-processor.js';
import { buildOutboundTemplateComponents } from './build-outbound-template-components.js';
import { refreshDripCampaignProgress } from './drip-stats.service.js';
import { normalizeStoredPhone } from './phone-normalization.js';
import { validateDripStepTemplateConfig } from './drip-step-validation.js';

const TERMINAL_STEP_STATUSES = new Set(['sent', 'delivered', 'read', 'failed']);
const E164_REGEX = /^\d{6,15}$/;

export const resolveDripRecipientE164 = (phone) => {
  if (phone === undefined || phone === null) return '';
  const raw = String(phone).trim();
  if (!raw) return '';

  if (raw.includes('@')) {
    const userPart = raw.split('@')[0].split(':')[0];
    return normalizeStoredPhone(userPart);
  }

  return normalizeStoredPhone(raw);
};

const stepToPlain = (step) => {
  if (!step) return step;
  const plain = step.toObject ? step.toObject() : { ...step };
  if (plain.variables_mapping instanceof Map) {
    plain.variables_mapping = Object.fromEntries(plain.variables_mapping);
  }
  return plain;
};

const resolveStepVariables = (step, contact) => {
  const mapping = step.variables_mapping;
  const mappingPlain = mapping instanceof Map ? Object.fromEntries(mapping) : (mapping || {});
  if (isNewVariablesFormat(mappingPlain)) {
    return resolveVariablesForContact(mappingPlain, contact);
  }
  const contactKey = contact?._id?.toString?.();
  if (contactKey && mappingPlain[contactKey]) {
    return mappingPlain[contactKey];
  }
  return mappingPlain;
};

const resolveStepLanguageCode = (step, template) =>
  step.language_code || template?.language || 'en_US';

export const processDripStepJob = async (jobData) => {
  const { dripCampaignId, dripRecipientId, stepIndex, userId, wabaId } = jobData;
  const logCtx = { dripCampaignId, dripRecipientId, stepIndex };

  const campaign = await DripCampaign.findById(dripCampaignId);
  if (!campaign || campaign.deleted_at) {
    throw new Error(`Drip campaign ${dripCampaignId} not found`);
  }

  if (campaign.status !== 'active') {
    console.log('[Drip] skipped (campaign not active)', { ...logCtx, status: campaign.status });
    return { skipped: true, reason: 'campaign_not_active', status: campaign.status };
  }

  const recipient = await DripRecipient.findById(dripRecipientId);
  if (!recipient) {
    throw new Error(`Drip recipient ${dripRecipientId} not found`);
  }

  const progress = recipient.step_progress.find((s) => s.step_index === stepIndex);
  if (progress && TERMINAL_STEP_STATUSES.has(progress.status) && progress.status !== 'failed') {
    console.log('[Drip] skipped (step already done)', { ...logCtx, status: progress.status });
    return { skipped: true, reason: 'step_already_done' };
  }

  const sortedSteps = [...(campaign.steps || [])].sort((a, b) => a.order - b.order);
  const step = stepToPlain(sortedSteps[stepIndex]);
  if (!step) {
    throw new Error(`Step ${stepIndex} not found on drip campaign`);
  }

  const waba = await WhatsappWaba.findById(wabaId).lean();
  if (!waba) {
    throw new Error('WABA not found');
  }
  if (waba.provider === 'baileys') {
    const reason = 'Template drip campaigns require WhatsApp Business API (Cloud API)';
    await markStepFailed(recipient, stepIndex, reason);
    console.log('[Drip] skipped (Baileys WABA)', logCtx);
    return { skipped: true, reason: 'baileys_not_supported', failure_reason: reason };
  }

  const recipientE164 = resolveDripRecipientE164(recipient.phone_number);
  if (!E164_REGEX.test(recipientE164)) {
    const reason = `Invalid recipient phone for Cloud API: "${recipient.phone_number}"`;
    await markStepFailed(recipient, stepIndex, reason);
    console.log('[Drip] failed (invalid phone)', { ...logCtx, phone: recipient.phone_number });
    return { failed: true, reason: 'invalid_phone', failure_reason: reason };
  }

  const phoneNumbers = await WhatsappPhoneNumber.find({
    waba_id: wabaId,
    is_active: true,
    deleted_at: null
  })
    .populate('waba_id')
    .sort({ last_used_at: 1 });

  if (!phoneNumbers.length) {
    await markStepFailed(recipient, stepIndex, 'No active phone number for WABA');
    throw new Error('No active phone numbers');
  }

  const selectedPhoneNumber = phoneNumbers[0];
  const populatedWaba = selectedPhoneNumber.waba_id;
  const hasAccessToken = Boolean(
    populatedWaba &&
      typeof populatedWaba === 'object' &&
      populatedWaba.access_token
  );
  if (!hasAccessToken) {
    const reason = 'WhatsApp access token missing for WABA (phone record not linked to token)';
    await markStepFailed(recipient, stepIndex, reason);
    console.error('[Drip] failed (no access token)', { ...logCtx, wabaId });
    return { failed: true, reason: 'missing_access_token', failure_reason: reason };
  }
  await WhatsappPhoneNumber.findByIdAndUpdate(selectedPhoneNumber._id, { last_used_at: new Date() });

  const contact = await Contact.findById(recipient.contact_id).lean();
  const template = await Template.findById(step.template_id);
  if (!template) {
    await markStepFailed(recipient, stepIndex, 'Template not found');
    throw new Error('Template not found');
  }

  try {
    validateDripStepTemplateConfig(step, template, stepIndex);
  } catch (validationErr) {
    await markStepFailed(recipient, stepIndex, validationErr.message);
    await refreshDripCampaignProgress(dripCampaignId);
    console.log('[Drip] failed (config validation)', { ...logCtx, error: validationErr.message });
    return { failed: true, reason: 'invalid_step_config', failure_reason: validationErr.message };
  }

  const variables = resolveStepVariables(step, contact);
  const languageCode = resolveStepLanguageCode(step, template);
  const templateData = {
    template_name: step.template_name || template.template_name,
    language_code: languageCode,
    variables,
    media_url: step.media_url || null,
    carousel_products: step.carousel_products || [],
    carousel_cards_data: step.carousel_cards_data || [],
    coupon_code: step.coupon_code || null,
    offer_expiration_minutes: step.offer_expiration_minutes ?? null
  };

  try {
    const templateComponents = buildOutboundTemplateComponents(template, variables, templateData);

    const expectedBodyVarCount = template.body_variables?.length || 0;
    const bodyComponent = templateComponents.find((c) => c.type === 'body');
    if (expectedBodyVarCount > 0 && !bodyComponent) {
      const reason = `Template "${templateData.template_name}" requires ${expectedBodyVarCount} body variable(s) but none were resolved for this contact`;
      await markStepFailed(recipient, stepIndex, reason);
      await refreshDripCampaignProgress(dripCampaignId);
      console.log('[Drip] failed (missing body params)', { ...logCtx, reason });
      return { failed: true, reason: 'missing_body_params', failure_reason: reason };
    }

    console.log('[Drip] sending template', {
      ...logCtx,
      wabaId,
      phone_number_id: selectedPhoneNumber.phone_number_id,
      hasAccessToken: true,
      template: templateData.template_name,
      language: templateData.language_code,
      componentCount: templateComponents.length,
      to: recipientE164
    });

    const result = await unifiedWhatsAppService.sendMessage(userId, {
      recipientNumber: recipientE164,
      messageText: '',
      messageType: 'template',
      templateName: templateData.template_name,
      languageCode: templateData.language_code,
      templateComponents,
      userId,
      whatsappPhoneNumber: selectedPhoneNumber,
      contactId: recipient.contact_id,
      fromCampaignSystem: true
    });

    const waMessageId = result.messageId || result.id;

    if (recipientE164 !== recipient.phone_number) {
      await DripRecipient.updateOne({ _id: recipient._id }, { $set: { phone_number: recipientE164 } });
    }

    await Message.create({
      sender_number: selectedPhoneNumber.display_phone_number,
      recipient_number: recipientE164,
      contact_id: recipient.contact_id,
      user_id: userId,
      template_id: step.template_id,
      content: `Drip: ${campaign.name} - Step ${stepIndex + 1}`,
      message_type: 'template',
      from_me: true,
      direction: 'outbound',
      wa_message_id: waMessageId,
      wa_timestamp: new Date(),
      metadata: {
        drip_campaign_id: campaign._id,
        drip_recipient_id: recipient._id,
        drip_step_index: stepIndex,
        template_name: templateData.template_name,
        language_code: templateData.language_code,
        variables
      },
      whatsapp_phone_number_id: selectedPhoneNumber._id,
      provider: result.provider
    });

    await DripRecipient.updateOne(
      { _id: recipient._id, 'step_progress.step_index': stepIndex },
      {
        $set: {
          'step_progress.$.status': 'sent',
          'step_progress.$.sent_at': new Date(),
          'step_progress.$.message_id': waMessageId,
          'step_progress.$.wa_message_id': waMessageId,
          'step_progress.$.failure_reason': null
        }
      }
    );

    await refreshDripCampaignProgress(dripCampaignId);

    console.log('[Drip] sent', { ...logCtx, waMessageId, to: recipientE164 });
    return { success: true, waMessageId };
  } catch (error) {
    await markStepFailed(recipient, stepIndex, error.message);
    await refreshDripCampaignProgress(dripCampaignId);
    console.error('[Drip] send failed', { ...logCtx, error: error.message });
    throw error;
  }
};

async function markStepFailed(recipient, stepIndex, reason) {
  await DripRecipient.updateOne(
    { _id: recipient._id, 'step_progress.step_index': stepIndex },
    {
      $set: {
        'step_progress.$.status': 'failed',
        'step_progress.$.failed_at': new Date(),
        'step_progress.$.failure_reason': reason
      }
    }
  );
}
