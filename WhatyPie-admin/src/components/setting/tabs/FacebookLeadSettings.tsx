"use client";

import { Input } from "@/src/elements/ui/input";
import { Label } from "@/src/elements/ui/label";
import { useAppDispatch, useAppSelector } from "@/src/redux/hooks";
import { AppSettings } from "@/src/redux/api/settingApi";
import { updateSettingField } from "@/src/redux/reducers/settingsSlice";
import SettingCard from "../shared/SettingCard";
import { getFacebookLeadWebhookDisplayUrl } from "@/src/lib/api-origin";
import { Button } from "@/src/elements/ui/button";
import { Eye, EyeOff, Info } from "lucide-react";
import { useState } from "react";

const FacebookLeadSettings = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings.data);
  const [showToken, setShowToken] = useState(false);

  const onChange = (key: keyof AppSettings, value: AppSettings[keyof AppSettings]) => {
    dispatch(updateSettingField({ key, value }));
  };

  const webhookUrl = getFacebookLeadWebhookDisplayUrl();

  return (
    <div className="space-y-5">
      <SettingCard
        title="Facebook Lead Ads Webhook"
        description="Configure webhook settings for Facebook Lead Ads integration."
      >
        <div className="space-y-5">
          <div className="space-y-1.5 flex flex-col">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Facebook Lead Webhook URL
            </Label>
            <Input
              type="text"
              value={webhookUrl}
              readOnly
              className="h-11 bg-gray-50 dark:bg-page-body border-(--input-border-color) p-3 opacity-80 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5 flex flex-col">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Webhook Verify Token</Label>
            <div className="flex gap-2">
              <Input
                type={showToken ? "text" : "password"}
                value={settings.facebook_lead_webhook_verify_token ?? ""}
                onChange={(e) => onChange("facebook_lead_webhook_verify_token", e.target.value)}
                placeholder="Enter verify token for Meta webhook"
                className="h-11 bg-(--input-color) dark:bg-page-body border-(--input-border-color) p-3"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowToken((v) => !v)}
                className="h-11 w-11 shrink-0 border-(--input-border-color)"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p className="font-medium">Meta Business Suite setup</p>
              <p className="text-blue-700/90 dark:text-blue-300/90 leading-relaxed">
                In Meta Business Suite, add a webhook subscription for Leadgen events. Use the webhook URL
                and verify token above. Meta will send a verification challenge — the token must match what
                you save here.
              </p>
            </div>
          </div>
        </div>
      </SettingCard>
    </div>
  );
};

export default FacebookLeadSettings;
