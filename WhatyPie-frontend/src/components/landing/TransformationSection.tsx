"use client";

import React from "react";
import { XCircle, CheckCircle, ArrowRight, Zap, AlertTriangle, TrendingUp, Layers, Activity } from "lucide-react";

export const TransformationSection: React.FC = () => {
  const withoutList = [
    { title: "Manual Repetitive Work", desc: "Teams waste 60%+ of their day copy-pasting data across spreadsheets and apps." },
    { title: "Slow Response Times", desc: "Leads wait hours or days for replies, causing 70% to move to competitors." },
    { title: "Disconnected Systems", desc: "CRM, messaging, email, and billing operate in isolation with zero sync." },
    { title: "Human Errors & Lost Leads", desc: "Unqualified leads leak through the funnel without automated follow-ups." },
    { title: "Escalating Overhead", desc: "Scaling operations requires hiring more manual staff, shrinking margins." },
  ];

  const withList = [
    { title: "Autonomous AI Workflows", desc: "Smart AI agents execute routine operations 24/7 with zero human delay." },
    { title: "Sub-Second Responses", desc: "Instant AI engagement qualifies and books leads within seconds of inquiry." },
    { title: "Centralized Intelligence", desc: "All customer interactions, WhatsApp chats, and deals synced in real-time." },
    { title: "Intelligent Lead Nurturing", desc: "Predictive AI lead scoring & persistent follow-up automation ensure zero leaks." },
    { title: "Exponential ROI & Scale", desc: "Scale business volume 10x without adding operational headcount." },
  ];

  return (
    <section className="py-24 bg-slate-950/95 border-t border-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-widest">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>The Transformation Matrix</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            How WhatyPie Reinvents Your Business
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            See the stark contrast between legacy manual operations and an AI-automated enterprise system.
          </p>
        </div>

        {/* Side-by-Side Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Without WhatyPie */}
          <div className="p-8 rounded-3xl bg-rose-950/20 border border-rose-900/40 relative overflow-hidden space-y-6">
            <div className="flex items-center justify-between border-b border-rose-900/40 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-rose-200">Without WhatyPie</h3>
                  <p className="text-xs text-rose-400/80">Traditional Manual Operations</p>
                </div>
              </div>
              <span className="text-xs font-mono text-rose-400 px-3 py-1 bg-rose-950/60 rounded-full border border-rose-800/40">
                High Friction
              </span>
            </div>

            <div className="space-y-4">
              {withoutList.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-3.5 rounded-2xl bg-rose-950/30 border border-rose-900/20">
                  <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-rose-100">{item.title}</h4>
                    <p className="text-xs text-rose-300/70">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* With WhatyPie - Signature Green Theme */}
          <div className="p-8 rounded-3xl bg-emerald-950/30 border border-emerald-500/40 relative overflow-hidden space-y-6 shadow-[0_0_50px_rgba(5,150,105,0.2)]">
            <div className="flex items-center justify-between border-b border-emerald-800/40 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-md">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-100">With WhatyPie</h3>
                  <p className="text-xs text-emerald-400 font-medium">Autonomous AI System</p>
                </div>
              </div>
              <span className="text-xs font-mono text-white px-3 py-1 bg-emerald-600 rounded-full font-bold shadow-md">
                10x Performance
              </span>
            </div>

            <div className="space-y-4">
              {withList.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/30">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-slate-300">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
