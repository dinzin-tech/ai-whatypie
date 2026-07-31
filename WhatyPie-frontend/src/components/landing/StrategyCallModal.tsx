"use client";

import React, { useState } from "react";
import { X, CheckCircle, Calendar, Sparkles, Building, User, Mail, Phone, ArrowRight } from "lucide-react";

interface StrategyCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StrategyCallModal: React.FC<StrategyCallModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    industry: "Real Estate",
    teamSize: "10-50 employees",
    automationGoal: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-emerald-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] text-white overflow-hidden">
        {/* Glowing Background Orbs */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Free Executive Consultation</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
              Book Your Free AI Strategy Call
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Connect with our senior AI automation architects to audit your operations and build a customized transformation blueprint.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      required
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Work Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      required
                      type="email"
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      required
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Company Name *</label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      required
                      type="text"
                      placeholder="Acme Corp"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Industry</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="Real Estate">Real Estate</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                    <option value="Finance & Insurance">Finance & Insurance</option>
                    <option value="Education">Education</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Hospitality & Travel">Hospitality & Travel</option>
                    <option value="Professional Services">Professional Services</option>
                    <option value="Enterprise / Other">Enterprise / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Company Size</label>
                  <select
                    value={formData.teamSize}
                    onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                    className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="1-10 employees">1-10 employees</option>
                    <option value="10-50 employees">10-50 employees</option>
                    <option value="50-250 employees">50-250 employees</option>
                    <option value="250+ employees">250+ employees</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">What is your primary automation objective?</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Automate sales lead qualification, setup WhatsApp AI agents, sync CRM with internal tools..."
                  value={formData.automationGoal}
                  onChange={(e) => setFormData({ ...formData, automationGoal: e.target.value })}
                  className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? (
                  <span>Processing Request...</span>
                ) : (
                  <>
                    <span>Confirm & Book Strategy Session</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white">Strategy Session Requested!</h3>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              Thank you, <span className="text-emerald-400 font-semibold">{formData.name}</span>. Our AI automation solutions architect will reach out within 2 hours to confirm your session calendar.
            </p>
            <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700 max-w-md mx-auto text-left text-xs text-slate-400 space-y-1">
              <div><strong className="text-slate-200">Company:</strong> {formData.company}</div>
              <div><strong className="text-slate-200">Email:</strong> {formData.email}</div>
              <div><strong className="text-slate-200">Industry:</strong> {formData.industry}</div>
            </div>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="mt-4 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition"
            >
              Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
