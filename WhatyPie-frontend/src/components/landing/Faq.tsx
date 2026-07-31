"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, Sparkles } from "lucide-react";

export const Faq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How is WhatyPie different from a standard SaaS platform?",
      a: "Standard SaaS provides self-service software that leaves implementation up to you. WhatyPie acts as your full-service AI Automation Partner. We audit your operations, design custom AI agent personas, configure official Meta WABA channels, integrate your databases, and continuously optimize prompts for guaranteed ROI.",
    },
    {
      q: "How quickly can an AI automation system be built and deployed?",
      a: "Most custom AI automation projects go live within 7 to 14 business days. Following our 7-step process (Discover -> Design -> Automate -> Deploy), we test thoroughly in a sandbox before launching with zero operational downtime.",
    },
    {
      q: "Will this replace our existing sales or support team?",
      a: "No. Our AI agents are designed to empower human teams by handling 80% of repetitive baseline tasks — like lead qualification, instant FAQs, and appointment scheduling. High-value leads and complex cases are automatically routed to your human experts with full context.",
    },
    {
      q: "Is our company data secure and privacy compliant?",
      a: "Yes. Enterprise security is core to our infrastructure. All data transfers use 256-bit SSL encryption, end-to-end WABA encryption, and strict role-based access control. We do not use your private customer data to train public LLM models.",
    },
    {
      q: "Can WhatyPie integrate with our legacy CRM or internal software?",
      a: "Yes. WhatyPie features native integrations for popular tools (Shopify, HubSpot, Google Workspace, Stripe, Razorpay) as well as custom REST APIs and Webhook listeners to bridge any proprietary internal database or ERP system.",
    },
    {
      q: "What ongoing support and AI fine-tuning do you provide post-deployment?",
      a: "We don't disappear after go-live. Our engineering team provides continuous system monitoring, vector database updates, performance analytics, and periodic AI prompt adjustments to adapt as your business expands.",
    },
  ];

  return (
    <section id="faq" className="py-24 bg-slate-950 border-t border-slate-800 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-widest">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Everything You Need To Know
          </h2>
          <p className="text-slate-400 text-base">
            Clear answers for business owners, CEOs, and technology leaders.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between space-x-4 hover:bg-slate-800/40 transition"
                >
                  <span className="text-base font-bold text-white">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-emerald-400 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
