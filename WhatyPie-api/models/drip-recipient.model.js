import mongoose from 'mongoose';

const StepProgressSchema = new mongoose.Schema({
  step_index: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  sent_at: { type: Date, default: null },
  delivered_at: { type: Date, default: null },
  read_at: { type: Date, default: null },
  failed_at: { type: Date, default: null },
  failure_reason: { type: String, default: null },
  message_id: { type: String, default: null },
  wa_message_id: { type: String, default: null }
}, { _id: false });

const DripRecipientSchema = new mongoose.Schema({
  drip_campaign_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DripCampaign',
    required: true,
    index: true
  },
  contact_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  phone_number: { type: String, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  waba_id: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsappWaba', required: true },
  enrolled_at: { type: Date, required: true },
  step_progress: { type: [StepProgressSchema], default: [] }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'drip_recipients'
});

DripRecipientSchema.index({ drip_campaign_id: 1, contact_id: 1 }, { unique: true });

export default mongoose.model('DripRecipient', DripRecipientSchema);
