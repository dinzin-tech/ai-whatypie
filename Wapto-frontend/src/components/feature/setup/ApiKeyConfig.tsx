"use client";

import { Button } from "@/src/elements/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/elements/ui/card";
import { Input } from "@/src/elements/ui/input";
import { ApiKeyConfigProps } from "@/src/types/components";
import { CheckCircle2, Eye, EyeOff, Key, Loader2, RefreshCw, ShieldCheck, Trash2, XCircle, Zap } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const ApiKeyConfig: React.FC<ApiKeyConfigProps> = ({
  value,
  onChange,
  apiKeyConfigured = false,
  apiKeyMasked = null,
  onTestConnection,
  isTesting = false,
  testResult = null,
}) => {
  const { t } = useTranslation();
  const [showKeyPlain, setRevealKey] = useState(false);
  const [isReplacing, setIsReplacing] = useState(!apiKeyConfigured);

  const isConfiguredMode = apiKeyConfigured && !isReplacing;
  const displayMasked = apiKeyMasked || value || "••••••••";

  const handleClear = () => {
    onChange("");
    setIsReplacing(true);
  };

  const handleReplaceClick = () => {
    setIsReplacing(true);
    onChange("");
  };

  return (
    <Card className="border dark:border-(--card-border-color) shadow-sm bg-white dark:bg-(--card-color)">
      <CardHeader className="flex flex-row items-center gap-4 pb-0!">
        <div className="p-3 rounded-lg bg-primary text-white shadow-lg shadow-emerald-500/20">
          <Key size={24} />
        </div>
        <div className="flex-1">
          <CardTitle className="text-xl">{t("setup_api_key")}</CardTitle>
          <CardDescription>{t("secure_authentication")}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {isConfiguredMode ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-(--page-body-bg) border border-slate-200 dark:border-(--card-border-color)">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
                <span className="font-mono text-sm tracking-wider font-semibold text-slate-700 dark:text-gray-300">
                  {displayMasked}
                </span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-medium">
                Configured
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReplaceClick}
                className="flex-1 text-xs h-9 border-slate-200 dark:border-(--card-border-color)"
              >
                <RefreshCw size={14} className="mr-1.5" />
                Replace API Key
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-xs h-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
              >
                <Trash2 size={14} className="mr-1" />
                Clear
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative group">
              <Input
                type={showKeyPlain ? "text" : "password"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t("api_key_placeholder") || "Enter your API key..."}
                className="h-12 bg-slate-50 pr-14.75 dark:bg-(--page-body-bg) border-slate-100 dark:border-(--card-border-color) rounded-lg focus-visible:ring-primary"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRevealKey(!showKeyPlain)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 bg-white dark:hover:bg-(--table-hover) dark:text-gray-400 dark:bg-(--card-color) rounded-lg text-slate-500 px-2"
              >
                {showKeyPlain ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            {apiKeyConfigured && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsReplacing(false)}
                className="text-xs text-slate-500 dark:text-gray-400"
              >
                Cancel replacement (Keep stored key)
              </Button>
            )}
          </div>
        )}

        {/* Test Connection Button */}
        {onTestConnection && (
          <Button
            type="button"
            variant="outline"
            onClick={onTestConnection}
            disabled={isTesting}
            className="w-full h-10 text-sm font-semibold border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10 transition-colors"
          >
            {isTesting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" /> Testing Connection...
              </>
            ) : (
              <>
                <Zap size={16} className="mr-2 fill-emerald-500/20" /> Test Connection
              </>
            )}
          </Button>
        )}

        {/* Test Result Alert */}
        {testResult && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${
              testResult.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300"
                : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <XCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <span className="font-semibold block">
                {testResult.success ? "✓ Connection Successful" : "✕ Connection Failed"}
              </span>
              <p className="text-[11px] mt-0.5 opacity-90 break-words">
                {testResult.message}
              </p>
              {testResult.latency_ms !== undefined && (
                <span className="text-[10px] opacity-75 mt-1 block">
                  Latency: {testResult.latency_ms}ms
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 text-blue-600 dark:text-blue-400">
          <ShieldCheck size={18} className="shrink-0" />
          <span className="text-xs font-medium">{t("credentials_encryption_notice")}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeyConfig;
