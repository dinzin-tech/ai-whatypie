"use client";

import React, { useState } from "react";
import { Layers, Bot, MessageSquare, GitBranch, Inbox, Megaphone, BarChart3, Database, Webhook, ArrowRight } from "lucide-react";
import { StrategyCallModal } from "./StrategyCallModal";

export const PlatformSection: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const modules = [
    {
      name: "AI Assistant Engine",
      icon: Bot,
      desc: "Multi-modal cognitive AI configured with your company knowledge base, answering questions & performing actions in 50+ languages.",
      badge: "LLM Powered",
    },
    {
      name: "WhatsApp CRM",
      icon: MessageSquare,
      desc: "Official Meta WABA integration enabling multi-agent WhatsApp chat, contact tagging, custom attributes, and automated broadcasts.",
      badge: "Meta Verified",
    },
    {
      name: "Drag-and-Drop Automation Builder",
      icon: GitBranch,
      desc: "Visual workflow canvas to build custom trigger-action pathways, delay timers, conditions, and webhook calls.",
      badge: "Visual Canvas",
    },
    {
      name: "Unified Shared Inbox",
      icon: Inbox,
      desc: "Centralized team inbox with role-based agent assignments, internal notes, quick reply templates, and auto-routing.",
      badge: "Multi-Agent",
    },
    {
      name: "Broadcasting Campaign Manager",
      icon: Megaphone,
      desc: "Schedule personalized bulk messages, sequence campaigns, and track real-time open, click, and response rates.",
      badge: "High Deliverability",
    },
    {
      name: "Real-Time Analytics & Reports",
      icon: BarChart3,
      desc: "Comprehensive executive dashboard showing lead conversion speed, agent performance, AI resolution rates, and ROI metrics.",
      badge: "Live Metrics",
    },
    {
      name: "Lead Management & Pipelines",
      icon: Database,
      desc: "Kanban board pipeline view tracking deals from raw inquiry to closed contract with automated stage-change notifications.",
      badge: "Kanban Pipeline",
    },
    {
      name: "Webhooks & Developer API",
      icon: Webhook,
      desc: "REST APIs, secure webhooks, and pre-built integrations for Shopify, WooCommerce, HubSpot, Salesforce, and Google Sheets.",
      badge: "Developer Ready",
    },
  ];

  return (
    <>
      <section id="platform" className="py-24 bg-slate-950 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/3 left-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-widest">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Core Technology Platform</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              The Software Engine Behind Your Transformation
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              Our proprietary software stack powers your AI agents, CRM pipelines, and automated multi-channel communication.
            </p>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.name}
                  className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30">
                        {m.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition">
                      {m.name}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed">{m.desc}</p>
                  </div>

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-6 flex items-center space-x-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
                  >
                    <span>Explore Module Features</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <StrategyCallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
