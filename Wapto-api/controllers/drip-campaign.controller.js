import mongoose from 'mongoose';
import DripCampaign from '../models/drip-campaign.model.js';
import DripRecipient from '../models/drip-recipient.model.js';
import Template from '../models/template.model.js';
import WhatsappWaba from '../models/whatsapp-waba.model.js';
import { resolveDripAudience } from '../utils/campaign-audience.js';
import {
  getDripCampaignQueue,
  removeDripCampaignJobs,
  scheduleDripStepJobs,
  schedulePendingDripStepJobs,
  countPendingDripSteps
} from '../queues/drip-campaign-queue.js';
import { refreshDripCampaignProgress } from '../utils/drip-stats.service.js';
import { resolveDripRecipientE164 } from '../utils/drip-job-processor.js';
import { validateDripStepTemplateConfig } from '../utils/drip-step-validation.js';

const getOwnerId = (user) => user.owner_id || user.id;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || DEFAULT_PAGE);
  const limit = Math.max(1, Math.min(MAX_LIMIT, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  return { page, limit, skip: (page - 1) * limit };
};

const normalizeSteps = (steps) => {
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error('At least one step is required');
  }
  return steps.map((step, index) => {
    const offsetMs = Number(step.offset_ms ?? step.offsetMs ?? 0);
    if (offsetMs < 0) throw new Error('Step offset must be >= 0');
    return {
      order: step.order ?? index,
      template_id: step.template_id,
      template_name: step.template_name || '',
      language_code: step.language_code || 'en',
      offset_ms: offsetMs,
      variables_mapping: step.variables_mapping || {},
      media_url: step.media_url || null,
      coupon_code: step.coupon_code || null,
      carousel_products: step.carousel_products || [],
      carousel_cards_data: step.carousel_cards_data || [],
      offer_expiration_minutes: step.offer_expiration_minutes ?? null
    };
  });
};

const validateStepsTemplates = async (steps, userId) => {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!step.template_id) throw new Error('Each step requires template_id');
    const template = await Template.findOne({
      _id: step.template_id,
      user_id: userId,
      deleted_at: null
    });
    if (!template) throw new Error(`Template not found for step ${step.order ?? i}`);
    const status = (template.status || '').toLowerCase();
    if (status && status !== 'approved') {
      throw new Error(`Template "${template.template_name}" must be approved`);
    }
    step.template_name = step.template_name || template.template_name;
    step.language_code = step.language_code || template.language || 'en_US';
    validateDripStepTemplateConfig(step, template, i);
  }
};

const buildDetailAnalytics = async (campaign) => {
  const recipients = await DripRecipient.find({ drip_campaign_id: campaign._id }).lean();
  const stepCount = campaign.steps?.length || 0;
  const perStep = [];

  for (let i = 0; i < stepCount; i++) {
    const statuses = recipients.map((r) => r.step_progress?.find((p) => p.step_index === i)?.status || 'pending');
    const failureReasons = recipients
      .map((r) => r.step_progress?.find((p) => p.step_index === i))
      .filter((p) => p?.status === 'failed' && p.failure_reason)
      .map((p) => p.failure_reason);
    const sample_failures = [...new Set(failureReasons)].slice(0, 5);

    perStep.push({
      step_index: i,
      order: campaign.steps[i]?.order ?? i,
      template_name: campaign.steps[i]?.template_name,
      offset_ms: campaign.steps[i]?.offset_ms,
      sent: statuses.filter((s) => ['sent', 'delivered', 'read'].includes(s)).length,
      delivered: statuses.filter((s) => ['delivered', 'read'].includes(s)).length,
      read: statuses.filter((s) => s === 'read').length,
      failed: statuses.filter((s) => s === 'failed').length,
      pending: statuses.filter((s) => s === 'pending').length,
      sample_failures
    });
  }

  return {
    recipientCount: recipients.length,
    perStep,
    stats: campaign.stats
  };
};

export const createDripCampaign = async (req, res) => {
  try {
    const userId = getOwnerId(req.user);
    const { name, waba_id, steps, opt_out_custom_field_key } = req.body;

    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Name is required' });
    if (!waba_id) return res.status(400).json({ success: false, error: 'waba_id is required' });

    const waba = await WhatsappWaba.findOne({ _id: waba_id, user_id: userId, deleted_at: null });
    if (!waba) return res.status(404).json({ success: false, error: 'WABA not found' });
    if (waba.provider === 'baileys') {
      return res.status(400).json({ success: false, error: 'Drip campaigns require WhatsApp Business API connection' });
    }

    const normalizedSteps = normalizeSteps(steps);
    await validateStepsTemplates(normalizedSteps, userId);

    const campaign = await DripCampaign.create({
      user_id: userId,
      waba_id,
      name: name.trim(),
      status: 'draft',
      steps: normalizedSteps,
      opt_out_custom_field_key: opt_out_custom_field_key || null,
      stats: {
        recipient_count: 0,
        step_stats: normalizedSteps.map((_, i) => ({
          step_index: i,
          sent_count: 0,
          delivered_count: 0,
          read_count: 0,
          failed_count: 0,
          pending_count: 0
        }))
      }
    });

    return res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    console.error('[createDripCampaign]', error.message);
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const getDripCampaigns = async (req, res) => {
  try {
    const userId = getOwnerId(req.user);
    const { page, limit, skip } = parsePagination(req.query);
    const search = (req.query.search || '').trim();

    const filter = { user_id: userId, deleted_at: null };
    if (search) filter.name = { $regex: search, $options: 'i' };

    const [campaigns, total] = await Promise.all([
      DripCampaign.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      DripCampaign.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data: {
        campaigns,
        pagination: {
          page,
          limit,
          totalItems: total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('[getDripCampaigns]', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch drip campaigns' });
  }
};

export const getDripCampaignById = async (req, res) => {
  try {
    const userId = getOwnerId(req.user);
    const campaign = await DripCampaign.findOne({
      _id: req.params.id,
      user_id: userId,
      deleted_at: null
    }).lean();

    if (!campaign) return res.status(404).json({ success: false, error: 'Drip campaign not found' });

    const analytics = await buildDetailAnalytics(campaign);

    return res.json({
      success: true,
      data: { ...campaign, analytics }
    });
  } catch (error) {
    console.error('[getDripCampaignById]', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch drip campaign' });
  }
};

export const updateDripCampaign = async (req, res) => {
  try {
    const userId = getOwnerId(req.user);
    const campaign = await DripCampaign.findOne({
      _id: req.params.id,
      user_id: userId,
      deleted_at: null
    });

    if (!campaign) return res.status(404).json({ success: false, error: 'Drip campaign not found' });
    if (campaign.status !== 'draft') {
      return res.status(400).json({ success: false, error: 'Only draft campaigns can be edited' });
    }

    const existingRecipients = await DripRecipient.countDocuments({ drip_campaign_id: campaign._id });
    if (existingRecipients > 0) {
      return res.status(400).json({ success: false, error: 'Cannot edit campaign after recipients are enrolled' });
    }

    if (req.body.name) campaign.name = req.body.name.trim();
    if (req.body.opt_out_custom_field_key !== undefined) {
      campaign.opt_out_custom_field_key = req.body.opt_out_custom_field_key || null;
    }
    if (req.body.steps) {
      const normalizedSteps = normalizeSteps(req.body.steps);
      await validateStepsTemplates(normalizedSteps, userId);
      campaign.steps = normalizedSteps;
      campaign.stats.step_stats = normalizedSteps.map((_, i) => ({
        step_index: i,
        sent_count: 0,
        delivered_count: 0,
        read_count: 0,
        failed_count: 0,
        pending_count: 0
      }));
    }

    await campaign.save();
    return res.json({ success: true, data: campaign });
  } catch (error) {
    console.error('[updateDripCampaign]', error.message);
    return res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteDripCampaign = async (req, res) => {
  try {
    const userId = getOwnerId(req.user);
    const campaign = await DripCampaign.findOne({
      _id: req.params.id,
      user_id: userId,
      deleted_at: null
    });

    if (!campaign) return res.status(404).json({ success: false, error: 'Drip campaign not found' });

    if (['active', 'paused'].includes(campaign.status)) {
      await removeDripCampaignJobs(campaign._id.toString());
    }

    campaign.deleted_at = new Date();
    campaign.status = 'cancelled';
    await campaign.save();

    return res.json({ success: true, message: 'Drip campaign deleted' });
  } catch (error) {
    console.error('[deleteDripCampaign]', error.message);
    return res.status(500).json({ success: false, error: 'Failed to delete drip campaign' });
  }
};

export const previewDripAudience = async (req, res) => {
  try {
    const userId = getOwnerId(req.user);
    const campaign = await DripCampaign.findOne({
      _id: req.params.id,
      user_id: userId,
      deleted_at: null
    });

    if (!campaign) return res.status(404).json({ success: false, error: 'Drip campaign not found' });

    const {
      recipient_type,
      specific_contacts,
      contact_numbers,
      tag_ids,
      segment_ids
    } = req.body;

    if (!recipient_type) {
      return res.status(400).json({ success: false, error: 'recipient_type is required' });
    }

    try {
      const { counts } = await resolveDripAudience({
        userId,
        recipient_type,
        specific_contacts,
        contact_numbers,
        tag_ids,
        segment_ids,
        opt_out_custom_field_key: campaign.opt_out_custom_field_key
      });

      return res.json({ success: true, data: counts });
    } catch (audienceErr) {
      return res.status(audienceErr.statusCode || 400).json({ success: false, error: audienceErr.message });
    }
  } catch (error) {
    console.error('[previewDripAudience]', error.message);
    return res.status(500).json({ success: false, error: 'Failed to preview audience' });
  }
};

export const activateDripCampaign = async (req, res) => {
  try {
    const userId = getOwnerId(req.user);
    const campaign = await DripCampaign.findOne({
      _id: req.params.id,
      user_id: userId,
      deleted_at: null
    });

    if (!campaign) return res.status(404).json({ success: false, error: 'Drip campaign not found' });
    if (!['draft', 'paused'].includes(campaign.status)) {
      return res.status(400).json({ success: false, error: 'Campaign cannot be activated in current status' });
    }

    const existingCount = await DripRecipient.countDocuments({ drip_campaign_id: campaign._id });
    if (existingCount > 0) {
      return res.status(400).json({ success: false, error: 'Campaign already has enrolled recipients' });
    }

    const {
      recipient_type,
      specific_contacts,
      contact_numbers,
      tag_ids,
      segment_ids
    } = req.body;

    if (!recipient_type) {
      return res.status(400).json({ success: false, error: 'recipient_type is required' });
    }

    let audienceResult;
    try {
      audienceResult = await resolveDripAudience({
        userId,
        recipient_type,
        specific_contacts,
        contact_numbers,
        tag_ids,
        segment_ids,
        opt_out_custom_field_key: campaign.opt_out_custom_field_key
      });
    } catch (audienceErr) {
      return res.status(audienceErr.statusCode || 400).json({ success: false, error: audienceErr.message });
    }

    const { contacts, counts } = audienceResult;
    if (contacts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No eligible contacts found',
        data: counts
      });
    }

    const enrolledAtMs = Date.now();
    const stepCount = campaign.steps.length;

    const recipientDocs = contacts.map((contact) => ({
      drip_campaign_id: campaign._id,
      contact_id: contact._id,
      phone_number: resolveDripRecipientE164(contact.phone_number) || contact.phone_number,
      user_id: userId,
      waba_id: campaign.waba_id,
      enrolled_at: new Date(enrolledAtMs),
      step_progress: Array.from({ length: stepCount }, (_, i) => ({
        step_index: i,
        status: 'pending'
      }))
    }));

    const inserted = await DripRecipient.insertMany(recipientDocs);

    await validateStepsTemplates(campaign.steps, userId);

    const previousStatus = campaign.status;
    const previousActivatedAt = campaign.activated_at;

    campaign.status = 'active';
    campaign.activated_at = new Date();
    campaign.stats.recipient_count = inserted.length;
    await campaign.save();

    try {
      await scheduleDripStepJobs({
        campaign,
        recipients: inserted,
        enrolledAtMs
      });
    } catch (scheduleErr) {
      campaign.status = previousStatus;
      campaign.activated_at = previousActivatedAt;
      campaign.stats.recipient_count = 0;
      await campaign.save();
      await removeDripCampaignJobs(campaign._id.toString());
      await DripRecipient.deleteMany({ drip_campaign_id: campaign._id });
      throw scheduleErr;
    }

    await refreshDripCampaignProgress(campaign._id);

    getDripCampaignQueue();

    return res.json({
      success: true,
      message: 'Drip campaign activated',
      data: {
        enrolled: inserted.length,
        counts
      }
    });
  } catch (error) {
    console.error('[activateDripCampaign]', error.message);
    return res.status(500).json({ success: false, error: error.message || 'Failed to activate drip campaign' });
  }
};

export const pauseDripCampaign = async (req, res) => {
  try {
    const userId = getOwnerId(req.user);
    const campaign = await DripCampaign.findOne({
      _id: req.params.id,
      user_id: userId,
      deleted_at: null
    });

    if (!campaign) return res.status(404).json({ success: false, error: 'Drip campaign not found' });
    if (campaign.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Only active campaigns can be paused' });
    }

    await removeDripCampaignJobs(campaign._id.toString());
    campaign.status = 'paused';
    await campaign.save();

    return res.json({ success: true, message: 'Drip campaign paused' });
  } catch (error) {
    console.error('[pauseDripCampaign]', error.message);
    return res.status(500).json({ success: false, error: 'Failed to pause drip campaign' });
  }
};

export const resumeDripCampaign = async (req, res) => {
  try {
    const userId = getOwnerId(req.user);
    const campaign = await DripCampaign.findOne({
      _id: req.params.id,
      user_id: userId,
      deleted_at: null
    });

    if (!campaign) return res.status(404).json({ success: false, error: 'Drip campaign not found' });
    if (campaign.status !== 'paused') {
      return res.status(400).json({ success: false, error: 'Only paused campaigns can be resumed' });
    }

    const recipients = await DripRecipient.find({ drip_campaign_id: campaign._id });
    const enrolledAtMs = campaign.activated_at?.getTime() || Date.now();

    await removeDripCampaignJobs(campaign._id.toString());

    campaign.status = 'active';
    await campaign.save();

    try {
      await schedulePendingDripStepJobs({
        campaign,
        recipients,
        enrolledAtMs
      });
    } catch (scheduleErr) {
      campaign.status = 'paused';
      await campaign.save();
      throw scheduleErr;
    }

    await refreshDripCampaignProgress(campaign._id);

    getDripCampaignQueue();

    return res.json({ success: true, message: 'Drip campaign resumed' });
  } catch (error) {
    console.error('[resumeDripCampaign]', error.message);
    return res.status(500).json({ success: false, error: error.message || 'Failed to resume drip campaign' });
  }
};

export const retryPendingDripCampaign = async (req, res) => {
  try {
    const userId = getOwnerId(req.user);
    const campaign = await DripCampaign.findOne({
      _id: req.params.id,
      user_id: userId,
      deleted_at: null
    });

    if (!campaign) return res.status(404).json({ success: false, error: 'Drip campaign not found' });
    if (!['active', 'paused'].includes(campaign.status)) {
      return res.status(400).json({
        success: false,
        error: 'Only active or paused campaigns can retry pending steps'
      });
    }

    const recipients = await DripRecipient.find({ drip_campaign_id: campaign._id });
    const stepCount = campaign.steps?.length || 0;
    const pendingBefore = countPendingDripSteps(recipients, stepCount);

    if (pendingBefore === 0) {
      return res.json({ success: true, message: 'No pending steps to retry', data: { requeued: 0 } });
    }

    await validateStepsTemplates(
      campaign.steps.map((s) => (s.toObject ? s.toObject() : { ...s })),
      userId
    );

    await removeDripCampaignJobs(campaign._id.toString());

    const enrolledAtMs = campaign.activated_at?.getTime() || Date.now();
    const wasPaused = campaign.status === 'paused';

    campaign.status = 'active';
    await campaign.save();

    try {
      await schedulePendingDripStepJobs({
        campaign,
        recipients,
        enrolledAtMs
      });
    } catch (scheduleErr) {
      if (wasPaused) {
        campaign.status = 'paused';
        await campaign.save();
      }
      throw scheduleErr;
    }

    await refreshDripCampaignProgress(campaign._id);

    getDripCampaignQueue();

    return res.json({
      success: true,
      message: 'Pending drip steps requeued',
      data: { requeued: pendingBefore }
    });
  } catch (error) {
    console.error('[retryPendingDripCampaign]', error.message);
    return res.status(500).json({ success: false, error: error.message || 'Failed to retry pending steps' });
  }
};

export default {
  createDripCampaign,
  getDripCampaigns,
  getDripCampaignById,
  updateDripCampaign,
  deleteDripCampaign,
  previewDripAudience,
  activateDripCampaign,
  pauseDripCampaign,
  resumeDripCampaign,
  retryPendingDripCampaign
};
