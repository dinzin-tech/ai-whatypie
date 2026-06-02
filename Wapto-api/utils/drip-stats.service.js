import DripCampaign from '../models/drip-campaign.model.js';
import DripRecipient from '../models/drip-recipient.model.js';
import Message from '../models/message.model.js';

const STATUS_RANK = { pending: 0, failed: 1, sent: 2, delivered: 3, read: 4 };

const shouldAdvanceStatus = (current, next) => {
  if (!current || current === 'pending') return true;
  if (next === 'failed') return current !== 'read' && current !== 'delivered';
  return (STATUS_RANK[next] ?? 0) > (STATUS_RANK[current] ?? 0);
};

export const refreshDripCampaignProgress = async (dripCampaignId) => {
  const campaign = await DripCampaign.findById(dripCampaignId);
  if (!campaign) return;

  const recipients = await DripRecipient.find({ drip_campaign_id: dripCampaignId }).lean();
  const stepCount = campaign.steps?.length || 0;

  const stepStats = [];
  for (let i = 0; i < stepCount; i++) {
    const statuses = recipients.map((r) => r.step_progress?.find((p) => p.step_index === i)?.status || 'pending');
    stepStats.push({
      step_index: i,
      sent_count: statuses.filter((s) => ['sent', 'delivered', 'read'].includes(s)).length,
      delivered_count: statuses.filter((s) => ['delivered', 'read'].includes(s)).length,
      read_count: statuses.filter((s) => s === 'read').length,
      failed_count: statuses.filter((s) => s === 'failed').length,
      pending_count: statuses.filter((s) => s === 'pending').length
    });
  }

  const allDone = recipients.length > 0 && recipients.every((r) =>
    (r.step_progress || []).every((p) => ['sent', 'delivered', 'read', 'failed'].includes(p.status))
  );

  const update = {
    'stats.recipient_count': recipients.length,
    'stats.step_stats': stepStats
  };

  if (allDone && campaign.status === 'active') {
    update.status = 'completed';
    update.completed_at = new Date();
  }

  await DripCampaign.findByIdAndUpdate(dripCampaignId, update);
};

export const updateDripStatsFromMessage = async (messageId, newStatus, timestamp = null) => {
  const message = await Message.findById(messageId).select('metadata').lean();
  if (!message?.metadata?.drip_campaign_id) return null;

  const dripCampaignId = message.metadata.drip_campaign_id;
  const dripRecipientId = message.metadata.drip_recipient_id;
  const stepIndex = message.metadata.drip_step_index;

  const recipient = await DripRecipient.findById(dripRecipientId);
  if (!recipient) return null;

  const progress = recipient.step_progress.find((p) => p.step_index === stepIndex);
  if (!progress || !shouldAdvanceStatus(progress.status, newStatus)) {
    return null;
  }

  const stepSet = {
    'step_progress.$.status': newStatus
  };
  if (newStatus === 'sent') stepSet['step_progress.$.sent_at'] = timestamp || new Date();
  if (newStatus === 'delivered') stepSet['step_progress.$.delivered_at'] = timestamp || new Date();
  if (newStatus === 'read') stepSet['step_progress.$.read_at'] = timestamp || new Date();
  if (newStatus === 'failed') stepSet['step_progress.$.failed_at'] = timestamp || new Date();

  await DripRecipient.updateOne(
    { _id: dripRecipientId, 'step_progress.step_index': stepIndex },
    { $set: stepSet }
  );

  await refreshDripCampaignProgress(dripCampaignId);
  return { dripCampaignId, dripRecipientId, stepIndex, newStatus };
};

export const updateDripStatsFromWhatsApp = async (waMessageId, status, timestamp = null) => {
  const message = await Message.findOne({ wa_message_id: waMessageId }).select('_id metadata').lean();
  if (!message?.metadata?.drip_campaign_id) return null;

  let internalStatus;
  switch (status) {
    case 'sent': internalStatus = 'sent'; break;
    case 'delivered': internalStatus = 'delivered'; break;
    case 'read': internalStatus = 'read'; break;
    case 'failed': internalStatus = 'failed'; break;
    default: return null;
  }

  return updateDripStatsFromMessage(message._id.toString(), internalStatus, timestamp);
};
