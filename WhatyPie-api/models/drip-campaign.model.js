import mongoose from 'mongoose';

const DripStepSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  template_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },
  template_name: { type: String, default: '' },
  language_code: { type: String, default: 'en' },
  offset_ms: { type: Number, required: true, min: 0 },
  variables_mapping: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  media_url: { type: String, default: null },
  coupon_code: { type: String, default: null },
  carousel_products: { type: [mongoose.Schema.Types.Mixed], default: [] },
  carousel_cards_data: { type: [mongoose.Schema.Types.Mixed], default: [] },
  offer_expiration_minutes: { type: Number, default: null }
}, { _id: false });

const DripStepStatsSchema = new mongoose.Schema({
  step_index: { type: Number, required: true },
  sent_count: { type: Number, default: 0 },
  delivered_count: { type: Number, default: 0 },
  read_count: { type: Number, default: 0 },
  failed_count: { type: Number, default: 0 },
  pending_count: { type: Number, default: 0 }
}, { _id: false });

const DripCampaignStatsSchema = new mongoose.Schema({
  recipient_count: { type: Number, default: 0 },
  step_stats: { type: [DripStepStatsSchema], default: [] }
}, { _id: false });

const DripCampaignSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  waba_id: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsappWaba', required: true },
  name: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  steps: { type: [DripStepSchema], default: [] },
  opt_out_custom_field_key: { type: String, default: null },
  stats: { type: DripCampaignStatsSchema, default: () => ({ recipient_count: 0, step_stats: [] }) },
  activated_at: { type: Date, default: null },
  completed_at: { type: Date, default: null },
  deleted_at: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'drip_campaigns'
});

DripCampaignSchema.index({ user_id: 1, deleted_at: 1, created_at: -1 });

export default mongoose.model('DripCampaign', DripCampaignSchema);
