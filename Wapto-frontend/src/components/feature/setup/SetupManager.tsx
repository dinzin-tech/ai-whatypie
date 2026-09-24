/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import ApiKeyConfig from "@/src/components/feature/setup/ApiKeyConfig";
import ConfigurationSummary from "@/src/components/feature/setup/ConfigurationSummary";
import ModelSelection from "@/src/components/feature/setup/ModelSelection";
import { Button } from "@/src/elements/ui/button";
import { Switch } from "@/src/elements/ui/switch";
import { useGetAllModelsQuery, useTestAIConnectionMutation, useUpdateUserSettingsMutation } from "@/src/redux/api/settingsApi";
import { useAppSelector } from "@/src/redux/hooks";
import { Form, Formik } from "formik";
import { Loader2, Save } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const SetupManager = () => {
  const { t } = useTranslation();
  const { data: modelsData, isLoading: isLoadingModels } = useGetAllModelsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateUserSettingsMutation();
  const [testConnection, { isLoading: isTesting }] = useTestAIConnectionMutation();
  const { userSetting } = useAppSelector((state) => state.setting);

  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; latency_ms?: number } | null>(null);

  const handleSave = async (values: { ai_model: string; api_key: string; disable_admin_quick_reply: boolean }) => {
    if (!values.ai_model) {
      toast.error(t("please_select_model") || "Please select an AI model before saving");
      return;
    }

    const selectedModelObj = modelsData?.data?.models?.find((m) => m._id === values.ai_model);
    if (selectedModelObj && selectedModelObj.status !== "active") {
      toast.error(t("selected_model_inactive") || "The selected AI model is currently inactive");
      return;
    }

    try {
      await updateSettings(values).unwrap();
      toast.success(t("setup_update_success") || "Settings saved successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || t("setup_update_failed"));
    }
  };

  const handleTestConnection = async (selectedModel: string, currentApiKey: string) => {
    if (!selectedModel) {
      toast.error(t("please_select_model") || "Please select an AI model first");
      return;
    }

    setTestResult(null);

    try {
      const res = await testConnection({
        ai_model: selectedModel,
        api_key: currentApiKey,
      }).unwrap();

      if (res.success) {
        setTestResult({
          success: true,
          message: res.message || "Connection tested successfully!",
          latency_ms: res.data?.latency_ms,
        });
        toast.success("✓ AI Connection successful");
      } else {
        setTestResult({
          success: false,
          message: res.message || "Connection test failed",
        });
        toast.error("✕ Connection failed: " + (res.message || "Provider error"));
      }
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || "Failed to connect to AI provider";
      setTestResult({
        success: false,
        message: errMsg,
      });
      toast.error("✕ Connection failed: " + errMsg);
    }
  };

  if (isLoadingModels || !userSetting) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const settingData = userSetting?.data;

  const initialValues = {
    ai_model: settingData?.ai_model || "",
    api_key: settingData?.api_key || "",
    disable_admin_quick_reply: settingData?.disable_admin_quick_reply || false,
  };

  const apiKeyConfigured = !!settingData?.api_key_configured;
  const apiKeyMasked = settingData?.api_key_masked || null;

  return (
    <Formik initialValues={initialValues} onSubmit={handleSave} enableReinitialize>
      {({ values, setFieldValue, handleSubmit }) => {
        const currentModel = modelsData?.data?.models.find((m) => m._id === values.ai_model);
        const hasApiKey = apiKeyConfigured || (!!values.api_key && values.api_key.trim() !== "");

        return (
          <Form className="space-y-6 sm:space-y-8 px-4 [@media(max-width:600px)]:px-0 sm:px-6 lg:px-0" onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-primary">{t("ai_config_page_title")}</h1>
                <p className="text-slate-500 text-sm dark:text-gray-500">{t("ai_config_page_description")}</p>
              </div>
              <Button type="submit" disabled={isUpdating} className="h-11 px-8 rounded-lg bg-primary text-white font-bold shadow-lg shadow-emerald-600/20 text-sm sm:text-base transition-all hover:scale-[1.02] active:scale-[0.98]">
                {isUpdating ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" /> {t("updating")}
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2" /> {t("save_changes")}
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                <ModelSelection
                  models={modelsData?.data?.models || []}
                  selectedModel={values.ai_model}
                  onSelect={(id) => {
                    setFieldValue("ai_model", id);
                    setTestResult(null);
                  }}
                />

                {/* Quick Reply Settings */}
                <div className="bg-white dark:bg-(--card-color) sm:p-6 p-4 rounded-lg border border-slate-200 dark:border-(--card-border-color) shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 dark:text-white">{t("disable_admin_quick_reply")}</h3>
                      <p className="text-sm text-slate-500 dark:text-gray-400">{t("disable_admin_quick_reply_desc")}</p>
                    </div>
                    <Switch checked={values.disable_admin_quick_reply} onCheckedChange={(checked: boolean) => setFieldValue("disable_admin_quick_reply", checked)} />
                  </div>
                </div>
              </div>

              <div className="space-y-6 sm:space-y-8">
                <ApiKeyConfig
                  value={values.api_key}
                  onChange={(val) => {
                    setFieldValue("api_key", val);
                    setTestResult(null);
                  }}
                  apiKeyConfigured={apiKeyConfigured}
                  apiKeyMasked={apiKeyMasked}
                  onTestConnection={() => handleTestConnection(values.ai_model, values.api_key)}
                  isTesting={isTesting}
                  testResult={testResult}
                />
                <ConfigurationSummary currentModel={currentModel} hasApiKey={hasApiKey} />
              </div>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default SetupManager;
