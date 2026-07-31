"use client";

import React, { useState } from "react";
import { ShieldCheck, Cpu, Layers, RefreshCw, Users, ArrowRight } from "lucide-react";
import { StrategyCallModal } from "./StrategyCallModal";

export const WhyChooseUs: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pillars = [
    {
      icon: Cpu,
      title: "We don't sell software.",
      highlight: "We build systems.",
      desc: "Software is useless without proper business logic. We design custom AI architectures that reflect your exact operational rules and company culture.",
    },
    {
      icon: Layers,
      title: "We don't automate tasks.",
      highlight: "We automate businesses.",
      desc: "Isolated zap bots create fragmented chaos. We connect your entire workflow — from initial ad click to final invoice and customer review.",
    },
    {
      icon: Users,
      title: "We don't replace people.",
      highlight: "We empower teams.",
      desc: "Our AI agents handle repetitive 80% baseline tasks so your human team can focus on high-value strategy, relationships, and deal closing.",
    },
    {
      icon: RefreshCw,
      title: "We don't disappear after launch.",
      highlight: "We continuously optimize.",
      desc: "AI requires ongoing memory updates and prompt refinement. We act as your dedicated AI engineering team for continuous accuracy.",
    },
  ];

  return (
    <>
      <section id="why-us" className="py-24 bg-slate-950/95 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Title */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Our Operating Philosophy</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Why Forward-Thinking Leaders Partner With Us
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              We operate as your dedicated AI Transformation Partner rather than a transactional SaaS vendor.
            </p>
          </div>

          {/* Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pillars.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition duration-300 relative group space-y-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-105 transition">
                    <Icon className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-400">
                      {p.title} <br />
                      <span className="text-2xl font-extrabold text-white group-hover:text-emerald-400 transition">
                        {p.highlight}
                      </span>
                    </h3>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Banner Callout */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-1">
              <h4 className="text-xl font-bold text-white">Ready to partner with a true AI implementation team?</h4>
              <p className="text-xs text-slate-300">Schedule a 1-on-1 strategy call with our lead automation architects.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center space-x-2 flex-shrink-0"
            >
              <span>Book Strategy Call</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <StrategyCallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
