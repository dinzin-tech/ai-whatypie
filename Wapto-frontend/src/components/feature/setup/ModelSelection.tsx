"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/elements/ui/card";
import { ModelSelectionProps } from "@/src/types/components";
import { CheckCircle2, Sparkles } from "lucide-react";
import Image from "next/image";
import React from "react";
import { useTranslation } from "react-i18next";

const getProviderBadge = (provider: string) => {
  const normalized = (provider || "").toLowerCase();
  switch (normalized) {
    case "openrouter":
      return { label: "OpenRouter", className: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300" };
    case "openai":
      return { label: "OpenAI", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" };
    case "anthropic":
      return { label: "Anthropic", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" };
    case "google":
      return { label: "Google", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" };
    case "groq":
      return { label: "Groq", className: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300" };
    case "mistral":
      return { label: "Mistral", className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" };
    case "deepseek":
      return { label: "DeepSeek", className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300" };
    default:
      return { label: provider.toUpperCase(), className: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300" };
  }
};

const ModelSelection: React.FC<ModelSelectionProps> = ({ models, selectedModel, onSelect }) => {
  const { t } = useTranslation();

  return (
    <Card className="dark:border-(--card-border-color) border shadow-sm bg-white dark:bg-(--card-color) overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="p-3 rounded-lg bg-primary text-white shadow-lg shadow-emerald-500/20">
          <Sparkles size={24} />
        </div>
        <div className="flex-1">
          <CardTitle className="text-xl">{t("ai_model")}</CardTitle>
          <CardDescription>{t("choose_assistant")}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0! max-h-113 overflow-auto custom-scrollbar">
        {models.map((model) => {
          const providerInfo = getProviderBadge(model.provider);

          return (
            <div
              key={model._id}
              onClick={() => onSelect(model._id)}
              className={`relative p-3 sm:p-4 rounded-lg border transition-all cursor-pointer group flex items-start gap-3 sm:gap-4
                ${
                  selectedModel === model._id
                    ? "border-primary bg-emerald-50/30 dark:bg-(--table-hover) shadow-md shadow-emerald-500/10"
                    : "border-slate-100 dark:border-(--card-border-color) hover:border-(--hover-card-color) dark:hover:border-(--card-border-color) hover:bg-slate-50/50 dark:hover:bg-(--table-hover)"
                }`}
            >
              <div
                className={`p-2.5 rounded-lg shrink-0 w-9 h-9 flex items-center justify-center transition-colors mt-0.5
                ${
                  selectedModel === model._id
                    ? "bg-primary text-white"
                    : "bg-slate-100 dark:bg-(--dark-sidebar) text-slate-500 group-hover:bg-(--light-primary) group-hover:text-primary dark:group-hover:bg-emerald-500/20"
                }
              `}
              >
                {model.icon ? (
                  <Image src={model.icon} alt={model.display_name} width={24} height={24} className="object-contain w-6 h-6" />
                ) : (
                  <Sparkles size={20} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white truncate">{model.display_name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${providerInfo.className}`}>
                      {providerInfo.label}
                    </span>
                    {model.status === "active" && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                        Active
                      </span>
                    )}
                  </div>
                  {selectedModel === model._id && <CheckCircle2 size={18} className="text-primary fill-primary-500/10 shrink-0" />}
                </div>

                <div className="text-xs text-slate-400 dark:text-gray-400 font-mono mb-1 truncate">
                  {model.model_id}
                </div>

                {model.description && (
                  <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-2">{model.description}</p>
                )}

                {model.capabilities && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {model.capabilities.translate && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Translate
                      </span>
                    )}
                    {model.capabilities.summarize && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Summarize
                      </span>
                    )}
                    {model.capabilities.reply_suggestion && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Reply Suggestion
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default ModelSelection;
