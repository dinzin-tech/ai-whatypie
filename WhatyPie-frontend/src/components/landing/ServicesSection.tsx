"use client";

import React, { useState } from "react";
import { Bot, Zap, MessageSquare, Database, Megaphone, Lightbulb, Code2, GitMerge, ArrowRight, CheckCircle, Sparkles, Sliders, ShieldCheck } from "lucide-react";
import { StrategyCallModal } from "./StrategyCallModal";

export const ServicesSection: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const services = [
    {
      id: "ai-automation",
      title: "AI Automation",
      subtitle: "Autonomous Agents & Cognitive Pipelines",
      description: "We deploy intelligent AI agents that handle complex decision-making, natural language inquiries, and multi-step tasks across your business.",
      icon: Bot,
      badge: "LLM Agents",
      highlights: ["Autonomous customer interaction", "Custom RAG knowledge integration", "Context-aware decision trees"],
    },
    {
      id: "business-automation",
      title: "Business Automation",
      subtitle: "End-to-End Operational Efficiency",
      description: "Streamline day-to-day business operations by eliminating manual handoffs, repetitive data entry, and fragmented operational bottlenecks.",
      icon: Zap,
      badge: "Zero Latency",
      highlights: ["Cross-departmental task routing", "Automated compliance checks", "Real-time process monitoring"],
    },
    {
      id: "whatsapp-automation",
      title: "WhatsApp Automation",
      subtitle: "Enterprise Conversational AI",
      description: "Harness official WhatsApp Business API with AI agents for instant customer support, catalog browsing, and instant appointment booking.",
      icon: MessageSquare,
      badge: "Official WABA",
      highlights: ["Official Meta API integration", "Interactive flow templates", "24/7 autonomous response"],
    },
    {
      id: "crm-solutions",
      title: "CRM Solutions",
      subtitle: "Unified Contact & Pipeline Intelligence",
      description: "Implement and customize centralized CRM architectures that track customer journeys, predict intent, and automate sales follow-ups.",
      icon: Database,
      badge: "Pipeline Sync",
      highlights: ["Single-pane-of-glass customer view", "Automated lead scoring", "Multi-channel activity logging"],
    },
    {
      id: "marketing-automation",
      title: "Marketing Automation",
      subtitle: "Hyper-Targeted Nurturing & Growth",
      description: "Convert leads faster with automated multi-wave drip campaigns, instant ad lead capture, and personalized re-engagement triggers.",
      icon: Megaphone,
      badge: "High ROI",
      highlights: ["Click-to-WhatsApp ad routing", "Dynamic segment triggers", "Campaign ROI analytics"],
    },
    {
      id: "ai-consulting",
      title: "AI Consulting",
      subtitle: "Strategic Audit & Systems Design",
      description: "Our AI architects evaluate your existing workflows, identify highest-ROI automation opportunities, and design custom transformation roadmaps.",
      icon: Lightbulb,
      badge: "Executive Audit",
      highlights: ["Operational bottleneck audit", "ROI & cost-reduction modeling", "Implementation blueprint"],
    },
    {
      id: "custom-software",
      title: "Custom AI Solutions",
      subtitle: "Bespoke LLM Models & Integrations",
      description: "When off-the-shelf tools fall short, we build tailored AI microservices, fine-tuned domain models, and custom backend API connectors.",
      icon: Code2,
      badge: "Custom Code",
      highlights: ["Private LLM deployment", "Custom API & webhook bridges", "Enterprise security compliance"],
    },
    {
      id: "workflow-automation",
      title: "Workflow Automation",
      subtitle: "Seamless Inter-App Connectivity",
      description: "Connect your accounting, ERP, email, and database software into a self-healing, synchronized operational grid.",
      icon: GitMerge,
      badge: "Webhooks Grid",
      highlights: ["Multi-app synchronization", "Automated document processing", "Zero-data-loss queueing"],
    },
  ];

  return (
    <>
      <section id="services" className="py-24 bg-slate-950 relative overflow-hidden">
        {/* Green Theme Background Glows */}
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-96 h-96 bg-teal-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Full-Stack AI Transformation Capabilities</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              What We Do
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              We deliver complete end-to-end AI systems — combining custom strategy, intelligent software, and ongoing optimization.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.id}
                  className="group relative p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(5,150,105,0.2)] flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition duration-300">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/30">
                        {s.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition">
                        {s.title}
                      </h3>
                      <p className="text-xs font-semibold text-emerald-400/90 mb-2">{s.subtitle}</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{s.description}</p>
                    </div>

                    {/* Visual Highlights list */}
                    <div className="space-y-2 pt-3 border-t border-slate-800/80">
                      {s.highlights.map((h, i) => (
                        <div key={i} className="flex items-center space-x-2 text-[11px] text-slate-300">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-6 flex items-center space-x-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition group/btn pt-2"
                  >
                    <span>Discuss Solution Blueprint</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
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
