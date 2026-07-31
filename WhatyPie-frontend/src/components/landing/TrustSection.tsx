"use client";

import React from "react";
import { Stethoscope, GraduationCap, Home, ShoppingBag, Landmark, HardHat, Hotel, Plane, Truck, Factory } from "lucide-react";

export const TrustSection: React.FC = () => {
  const metrics = [
    { label: "Autonomous Workflows Executed", value: "100+" },
    { label: "Average Response Time Reduction", value: "98.4%" },
    { label: "Client Operational Cost Saved", value: "₹45,000,000+" },
    { label: "System Reliability & Uptime", value: "99.99%" },
  ];

  const industries = [
    { name: "Healthcare", icon: Stethoscope },
    { name: "Real Estate", icon: Home },
    { name: "E-Commerce", icon: ShoppingBag },
    { name: "Finance", icon: Landmark },
    { name: "Education", icon: GraduationCap },
    { name: "Construction", icon: HardHat },
    { name: "Hospitality", icon: Hotel },
    { name: "Travel", icon: Plane },
    { name: "Logistics", icon: Truck },
    { name: "Manufacturing", icon: Factory },
  ];

  return (
    <section className="py-16 bg-slate-950/90 border-y border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {metrics.map((m) => (
            <div key={m.label} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center space-y-1 hover:border-emerald-500/40 transition">
              <div className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-300 bg-clip-text text-transparent">
                {m.value}
              </div>
              <div className="text-xs text-slate-300 font-medium">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Industry Trust Bar */}
        <div className="text-center space-y-6">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
            Empowering Transformation Across High-Growth Sectors
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {industries.map((ind) => {
              const Icon = ind.icon;
              return (
                <div
                  key={ind.name}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-medium hover:border-emerald-500/40 hover:text-white transition"
                >
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span>{ind.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
