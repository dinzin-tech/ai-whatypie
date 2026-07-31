"use client";

import React, { useState } from "react";
import { TrendingUp, CheckCircle, ArrowRight, Building, Award, Star } from "lucide-react";
import { StrategyCallModal } from "./StrategyCallModal";

export const CaseStudies: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const studies = [
    {
      company: "Apex Global Real Estate",
      industry: "Real Estate & Property Development",
      metric: "+340% Site Visit Conversions",
      challenge: "High ad spend on Facebook click-to-WhatsApp ads with 8-hour delayed manual follow-up by sales agents.",
      solution: "Implemented WhatyPie Real Estate AI Agent that instantly qualifies buyers, shares project brochures, and books site visits 24/7.",
      outcome: "Site visit appointments increased by 3.4x within 30 days while reducing sales team workload by 70%.",
    },
    {
      company: "MediLife Multi-Specialty Clinics",
      industry: "Healthcare & Medical",
      metric: "88% Reduction in No-Shows",
      challenge: "Clinic receptionists spent 5+ hours daily taking appointment phone calls and manually sending WhatsApp confirmation texts.",
      solution: "Deployed WhatyPie Healthcare Booking & Triage Agent synced directly with doctor calendars and WhatsApp API.",
      outcome: "Zero appointment scheduling delays and 88% reduction in patient no-shows via automated pre-visit WhatsApp reminders.",
    },
    {
      company: "UrbanFit E-Commerce",
      industry: "Retail & Consumer Goods",
      metric: "₹1.4M Recovered Revenue / Month",
      challenge: "High cart abandonment rate on Shopify store with minimal email open rates.",
      solution: "Set up WhatyPie 3-wave automated WhatsApp cart recovery drip with personalized discount vouchers.",
      outcome: "Recovered over ₹1.4M in abandoned cart sales every month with a 42% WhatsApp message conversion rate.",
    },
  ];

  return (
    <>
      <section id="case-studies" className="py-24 bg-slate-950/90 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-widest">
              <Award className="w-3.5 h-3.5" />
              <span>Proven Client Impact</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Real Business Transformation Case Studies
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">
              Discover how leading companies engineered scalable operations and exponential ROI using WhatyPie AI.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {studies.map((cs) => (
              <div
                key={cs.company}
                className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/40 transition duration-300 flex flex-col justify-between group relative space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition">
                        {cs.company}
                      </h3>
                      <p className="text-xs text-slate-400">{cs.industry}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-lg text-center">
                    {cs.metric}
                  </div>

                  <div className="space-y-3 text-xs text-slate-300">
                    <div>
                      <strong className="text-rose-400">The Challenge:</strong>
                      <p className="text-slate-400 mt-0.5">{cs.challenge}</p>
                    </div>

                    <div>
                      <strong className="text-cyan-400">WhatyPie AI Solution:</strong>
                      <p className="text-slate-400 mt-0.5">{cs.solution}</p>
                    </div>

                    <div>
                      <strong className="text-emerald-400">Measurable Outcome:</strong>
                      <p className="text-slate-200 font-medium mt-0.5">{cs.outcome}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-3 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-xs font-bold text-white rounded-xl transition flex items-center justify-center space-x-2"
                >
                  <span>Build Similar System</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <StrategyCallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
