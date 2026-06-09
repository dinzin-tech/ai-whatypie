"use client";

import { Button } from "@/src/elements/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/src/elements/ui/dialog";
import StepRecipients from "@/src/components/campaigns/wizard/StepRecipients";
import {
  useActivateDripCampaignMutation,
  usePreviewDripAudienceMutation,
} from "@/src/redux/api/dripCampaignApi";
import { CampaignFormValues } from "@/src/types/components";
import { DripAudiencePreview } from "@/src/types/dripCampaign";
import { useFormik } from "formik";
import { Loader2, Rocket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DripActivateModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  onActivated: () => void;
}

const DripActivateModal: React.FC<DripActivateModalProps> = ({ open, onClose, campaignId, onActivated }) => {
  const [preview, setPreview] = useState<DripAudiencePreview | null>(null);
  const [previewAudience, { isLoading: previewLoading }] = usePreviewDripAudienceMutation();
  const [activate, { isLoading: activating }] = useActivateDripCampaignMutation();

  const formik = useFormik<CampaignFormValues>({
    initialValues: {
      name: "",
      description: "",
      waba_id: "",
      template_id: "",
      variables_mapping: {},
      recipient_type: "all_contacts",
      specific_contacts: [],
      tag_ids: [],
      segment_ids: [],
      media_url: "",
      is_scheduled: false,
      scheduled_at: "",
      coupon_code: "",
      offer_expiration_minutes: "",
      thumbnail_product_retailer_id: "",
      carousel_cards_data: [],
      carousel_products: [],
    },
    onSubmit: async () => {},
  });

  const buildAudienceBody = () => {
    const v = formik.values;
    const body: Record<string, unknown> = { recipient_type: v.recipient_type };
    if (v.recipient_type === "specific_contacts") body.specific_contacts = v.specific_contacts;
    else if (v.recipient_type === "tags") body.tag_ids = v.tag_ids;
    else if (v.recipient_type === "segments") body.segment_ids = v.segment_ids;
    return body;
  };

  const handlePreview = async () => {
    try {
      const res = await previewAudience({ id: campaignId, body: buildAudienceBody() as never }).unwrap();
      setPreview(res.data);
    } catch (err: unknown) {
      toast.error((err as { data?: { error?: string } })?.data?.error || "Preview failed");
    }
  };

  const handleActivate = async () => {
    try {
      const res = await activate({ id: campaignId, body: buildAudienceBody() as never }).unwrap();
      toast.success(res.message || "Campaign activated");
      onActivated();
      onClose();
    } catch (err: unknown) {
      toast.error((err as { data?: { error?: string } })?.data?.error || "Activation failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden dark:bg-(--card-color) dark:border-(--card-border-color)">
        <DialogHeader>
          <DialogTitle>Activate drip campaign</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto p-4">
          <StepRecipients formik={formik} />

          {preview && (
            <div className="rounded-lg bg-muted/30 dark:bg-(--page-body-bg) dark:border dark:border-(--card-border-color) p-3 text-sm space-y-1">
              <p className="text-slate-700 dark:text-gray-300">Matched: {preview.matchedCount}</p>
              <p className="text-primary font-semibold">Eligible: {preview.eligibleCount}</p>
              {preview.skippedOptOutCount > 0 && (
                <p className="text-amber-600 dark:text-amber-400">Skipped (opt-out): {preview.skippedOptOutCount}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-wrap gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handlePreview} disabled={previewLoading}>
            {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Preview audience"}
          </Button>
          <Button onClick={handleActivate} disabled={activating || (preview !== null && preview.eligibleCount === 0)}>
            {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4 mr-1" />}
            Activate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DripActivateModal;
