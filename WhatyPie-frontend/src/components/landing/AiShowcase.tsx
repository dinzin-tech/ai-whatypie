"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, MessageSquare, Bot, CheckCircle2, Calendar, UserCheck, ArrowRight, Play, Zap } from "lucide-react";
import { StrategyCallModal } from "./StrategyCallModal";

export const AiShowcase: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const workflowSteps = [
    {
      title: "1. Incoming Lead Inquiry",
      type: "user",
      content: `"Hi! We are looking to automate our Real Estate sales inquiries and sync lead visits into Google Calendar. Can you help?"`,
      meta: "WhatsApp Message received • 10:42 AM",
    },
    {
      title: "2. AI Intent Extraction & RAG Search",
      type: "ai-brain",
      content: "Extracting Entities: [Industry: Real Estate] [Goal: Calendar Sync & Sales Automation] -> Matching Solution: Real Estate Blueprint v3",
      meta: "Processing time: 140ms • Intent Confidence: 99.2%",
    },
    {
      title: "3. Autonomous Lead Qualification",
      type: "ai-reply",
      content: `"Hello! Absolutely. Our Real Estate AI Blueprint automates site visit booking and syncs directly with Google Calendar. Are you looking for 10-50 property visits per week?"`,
      meta: "Automated WhatsApp Response sent • 10:42 AM",
    },
    {
      title: "4. Lead Response & Lead Score Update",
      type: "user",
      content: `"Yes, around 30 visits/week across 3 projects."`,
      meta: "Lead Score Updated: 96/100 (HIGH INTENT VIP)",
    },
    {
      title: "5. Calendar Slot Reserved & CRM Sync",
      type: "action",
      content: "Slot Reserved: Tomorrow @ 3:30 PM • CRM Pipeline Stage: 'Qualified Meeting Booked' • Assigned Rep: Sarah Jenkins",
      meta: "Sync Complete across WhatsApp, Google Calendar & WhatyPie CRM",
    },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % workflowSteps.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, workflowSteps.length]);

  return (
    <>
      <section className="py-24 bg-slate-950 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Title */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Live AI Simulation</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Watch WhatyPie AI In Action
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              Experience how an incoming lead is qualified, scored, and converted into a booked appointment in under 15 seconds.
            </p>
          </div>

          {/* Simulator Window */}
          <div className="max-w-4xl mx-auto rounded-3xl bg-slate-900/90 border border-emerald-500/30 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Header Controls */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">Live AI Execution Simulator</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className="px-3 py-1 bg-emerald-950 border border-emerald-500/30 hover:bg-emerald-900 rounded-lg text-xs font-medium text-emerald-300 flex items-center space-x-1.5 transition"
                >
                  {isAutoPlaying ? (
                    <>
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pause Simulation</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Resume Simulation</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="grid grid-cols-5 border-b border-slate-800 bg-slate-950/50 text-center text-xs font-mono">
              {workflowSteps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentStep(idx);
                  }}
                  className={`py-3 px-1 border-b-2 transition ${
                    currentStep === idx
                      ? "border-emerald-400 text-emerald-400 font-bold bg-emerald-950/60"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Step 0{idx + 1}
                </button>
              ))}
            </div>

            {/* Simulated Content Box */}
            <div className="p-6 sm:p-8 space-y-6 min-h-[220px] flex flex-col justify-center">
              <div className="flex items-center space-x-3 text-xs font-mono text-emerald-400">
                <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold shadow-md">
                  {workflowSteps[currentStep].title}
                </span>
                <span className="text-slate-400">• {workflowSteps[currentStep].meta}</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-100 font-sans leading-relaxed shadow-inner">
                {workflowSteps[currentStep].content}
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-300">Want this exact AI lead qualification engine for your business?</span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 shadow-md"
              >
                <span>Implement This Workflow</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <StrategyCallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
