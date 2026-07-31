"use client";

import React, { useState } from "react";
import { Stethoscope, GraduationCap, Home, ShoppingBag, Landmark, HardHat, Hotel, Truck, Building2, Briefcase, ArrowRight } from "lucide-react";
import { StrategyCallModal } from "./StrategyCallModal";

export const IndustriesSection: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const industries = [
    {
      title: "Real Estate",
      icon: Home,
      stat: "+320% Qualified Buyers",
      useCase: "Instant site visit scheduling, property catalog distribution via WhatsApp, and automated lead scoring for property developers.",
      deliverables: ["WhatsApp Property Catalog", "Automated Site Visit Booking", "Agent Lead Escalation"],
    },
    {
      title: "Healthcare & Clinics",
      icon: Stethoscope,
      stat: "75% Drop-off Reduction",
      useCase: "Patient appointment scheduling, pre-visit medical questionnaires, automated prescription follow-ups, and 24/7 triage support.",
      deliverables: ["Patient Triage AI Bot", "Doctor Schedule Sync", "Appointment Reminders"],
    },
    {
      title: "E-Commerce & Retail",
      icon: ShoppingBag,
      stat: "4.2x Cart Recovery",
      useCase: "Automated abandoned cart recovery on WhatsApp, order tracking updates, product recommendation AI, and instant refund status.",
      deliverables: ["Cart Recovery Drip", "Real-Time Order Tracking", "Conversational Storefront"],
    },
    {
      title: "Finance & Insurance",
      icon: Landmark,
      stat: "85% Faster KYC",
      useCase: "Automated loan eligibility checks, document collection via chat, insurance claim status updates, and premium renewal reminders.",
      deliverables: ["KYC Document Collector", "Loan Qualification Flow", "Renewal Notifications"],
    },
    {
      title: "Education & Institutes",
      icon: GraduationCap,
      stat: "2.8x Admissions",
      useCase: "Student admission inquiry response, course brochure distribution, fee payment links, and entrance exam counseling AI.",
      deliverables: ["Admissions Helper Bot", "Brochure Auto-Delivery", "Fee Reminders"],
    },
    {
      title: "Hospitality & Travel",
      icon: Hotel,
      stat: "90% Guest Satisfaction",
      useCase: "Instant hotel room booking, digital concierge recommendations, itinerary updates, and automated post-checkout feedback.",
      deliverables: ["Digital Concierge AI", "Booking Confirmation Engine", "Guest Feedback Collector"],
    },
    {
      title: "Logistics & Supply Chain",
      icon: Truck,
      stat: "Zero Dispatch Delays",
      useCase: "Driver shipment updates, automated proof-of-delivery collection, warehouse inventory sync, and supplier coordination.",
      deliverables: ["Delivery Status Bot", "Supplier Portal Bridge", "Dispatch Alerts"],
    },
    {
      title: "Enterprise & Services",
      icon: Building2,
      stat: "10x Operational Speed",
      useCase: "Custom enterprise multi-tenant CRM deployment, employee ticket routing, security compliance logging, and global AI support.",
      deliverables: ["Multi-Tenant CRM Suite", "Custom API Integrations", "Dedicated Account Manager"],
    },
  ];

  return (
    <>
      <section id="industries" className="py-24 bg-slate-950/95 border-t border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-widest">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <span>Industry Transformation Blueprints</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Engineered For Your Specific Industry
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              We don't provide generic software. We deliver pre-configured industry blueprints fine-tuned for your sector.
            </p>
          </div>

          {/* Industry Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {industries.map((ind) => {
              const Icon = ind.icon;
              return (
                <div
                  key={ind.title}
                  className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold text-emerald-300 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/30">
                        {ind.stat}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition">
                      {ind.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed">{ind.useCase}</p>

                    <div className="space-y-1 pt-3 border-t border-slate-800/60">
                      {ind.deliverables.map((d, i) => (
                        <div key={i} className="text-[11px] text-slate-300 flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-xs font-bold text-slate-200 transition flex items-center justify-center space-x-2"
                  >
                    <span>View Blueprint</span>
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
