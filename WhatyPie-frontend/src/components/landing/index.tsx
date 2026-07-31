"use client";

import React from "react";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { TrustSection } from "./TrustSection";
import { ServicesSection } from "./ServicesSection";
import { TransformationSection } from "./TransformationSection";
import { SolutionsSection } from "./SolutionsSection";
import { IndustriesSection } from "./IndustriesSection";
import { ProcessSection } from "./ProcessSection";
import { WhyChooseUs } from "./WhyChooseUs";
import { PlatformSection } from "./PlatformSection";
import { AiShowcase } from "./AiShowcase";
import { CaseStudies } from "./CaseStudies";
import { Testimonial } from "./Testimonial";
import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";
import { Footer } from "./Footer";

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Header />

      {/* Hero Section */}
      <Hero />

      {/* Trust & Industries Counter */}
      <TrustSection />

      {/* Services Section ("What We Do") */}
      <ServicesSection />

      {/* Transformation Comparison ("Before & After") */}
      <TransformationSection />

      {/* AI Solutions Matrix */}
      <SolutionsSection />

      {/* Industry Blueprints */}
      <IndustriesSection />

      {/* 7-Step Delivery Process */}
      <ProcessSection />

      {/* Operating Philosophy ("Why Choose Us") */}
      <WhyChooseUs />

      {/* Software Platform Capabilities */}
      <PlatformSection />

      {/* Interactive AI Simulation */}
      <AiShowcase />

      {/* Case Studies */}
      <CaseStudies />

      {/* Executive Testimonials */}
      <Testimonial />

      {/* FAQ Accordion */}
      <Faq />

      {/* Final High-Converting CTA */}
      <FinalCta />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;
