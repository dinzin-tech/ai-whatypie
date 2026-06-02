"use client";

import { Input } from "@/src/elements/ui/input";
import { Label } from "@/src/elements/ui/label";
import { useAppDispatch, useAppSelector } from "@/src/redux/hooks";
import { AppSettings, useGetSettingsQuery } from "@/src/redux/api/settingApi";
import { updateSettingField } from "@/src/redux/reducers/settingsSlice";
import SettingCard from "../shared/SettingCard";
import { getWhatsAppWebhookDisplayUrl } from "@/src/lib/api-origin";
import { Button } from "@/src/elements/ui/button";
import { Check, Eye, EyeOff, QrCode, Settings2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type ConnectionMethodId = "manual" | "qr_scan" | "embedded_signup";

const CONNECTION_METHODS: {
  id: ConnectionMethodId;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "manual",
    label: "Manual Setup",
    description: "Connect using Meta Cloud API credentials manually.",
    icon: <Settings2 className="w-5 h-5 text-blue-500" />,
  },
  {
    id: "qr_scan",
    label: "QR Scan",
    description: "Scan a QR code to link your WhatsApp number quickly.",
    icon: <QrCode className="w-5 h-5 text-amber-500" />,
  },
  {
    id: "embedded_signup",
    label: "Embedded Signup",
    description: "Official Meta embedded signup flow for WABA connection.",
    icon: <ShieldCheck className="w-5 h-5 text-primary" />,
  },
];

const WhatsAppSettings = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings.data);
  const { data: storedSettings } = useGetSettingsQuery();

  const onChange = (key: keyof AppSettings, value: AppSettings[keyof AppSettings]) => {
    dispatch(updateSettingField({ key, value }));
  };

  const enabledMethods = settings.enabled_connection_methods ?? ["manual", "qr_scan", "embedded_signup"];

  const toggleConnectionMethod = (methodId: ConnectionMethodId) => {
    const current = [...enabledMethods];
    const index = current.indexOf(methodId);
    if (index >= 0) {
      if (current.length === 1) return;
      current.splice(index, 1);
    } else {
      current.push(methodId);
    }
    onChange("enabled_connection_methods", current);
  };

  const webhookDisplayUrl = getWhatsAppWebhookDisplayUrl(settings.whatsapp_webhook_url);
  const showValues = storedSettings?.show_whatsapp_config;

  return (
    <div className="space-y-5">
      <SettingCard
        title="Connection Methods"
        description="Choose which WhatsApp connection methods are available to users."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CONNECTION_METHODS.map((method) => {
            const isEnabled = enabledMethods.includes(method.id);
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => toggleConnectionMethod(method.id)}
                className={cn(
                  "relative flex flex-col items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200",
                  isEnabled
                    ? "border-primary/40 bg-primary/5 dark:bg-primary/10"
                    : "border-gray-200 dark:border-(--card-border-color) bg-gray-50/50 dark:bg-page-body hover:border-gray-300"
                )}
              >
                {isEnabled && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                )}
                <div className="p-2 rounded-lg bg-white dark:bg-(--card-color) border border-gray-100 dark:border-(--card-border-color)">
                  {method.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{method.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{method.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </SettingCard>

      <SettingCard
        title="WhatsApp API Credentials"
        description="Configure your Meta WhatsApp Business API credentials."
        rightElement={
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange("show_whatsapp_config", !settings.show_whatsapp_config)}
            className="flex items-center gap-2 border-primary/20 hover:bg-primary/5 dark:bg-(--dark-body) hover:text-primary transition-all duration-200"
          >
            {settings.show_whatsapp_config ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Show
              </>
            )}
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 flex flex-col">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">App ID</Label>
            <Input
              type={showValues ? "text" : "password"}
              value={showValues ? (settings.app_id ?? "") : (settings.app_id ? "••••••••" : "")}
              onChange={(e) => onChange("app_id", e.target.value)}
              placeholder="Your Meta App ID"
              readOnly={!showValues}
              className={`h-11 bg-(--input-color) dark:bg-page-body border-(--input-border-color) p-3 ${!showValues ? "opacity-70 cursor-not-allowed" : ""}`}
            />
          </div>
          <div className="space-y-1.5 flex flex-col">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">App Secret</Label>
            <Input
              type={showValues ? "text" : "password"}
              value={showValues ? (settings.app_secret ?? "") : (settings.app_secret ? "••••••••" : "")}
              onChange={(e) => onChange("app_secret", e.target.value)}
              placeholder="Your Meta App Secret"
              readOnly={!showValues}
              className={`h-11 bg-(--input-color) dark:bg-page-body border-(--input-border-color) p-3 ${!showValues ? "opacity-70 cursor-not-allowed" : ""}`}
            />
          </div>
          <div className="space-y-1.5 flex flex-col">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Configuration ID</Label>
            <Input
              type={showValues ? "text" : "password"}
              value={showValues ? (settings.configuration_id ?? "") : (settings.configuration_id ? "••••••••" : "")}
              onChange={(e) => onChange("configuration_id", e.target.value)}
              placeholder="WhatsApp Configuration ID"
              readOnly={!showValues}
              className={`h-11 bg-(--input-color) dark:bg-page-body border-(--input-border-color) p-3 ${!showValues ? "opacity-70 cursor-not-allowed" : ""}`}
            />
          </div>
          <div className="space-y-1.5 flex flex-col">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Webhook Verification Token</Label>
            <Input
              type={showValues ? "text" : "password"}
              value={showValues ? (settings.webhook_verification_token ?? "") : (settings.webhook_verification_token ? "••••••••" : "")}
              onChange={(e) => onChange("webhook_verification_token", e.target.value)}
              placeholder="Webhook verification token"
              readOnly={!showValues}
              className={`h-11 bg-(--input-color) dark:bg-page-body border-(--input-border-color) p-3 ${!showValues ? "opacity-70 cursor-not-allowed" : ""}`}
            />
          </div>
          <div className="space-y-1.5 flex flex-col md:col-span-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp Webhook URL</Label>
            <Input
              type="text"
              value={webhookDisplayUrl}
              readOnly
              placeholder="Computed from API origin"
              className="h-11 bg-gray-50 dark:bg-page-body border-(--input-border-color) p-3 opacity-80 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400">
              Read-only. Path stored as {settings.whatsapp_webhook_url || "/webhook/whatsapp"}
            </p>
          </div>
        </div>
      </SettingCard>
    </div>
  );
};

export default WhatsAppSettings;