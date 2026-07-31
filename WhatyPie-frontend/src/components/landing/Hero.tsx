"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, ShieldCheck, Zap, Bot, Database, TrendingUp, Layers, Cpu, CheckCircle2, Phone, Video, MoreVertical, Search, Smile, Paperclip, Mic, Send, CheckCheck, Check } from "lucide-react";
import { StrategyCallModal } from "./StrategyCallModal";

export const Hero: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"visual-chat" | "visual-workflow">("visual-chat");

  return (
    <>
      <section className="relative min-h-screen pt-32 pb-20 overflow-hidden bg-slate-950 flex flex-col justify-center">
        {/* Background Gradients & Glow Effects - Signature Green Theme */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-gradient-to-tr from-emerald-600/25 via-emerald-500/15 to-teal-700/0 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-teal-600/10 rounded-full blur-[130px] pointer-events-none" />

        {/* Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#05966910_1px,transparent_1px),linear-gradient(to_bottom,#05966910_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Top Green Positioning Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-950/80 border border-emerald-500/40 backdrop-blur-md shadow-lg shadow-emerald-500/10">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-semibold text-emerald-300 uppercase tracking-widest">
                AI Automation & Business Transformation Company
              </span>
            </div>

            {/* Core Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
              Automate Your Business. <br />
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-300 bg-clip-text text-transparent">
                Accelerate Your Growth.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
              We design, build, and manage AI-powered automation systems that streamline operations, increase productivity, improve customer experiences, and help businesses grow faster.
            </p>

            {/* Call to Actions in Signature Login Green */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base rounded-2xl shadow-[0_0_35px_rgba(5,150,105,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-2 group"
              >
                <span>Book Free AI Strategy Call</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#services"
                className="w-full sm:w-auto px-8 py-4 bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 font-semibold text-base rounded-2xl backdrop-blur-md hover:text-white transition flex items-center justify-center space-x-2"
              >
                <span>Explore Solutions</span>
              </a>
            </div>

            {/* Proof Pills */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-medium text-slate-300">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Done-For-You Implementation</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Enterprise Security Compliant</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>24/7 AI System Optimization</span>
              </div>
            </div>
          </div>

          {/* REAL WHATSAPP THEME INTERFACE & VISUAL MOCKUP */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/30 backdrop-blur-2xl shadow-[0_25px_90px_rgba(0,0,0,0.9)] relative overflow-hidden">
              
              {/* Top View Selector Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 px-2">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-semibold">WhatyPie Intelligent AI Suite</span>
                </div>

                {/* View Switcher Tabs */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveTab("visual-chat")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      activeTab === "visual-chat"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Real WhatsApp AI Theme
                  </button>
                  <button
                    onClick={() => setActiveTab("visual-workflow")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      activeTab === "visual-workflow"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    AI Ecosystem Pipeline
                  </button>
                </div>
              </div>

              {activeTab === "visual-chat" ? (
                /* REAL WHATSAPP WEB UI THEME CONTAINER */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  
                  {/* Left Column: Authentic WhatsApp Interface Window */}
                  <div className="lg:col-span-8 rounded-2xl bg-[#0b141a] border border-[#202c33] shadow-2xl overflow-hidden text-slate-100 flex flex-col font-sans">
                    
                    {/* 1. Authentic WhatsApp Header Bar */}
                    <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-[#2a3942]">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-[#00a884]/40">
                            <Bot className="w-6 h-6 text-slate-950" />
                          </div>
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00a884] ring-2 ring-[#202c33]" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#e9edef] flex items-center space-x-1.5">
                            <span>WhatyPie AI Assistant</span>
                            <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-[#00a884]/20 text-[#00a884] rounded border border-[#00a884]/30">
                              Official WABA
                            </span>
                          </div>
                          <div className="text-[11px] text-[#8696a0] flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse" />
                            <span>online • 24/7 Cognitive AI Agent</span>
                          </div>
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center space-x-4 text-[#8696a0]">
                        <Video className="w-4 h-4 cursor-pointer hover:text-[#e9edef] transition" />
                        <Phone className="w-4 h-4 cursor-pointer hover:text-[#e9edef] transition" />
                        <Search className="w-4 h-4 cursor-pointer hover:text-[#e9edef] transition" />
                        <MoreVertical className="w-4 h-4 cursor-pointer hover:text-[#e9edef] transition" />
                      </div>
                    </div>

                    {/* 2. WhatsApp Chat Canvas (Dark Theme Background) */}
                    <div className="p-4 space-y-4 text-xs min-h-[300px] max-h-[360px] overflow-y-auto bg-[#0b141a] bg-[radial-gradient(#111b21_1px,transparent_1px)] [bg-size:16px_16px]">
                      
                      {/* Date Separator Badge */}
                      <div className="flex justify-center my-2">
                        <span className="bg-[#111b21] text-[#8696a0] text-[10px] font-mono px-3 py-1 rounded-md border border-[#202c33] shadow-sm">
                          TODAY • SECURE END-TO-END ENCRYPTED
                        </span>
                      </div>

                      {/* Incoming Customer Message (Left Aligned - Dark Grey Bubble) */}
                      <div className="flex justify-start">
                        <div className="bg-[#202c33] text-[#e9edef] p-3 rounded-2xl rounded-tl-none max-w-[85%] shadow-md space-y-1 relative border border-[#2a3942]/60">
                          <div className="text-[10px] font-bold text-[#00a884]">Lead (Real Estate Prospect)</div>
                          <p className="leading-relaxed">
                            Hi! We run a real estate firm and need an AI system on WhatsApp to qualify leads from Instagram ads and book site visits directly into Google Calendar.
                          </p>
                          <div className="text-[9px] text-[#8696a0] text-right font-mono mt-1">10:42 AM</div>
                        </div>
                      </div>

                      {/* Outgoing AI Response Message (Right Aligned - Official WhatsApp Green Bubble) */}
                      <div className="flex justify-end">
                        <div className="bg-[#005c4b] text-[#e9edef] p-3.5 rounded-2xl rounded-tr-none max-w-[90%] shadow-lg space-y-2 relative border border-[#02735e]">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-[#8696a0] border-b border-[#007a63] pb-1">
                            <span className="text-white font-bold flex items-center space-x-1">
                              <Bot className="w-3.5 h-3.5 text-[#00a884]" />
                              <span>WhatyPie AI Assistant</span>
                            </span>
                            <span className="text-[9px] bg-[#00a884]/30 text-[#aebac1] px-1.5 py-0.5 rounded font-mono">
                              ⚡ 0.2s Response
                            </span>
                          </div>
                          
                          <p className="leading-relaxed text-[#e9edef]">
                            Hello! Absolutely. Our Real Estate AI Blueprint automatically handles lead qualification, distributes digital brochures, and reserves site visit appointments.
                          </p>

                          {/* Interactive WhatsApp Buttons Inside Message */}
                          <div className="space-y-1.5 pt-1">
                            <button className="w-full py-1.5 px-3 bg-[#202c33] hover:bg-[#2a3942] text-[#53bdeb] font-semibold text-[11px] rounded-lg text-center border border-[#3b4a54] transition flex items-center justify-center space-x-1">
                              <span>📅 1. Reserve Site Visit Slot (Tomorrow 3:30 PM)</span>
                            </button>
                            <button className="w-full py-1.5 px-3 bg-[#202c33] hover:bg-[#2a3942] text-[#53bdeb] font-semibold text-[11px] rounded-lg text-center border border-[#3b4a54] transition flex items-center justify-center space-x-1">
                              <span>📄 2. Download Luxury Brochure PDF</span>
                            </button>
                          </div>

                          <div className="flex items-center justify-end space-x-1 text-[9px] text-[#8696a0] font-mono pt-1">
                            <span>10:42 AM</span>
                            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                          </div>
                        </div>
                      </div>

                      {/* Client Reply Confirmation */}
                      <div className="flex justify-start">
                        <div className="bg-[#202c33] text-[#e9edef] p-3 rounded-2xl rounded-tl-none max-w-[80%] shadow-md space-y-1 border border-[#2a3942]/60">
                          <div className="text-[10px] font-bold text-[#00a884]">Lead</div>
                          <p className="leading-relaxed">Tomorrow 3:30 PM works great! Please confirm.</p>
                          <div className="text-[9px] text-[#8696a0] text-right font-mono">10:43 AM</div>
                        </div>
                      </div>

                      {/* AI Confirmation & CRM Sync */}
                      <div className="flex justify-end">
                        <div className="bg-[#005c4b] text-[#e9edef] p-3 rounded-2xl rounded-tr-none max-w-[90%] shadow-lg space-y-1 border border-[#02735e]">
                          <p className="text-[11px]">
                            ✅ <strong>Booking Confirmed!</strong> Site visit reserved for Tomorrow @ 3:30 PM. Calendar invite dispatched & CRM lead record updated (Score: 96/100 VIP).
                          </p>
                          <div className="flex items-center justify-end space-x-1 text-[9px] text-[#8696a0] font-mono">
                            <span>10:43 AM</span>
                            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. WhatsApp Bottom Input Bar */}
                    <div className="bg-[#202c33] p-3 flex items-center space-x-3 border-t border-[#2a3942]">
                      <Smile className="w-5 h-5 text-[#8696a0] cursor-pointer hover:text-[#e9edef]" />
                      <Paperclip className="w-5 h-5 text-[#8696a0] cursor-pointer hover:text-[#e9edef]" />
                      <div className="flex-1 bg-[#2a3942] rounded-xl px-4 py-2 text-xs text-[#8696a0] font-sans flex items-center justify-between">
                        <span>Type a message or trigger AI automation...</span>
                        <span className="text-[10px] text-[#00a884] font-mono font-semibold">AI Active</span>
                      </div>
                      <Mic className="w-5 h-5 text-[#8696a0] cursor-pointer hover:text-[#e9edef]" />
                      <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-slate-950 cursor-pointer shadow-md">
                        <Send className="w-4 h-4 fill-slate-950" />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live System Intelligence Cards */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <span>AI Execution Metrics</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                          Live Active
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                          <div className="text-[11px] text-slate-400">Response Speed</div>
                          <div className="text-base font-extrabold text-emerald-400 font-mono">0.2 Seconds (Sub-second)</div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                          <div className="text-[11px] text-slate-400">Lead Qualification Rate</div>
                          <div className="text-base font-extrabold text-emerald-400 font-mono">94.8% Accuracy</div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                          <div className="text-[11px] text-slate-400">CRM & Calendar Integration</div>
                          <div className="text-xs font-bold text-emerald-300 font-mono flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Auto-Synced (Zero Manual Work)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/40 text-center space-y-3 shadow-xl">
                      <div className="text-xs font-bold text-white">Deploy this exact WhatsApp AI engine for your business</div>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition shadow-lg shadow-emerald-600/30"
                      >
                        Book Free AI Strategy Call →
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* VISUAL ECOSYSTEM PIPELINE */
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {[
                    { title: "Business Trigger", desc: "WhatsApp, Ads, Forms & APIs", icon: Layers },
                    { title: "AI Cognition", desc: "LLM Intent & RAG Memory", icon: Cpu },
                    { title: "Automation Engine", desc: "Zero-delay workflows", icon: Zap },
                    { title: "Unified CRM", desc: "Auto contact & deal sync", icon: Database },
                    { title: "Campaign Nurture", desc: "Drip & follow-up bot", icon: Bot },
                    { title: "Growth Analytics", desc: "ROI & Revenue tracking", icon: TrendingUp },
                  ].map((node, i) => {
                    const Icon = node.icon;
                    return (
                      <div key={i} className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 text-center space-y-2 hover:border-emerald-400 transition">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                          <Icon className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold text-white">{node.title}</h4>
                        <p className="text-[10px] text-slate-400 leading-tight">{node.desc}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <StrategyCallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
