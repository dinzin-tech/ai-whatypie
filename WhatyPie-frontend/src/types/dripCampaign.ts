/* eslint-disable @typescript-eslint/no-explicit-any */

export type DripCampaignStatus = "draft" | "active" | "paused" | "completed" | "cancelled";

export type DelayUnit = "minutes" | "hours" | "days";

export interface DripStepInput {
  order: number;
  template_id: string;
  template_name?: string;
  language_code?: string;
  offset_ms: number;
  variables_mapping?: Record<string, any>;
  media_url?: string;
  coupon_code?: string;
  carousel_products?: Array<{ product_retailer_id?: string; catalog_id?: string }>;
  carousel_cards_data?: Array<Record<string, any>>;
  offer_expiration_minutes?: number | string | null;
  delay_value?: number;
  delay_unit?: DelayUnit;
}

export interface DripStepDraft extends DripStepInput {
  id: string;
}

export interface DripCampaign {
  _id: string;
  name: string;
  status: DripCampaignStatus;
  waba_id: string;
  steps: DripStepInput[];
  opt_out_custom_field_key?: string | null;
  stats?: {
    recipient_count: number;
    step_stats?: Array<{
      step_index: number;
      sent_count: number;
      delivered_count: number;
      read_count: number;
      failed_count: number;
      pending_count: number;
    }>;
  };
  activated_at?: string | null;
  created_at?: string;
  analytics?: {
    recipientCount: number;
    perStep: Array<{
      step_index: number;
      order: number;
      template_name?: string;
      offset_ms: number;
      sent: number;
      delivered: number;
      read: number;
      failed: number;
      pending: number;
      sample_failures?: string[];
    }>;
  };
}

export interface DripAudiencePayload {
  recipient_type: "all_contacts" | "specific_contacts" | "tags" | "segments";
  specific_contacts?: string[];
  contact_numbers?: string[];
  tag_ids?: string[];
  segment_ids?: string[];
}

export interface DripAudiencePreview {
  matchedCount: number;
  eligibleCount: number;
  skippedOptOutCount: number;
}
