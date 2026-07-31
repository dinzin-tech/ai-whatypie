"use client";

import React, { useState } from "react";
import { Search, BarChart2, Compass, Cpu, Rocket, Sliders, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";
import { StrategyCallModal } from "./StrategyCallModal";

export const ProcessSection: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: "01",
      title: "Discover",
      icon: Search,
      short: "Operational Audit",
      desc: "We conduct a comprehensive audit of your manual tasks, team workflows, and software stack to pinpoint high-friction bottlenecks.",
      output: "Operational Friction Matrix & Priority Map",
    },
    {
      num: "02",
      title: "Analyze",
      icon: BarChart2,
      short: "ROI Projection",
      desc: "Our engineers analyze data volumes, response lag, and labor costs to model exact ROI and time savings achievable through automation.",
      output: "Custom ROI & Cost Reduction Report",
    },
    {
      num: "03",
      title: "Design",
      icon: Compass,
      short: "System Blueprint",
      desc: "We architect the complete system — designing AI agent personas, database schemas, API triggers, and failure-handling fallback logic.",
      output: "Approved System Architecture Blueprint",
    },
    {
      num: "04",
      title: "Automate",
      icon: Cpu,
      short: "Build & Integration",
      desc: "Our developers construct your AI agents, configure official WhatsApp WABA channels, set up CRM data flows, and connect backend tools.",
      output: "Fully Built AI Ecosystem Ready for Testing",
    },
    {
      num: "05",
      title: "Deploy",
      icon: Rocket,
      short: "Seamless Go-Live",
      desc: "Following sandbox validation, we deploy your automation live with zero operational downtime and train your team on monitoring.",
      output: "Production Launch & Staff Onboarding",
    },
    {
      num: "06",
      title: "Optimize",
      icon: Sliders,
      short: "AI Fine-Tuning",
      desc: "We continuously monitor AI response accuracy, conversion rates, and conversation logs — fine-tuning prompts and vector memory.",
      output: "Weekly Optimization & Accuracy Reports",
    },
    {
      num: "07",
      title: "Scale",
      icon: TrendingUp,
      short: "Enterprise Expansion",
      desc: "As your business expands, we seamlessly scale system bandwidth, introduce new departmental agents, and unlock secondary automations.",
      output: "Compound Growth & Unlimited Scale",
    },
  ];

  return (
    <>
      <section id="process" className="py-24 bg-slate-950 relative overflow-hidden">
        {/* Ambient Green Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-widest">
              <Rocket className="w-4 h-4 text-emerald-400" />
              <span>Proven 7-Step Delivery Framework</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              From Initial Audit To Autonomous Scale
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              Our battle-tested methodology ensures zero business disruption and guaranteed ROI at every stage.
            </p>
          </div>

          {/* Timeline Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              return (
                <button
                  key={step.num}
                  onClick={() => setActiveStep(idx)}
                  className={`p-4 rounded-2xl border text-left transition duration-300 relative group flex flex-col justify-between h-36 ${
                    isActive
                      ? "bg-slate-900 border-emerald-400 shadow-[0_0_25px_rgba(5,150,105,0.3)] scale-105"
                      : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold ${isActive ? "text-emerald-400" : "text-slate-500"}`}>
                      {step.num}
                    </span>
                    <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{step.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{step.short}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Showcase Card */}
          <div className="p-8 md:p-10 rounded-3xl bg-slate-900/90 border border-emerald-500/30 backdrop-blur-xl shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-600 text-white rounded-full shadow-md">
                  Stage {steps[activeStep].num}
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {steps[activeStep].title} Phase
                </h3>
              </div>

              <p className="text-slate-200 text-base leading-relaxed">
                {steps[activeStep].desc}
              </p>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-3 text-xs text-slate-200">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <strong className="text-white">Key Deliverable: </strong>
                  <span className="text-emerald-300 font-medium">{steps[activeStep].output}</span>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-auto flex flex-col items-center lg:items-end space-y-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 hover:scale-105 transition flex items-center space-x-2"
              >
                <span>Start Phase 01 Audit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400">Free initial discovery consultation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <StrategyCallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
