"use client";

import React, { useState } from "react";
import { Star, Quote, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

export const Testimonial: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials = [
    {
      quote: "WhatyPie isn't just another WhatsApp tool or CRM. They came into our company, audited our broken sales funnel, and built an end-to-end AI system that handles 80% of our lead inquiries autonomously.",
      author: "Vikram Malhotra",
      title: "Chief Operating Officer",
      company: "Skyline Infra Developers",
      metrics: "Saved 120+ monthly staff hours",
    },
    {
      quote: "The speed of execution was incredible. Within 10 days, our medical clinic went from constant phone chaos to a smooth 24/7 AI booking assistant on WhatsApp. Our patient satisfaction scores hit 4.9/5.",
      author: "Dr. Ananya Sharma",
      title: "Managing Director",
      company: "HealthFirst Clinics Network",
      metrics: "Reduced patient no-shows by 88%",
    },
    {
      quote: "Our abandoned cart recovery revenue tripled in the first month. The WhatyPie implementation team didn't just hand us software — they monitored and fine-tuned our AI prompts until it performed like our best sales rep.",
      author: "Rohan Kapoor",
      title: "Head of Growth",
      company: "LuxeVibe E-Commerce",
      metrics: "3.4x ROI on AI Automation",
    },
  ];

  return (
    <section className="py-24 bg-slate-950 border-t border-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold uppercase tracking-widest">
            <Quote className="w-3.5 h-3.5" />
            <span>Executive Testimonials</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Trusted By Business Leaders
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Hear directly from CEOs, COOs, and founders who transformed their operations with WhatyPie.
          </p>
        </div>

        {/* Carousel / Card display */}
        <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-2xl shadow-2xl relative space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400" />
              ))}
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
              {testimonials[activeIndex].metrics}
            </span>
          </div>

          <p className="text-lg sm:text-2xl text-slate-100 font-medium leading-relaxed italic">
            "{testimonials[activeIndex].quote}"
          </p>

          <div className="flex items-center justify-between border-t border-slate-800/80 pt-6">
            <div>
              <h4 className="text-base font-bold text-white">{testimonials[activeIndex].author}</h4>
              <p className="text-xs text-slate-400">
                {testimonials[activeIndex].title} • <span className="text-emerald-400 font-medium">{testimonials[activeIndex].company}</span>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveIndex((prev) => (prev + 1) % testimonials.length)}
                className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
