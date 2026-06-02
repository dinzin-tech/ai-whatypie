"use client";

import { Button } from "@/src/elements/ui/button";
import { Input } from "@/src/elements/ui/input";
import { Label } from "@/src/elements/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/elements/ui/select";
import { useGetTemplatesQuery } from "@/src/redux/api/templateApi";
import TimingConfig from "@/src/components/response-resources/sequence-step/TimingConfig";
import DripStepTemplateConfig from "@/src/components/drip-campaigns/DripStepTemplateConfig";
import { DelayUnit, DripStepDraft } from "@/src/types/dripCampaign";
import { formatOffsetLabel, offsetMsToUnit, unitValueToOffsetMs } from "@/src/utils/dripOffset";
import { Plus, Trash2 } from "lucide-react";
import React from "react";

interface DripStepBuilderProps {
  wabaId: string;
  steps: DripStepDraft[];
  onChange: (steps: DripStepDraft[]) => void;
}

const DripStepBuilder: React.FC<DripStepBuilderProps> = ({ wabaId, steps, onChange }) => {
  const { data: templatesResult, isLoading } = useGetTemplatesQuery({ waba_id: wabaId }, { skip: !wabaId });
  const templates = (templatesResult?.data || []).filter((t: { status?: string }) => t.status === "approved");

  const addStep = () => {
    const nextOrder = steps.length;
    onChange([
      ...steps,
      {
        id: `step-${Date.now()}`,
        order: nextOrder,
        template_id: "",
        offset_ms: nextOrder === 0 ? 0 : unitValueToOffsetMs(1, "hours"),
        delay_value: nextOrder === 0 ? 0 : 1,
        delay_unit: "hours" as DelayUnit,
      },
    ]);
  };

  const updateStep = (index: number, patch: Partial<DripStepDraft>) => {
    onChange(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const removeStep = (index: number) => {
    onChange(
      steps
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, order: i }))
    );
  };

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const { value: delayValue, unit: delayUnit } = offsetMsToUnit(step.offset_ms || 0);
        return (
          <div
            key={step.id}
            className="rounded-lg border border-slate-200 dark:border-(--card-border-color) bg-card p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Step {index + 1} · {formatOffsetLabel(step.offset_ms || 0)}
              </span>
              {steps.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeStep(index)}>
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-400 uppercase">Template</Label>
              <Select
                value={step.template_id}
                onValueChange={(val) => {
                  const tpl = templates.find((t: { _id: string }) => t._id === val);
                  updateStep(index, {
                    template_id: val,
                    template_name: tpl?.template_name || "",
                    language_code: tpl?.language || "en_US",
                    variables_mapping: {},
                    media_url: "",
                    coupon_code: "",
                    carousel_cards_data: [],
                    carousel_products: [],
                    offer_expiration_minutes: null,
                  });
                }}
                disabled={!wabaId || isLoading}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={isLoading ? "Loading..." : "Select template"} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t: { _id: string; template_name: string }) => (
                    <SelectItem key={t._id} value={t._id}>
                      {t.template_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TimingConfig
              delayValue={step.delay_value ?? delayValue}
              onDelayValueChange={(v) => {
                const num = typeof v === "number" ? v : 0;
                const unit = (step.delay_unit || delayUnit) as DelayUnit;
                updateStep(index, {
                  delay_value: num,
                  offset_ms: unitValueToOffsetMs(num, unit),
                });
              }}
              delayUnit={(step.delay_unit || delayUnit) as DelayUnit}
              onDelayUnitChange={(unit) => {
                const num = step.delay_value ?? delayValue;
                updateStep(index, {
                  delay_unit: unit,
                  offset_ms: unitValueToOffsetMs(num, unit),
                });
              }}
            />

            {step.template_id && (
              <DripStepTemplateConfig
                wabaId={wabaId}
                step={step}
                onChange={(patch) => updateStep(index, patch)}
              />
            )}
          </div>
        );
      })}

      <Button type="button" variant="outline" onClick={addStep} className="rounded-lg gap-2">
        <Plus className="w-4 h-4" /> Add step
      </Button>
    </div>
  );
};

export default DripStepBuilder;
