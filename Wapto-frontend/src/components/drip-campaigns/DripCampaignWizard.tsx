"use client";

import { Button } from "@/src/elements/ui/button";
import { Card } from "@/src/elements/ui/card";
import { Input } from "@/src/elements/ui/input";
import { Label } from "@/src/elements/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/elements/ui/select";
import { ROUTES } from "@/src/constants";
import { cn } from "@/src/lib/utils";
import { useCreateDripCampaignMutation } from "@/src/redux/api/dripCampaignApi";
import { templateApi } from "@/src/redux/api/templateApi";
import { useGetCustomFieldsQuery } from "@/src/redux/api/customFieldApi";
import { useGetConnectionsQuery } from "@/src/redux/api/whatsappApi";
import { store } from "@/src/redux/store";
import { useAppSelector } from "@/src/redux/hooks";
import WabaRequired from "@/src/shared/WabaRequired";
import { DripStepDraft } from "@/src/types/dripCampaign";
import { formatOffsetLabel } from "@/src/utils/dripOffset";
import { validateDripStepClient } from "@/src/utils/validateDripStep";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import DripStepBuilder from "./DripStepBuilder";

const STEPS = [
  { id: "basic", title: "General", description: "Name & settings" },
  { id: "steps", title: "Message steps", description: "Templates & delays" },
  { id: "review", title: "Review", description: "Confirm & save draft" },
];

const stepToPayload = (s: DripStepDraft, order: number) => {
  const payload: Record<string, unknown> = {
    order,
    template_id: s.template_id,
    template_name: s.template_name,
    language_code: s.language_code,
    offset_ms: s.offset_ms,
    variables_mapping: s.variables_mapping || {},
  };
  if (s.media_url?.trim()) payload.media_url = s.media_url.trim();
  if (s.coupon_code?.trim()) payload.coupon_code = s.coupon_code.trim();
  if (s.carousel_cards_data?.length) payload.carousel_cards_data = s.carousel_cards_data;
  if (s.carousel_products?.length) payload.carousel_products = s.carousel_products;
  if (s.offer_expiration_minutes != null && s.offer_expiration_minutes !== "") {
    payload.offer_expiration_minutes = Number(s.offer_expiration_minutes);
  }
  return payload;
};

const DripCampaignWizard = ({ campaignId }: { campaignId?: string }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [validating, setValidating] = useState(false);
  const { selectedWorkspace } = useAppSelector((state) => state.workspace);
  const wabaIdFromWorkspace = selectedWorkspace?.waba_id || "";

  const [name, setName] = useState("");
  const [wabaId, setWabaId] = useState(wabaIdFromWorkspace);
  const [optOutField, setOptOutField] = useState<string>("");
  const [steps, setSteps] = useState<DripStepDraft[]>([
    {
      id: "step-0",
      order: 0,
      template_id: "",
      offset_ms: 0,
      delay_value: 0,
      delay_unit: "minutes",
      variables_mapping: {},
    },
  ]);

  const [createDrip, { isLoading }] = useCreateDripCampaignMutation();
  const { data: connectionsResult } = useGetConnectionsQuery({});
  const connections = Array.isArray(connectionsResult) ? connectionsResult : connectionsResult?.data || [];
  const { data: customFieldsResult } = useGetCustomFieldsQuery({});
  const customFields = (customFieldsResult as { data?: { fields?: { name: string }[] } })?.data?.fields || [];

  const validateMessageSteps = async (): Promise<string | null> => {
    if (steps.length === 0) return "Add at least one message step";
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step.template_id) return `Step ${i + 1}: select a template`;
      try {
        const res = await store
          .dispatch(templateApi.endpoints.getTemplate.initiate(step.template_id))
          .unwrap();
        const err = validateDripStepClient(step, res?.data, i);
        if (err) return err;
      } catch {
        return `Step ${i + 1}: could not load template for validation`;
      }
    }
    return null;
  };

  const canNextBasic = !!name.trim() && !!wabaId;
  const canNextSteps = steps.length > 0 && steps.every((s) => s.template_id);

  const handleNext = async () => {
    if (currentStep === 1) {
      setValidating(true);
      const err = await validateMessageSteps();
      setValidating(false);
      if (err) {
        toast.error(err);
        return;
      }
    }
    setCurrentStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    const err = await validateMessageSteps();
    if (err) {
      toast.error(err);
      return;
    }
    try {
      const payload = {
        name: name.trim(),
        waba_id: wabaId,
        opt_out_custom_field_key: optOutField || null,
        steps: steps.map((s, i) => stepToPayload(s, i)),
      };
      const res = await createDrip(payload).unwrap();
      const id = res?.data?._id;
      toast.success(t("drip_campaign_created", "Drip campaign saved as draft"));
      router.push(id ? `${ROUTES.DripCampaigns}/${id}` : ROUTES.DripCampaigns);
    } catch (err: unknown) {
      const message = (err as { data?: { error?: string } })?.data?.error || "Failed to create drip campaign";
      toast.error(message);
    }
  };

  if (!wabaIdFromWorkspace && !campaignId) {
    return <WabaRequired />;
  }

  return (
    <div className="flex flex-col w-full mb-12 md:mb-0 min-h-screen">
      <header className="py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.DripCampaigns)}>
            <ArrowLeft />
          </Button>
          <h1 className="text-xl font-black text-primary">{t("create_drip_campaign", "Create drip campaign")}</h1>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        <div className="lg:col-span-3 space-y-2">
          {STEPS.map((step, i) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setCurrentStep(i)}
              className={cn(
                "w-full text-left p-4 rounded-lg border transition-all",
                currentStep === i
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-slate-200 dark:border-(--card-border-color)"
              )}
            >
              <p className="text-xs font-bold text-slate-400">{i + 1}</p>
              <p className="font-bold text-sm">{step.title}</p>
              <p className="text-xs text-slate-500">{step.description}</p>
            </button>
          ))}
        </div>

        <Card className="lg:col-span-9 p-4 md:p-6 border-slate-200 dark:border-(--card-border-color)">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Campaign name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Welcome series" />
              </div>
              <div className="space-y-2">
                <Label>WABA</Label>
                <Select value={wabaId} onValueChange={setWabaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((c: { id: string; name: string }) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("opt_out_field", "Opt-out custom field (optional)")}</Label>
                <Select value={optOutField || "__none__"} onValueChange={(v) => setOptOutField(v === "__none__" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Everyone opted in by default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None — send to all matched contacts</SelectItem>
                    {customFields.map((f: { name: string }) => (
                      <SelectItem key={f.name} value={f.name}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Contacts with this field set to yes/true/opt_out are skipped. Missing field = opted in.
                </p>
              </div>
            </div>
          )}

          {currentStep === 1 && <DripStepBuilder wabaId={wabaId} steps={steps} onChange={setSteps} />}

          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="font-bold">{name}</p>
              <p className="text-sm text-muted-foreground">{steps.length} steps · saved as draft until you activate</p>
              <ul className="space-y-3">
                {steps.map((s, i) => {
                  const varCount = Object.keys(s.variables_mapping || {}).filter(
                    (k) => s.variables_mapping?.[k]
                  ).length;
                  const extras = [
                    s.media_url ? "media" : null,
                    s.coupon_code ? "coupon" : null,
                    (s.carousel_cards_data?.length || 0) > 0 ? "carousel" : null,
                    (s.carousel_products?.length || 0) > 0 ? "products" : null,
                  ].filter(Boolean);
                  return (
                    <li key={s.id} className="text-sm border rounded-lg p-3 dark:border-(--card-border-color)">
                      <p className="font-semibold">
                        Step {i + 1}: {s.template_name || s.template_id}
                      </p>
                      <p className="text-muted-foreground">Delay: {formatOffsetLabel(s.offset_ms)}</p>
                      <p className="text-muted-foreground">
                        {varCount} variable{varCount !== 1 ? "s" : ""} mapped
                        {extras.length > 0 ? ` · ${extras.join(", ")}` : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-4 border-t">
            <Button variant="ghost" disabled={currentStep === 0} onClick={() => setCurrentStep((s) => s - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {currentStep < STEPS.length - 1 ? (
              <Button
                disabled={
                  (currentStep === 0 && !canNextBasic) ||
                  (currentStep === 1 && !canNextSteps) ||
                  validating
                }
                onClick={handleNext}
              >
                {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Next"}{" "}
                {!validating && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            ) : (
              <Button disabled={!canNextSteps || isLoading || validating} onClick={handleSubmit}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save draft"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DripCampaignWizard;
