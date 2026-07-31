"use client";

import React, { useState } from "react";
import { Bot, Headphones, TrendingUp, Filter, Megaphone, Cpu, CreditCard, Users, CalendarCheck, ArrowRight } from "lucide-react";
import { StrategyCallModal } from "./StrategyCallModal";

export const SolutionsSection: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const solutions = [
    {
      title: "AI Agents",
      icon: Bot,
      category: "Cognitive AI",
      desc: "Deploy autonomous digital workers equipped with natural language understanding, context memory, and task execution capabilities.",
      features: ["Custom persona & tone configuration", "RAG vector database connection", "Multi-turn conversation history"],
    },
    {
      title: "Customer Support Automation",
      icon: Headphones,
      category: "Support",
      desc: "Resolve 80%+ of incoming support inquiries instantly across WhatsApp, web chat, and email without human intervention.",
      features: ["Instant SLA response guarantees", "Automated ticket categorization", "Seamless human agent handoff"],
    },
    {
      title: "Sales Automation & Nurturing",
      icon: TrendingUp,
      category: "Sales",
      desc: "Convert high-intent prospects faster with automated multi-channel sequences, interactive demos, and pricing delivery.",
      features: ["Automated follow-up reminders", "Interactive quotation delivery", "Sales rep assignment triggers"],
    },
    {
      title: "Lead Qualification & Scoring",
      icon: Filter,
      category: "Sales & Marketing",
      desc: "Filter out low-intent leads before they reach your sales team using dynamic conversational scoring algorithms.",
      features: ["BANT qualification questions", "Instant CRM lead scoring", "High-priority alert triggers"],
    },
    {
      title: "Marketing Automation",
      icon: Megaphone,
      category: "Marketing",
      desc: "Launch targeted broadcasting campaigns, automated customer segments, and click-to-WhatsApp ad conversions.",
      features: ["Click-to-WhatsApp ad integration", "Behavioral segment triggers", "Campaign conversion analytics"],
    },
    {
      title: "Internal Workflow Automation",
      icon: Cpu,
      category: "Operations",
      desc: "Bridge operational tools, Google Workspace, Slack, database records, and custom internal software.",
      features: ["Zero-code workflow canvas", "Custom webhook listener", "Error monitoring & auto-retry"],
    },
    {
      title: "Finance & Billing Automation",
      icon: CreditCard,
      category: "Finance",
      desc: "Automate payment links, invoice generation, subscription renewals, and payment reminder notifications.",
      features: ["Stripe & Razorpay auto-sync", "Automated payment receipts", "Overdue reminder escalation"],
    },
    {
      title: "HR & Onboarding Automation",
      icon: Users,
      category: "HR",
      desc: "Streamline candidate interviews, document collection, employee onboarding checklists, and internal FAQs.",
      features: ["Automated document upload verification", "Employee policy AI search", "Training module tracking"],
    },
    {
      title: "Appointment & Booking Systems",
      icon: CalendarCheck,
      category: "Operations",
      desc: "Allow customers to book, reschedule, or cancel consultations directly inside WhatsApp or web widgets.",
      features: ["Google & Outlook Calendar sync", "Automated SMS/WhatsApp reminders", "No-show reduction workflows"],
    },
  ];

  return (
    <>
      <section id="solutions" className="py-24 bg-slate-950 relative overflow-hidden">
        {/* Green Glow */}
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-widest">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Enterprise AI Solutions Matrix</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Tailored AI Solutions For Every Department
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              Explore specialized AI automation modules engineered to solve specific operational challenges.
            </p>
          </div>

          {/* Solutions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {solutions.map((sol) => {
              const Icon = sol.icon;
              return (
                <div
                  key={sol.title}
                  className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/30">
                        {sol.category}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition">
                        {sol.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">{sol.desc}</p>
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-slate-800/60">
                      {sol.features.map((f, i) => (
                        <div key={i} className="text-[11px] text-slate-300 flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-xs font-bold text-slate-200 transition flex items-center justify-center space-x-2"
                  >
                    <span>Request System Demo</span>
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
