"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, CheckCircle2, Shield } from "lucide-react";
import { StrategyCallModal } from "./StrategyCallModal";

export const FinalCta: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="py-24 bg-slate-950 relative overflow-hidden">
        {/* Green Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-emerald-600/20 via-emerald-500/20 to-teal-600/20 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="p-10 sm:p-16 rounded-3xl bg-slate-900/90 border border-emerald-500/30 backdrop-blur-2xl text-center space-y-8 shadow-[0_0_80px_rgba(5,150,105,0.2)] relative overflow-hidden">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Transform Your Operations Today</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Ready to Build an <br />
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-300 bg-clip-text text-transparent">
                AI-Powered Business?
              </span>
            </h2>

            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Let's identify the highest-impact automation opportunities in your business and build a system that saves time, reduces costs, and accelerates growth.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white font-bold text-base rounded-2xl shadow-xl shadow-emerald-600/30 hover:scale-105 transition flex items-center justify-center space-x-2 group"
              >
                <span>Book Free AI Strategy Call</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-base rounded-2xl transition"
              >
                Talk to Sales
              </button>
            </div>

            <div className="flex items-center justify-center space-x-6 pt-4 text-xs font-medium text-slate-300">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>No Commitment Required</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>100% Confidential Audit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <StrategyCallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
