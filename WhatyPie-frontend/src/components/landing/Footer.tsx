"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Mail, Phone, Globe, ArrowUpRight, Shield } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 pt-16 pb-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center space-x-3 group">
              <Image
                src="/assets/logos/whatypie-logo.png"
                alt="WhatyPie Logo"
                width={190}
                height={52}
                className="h-11 sm:h-12 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
              />
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed">
              WhatyPie is an enterprise AI Automation & Business Transformation Agency. We design, build, and optimize intelligent business systems.
            </p>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <a href="https://www.whatypie.in" target="_blank" rel="noreferrer" className="hover:text-white transition">
                  www.whatypie.in
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <a href="mailto:contact@whatypie.in" className="hover:text-white transition">
                  contact@whatypie.in
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <a href="tel:7411001943" className="hover:text-white transition">
                  +91 7411001943
                </a>
              </div>
            </div>
          </div>

          {/* Solutions Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Solutions</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#solutions" className="hover:text-emerald-400 transition">AI Agents</a></li>
              <li><a href="#solutions" className="hover:text-emerald-400 transition">Customer Support AI</a></li>
              <li><a href="#solutions" className="hover:text-emerald-400 transition">Sales Automation</a></li>
              <li><a href="#solutions" className="hover:text-emerald-400 transition">Lead Qualification</a></li>
              <li><a href="#solutions" className="hover:text-emerald-400 transition">Marketing Automation</a></li>
              <li><a href="#solutions" className="hover:text-emerald-400 transition">Appointment Booking</a></li>
            </ul>
          </div>

          {/* Services & Industries */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Industries</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#industries" className="hover:text-emerald-400 transition">Real Estate</a></li>
              <li><a href="#industries" className="hover:text-emerald-400 transition">Healthcare & Clinics</a></li>
              <li><a href="#industries" className="hover:text-emerald-400 transition">E-Commerce & Retail</a></li>
              <li><a href="#industries" className="hover:text-emerald-400 transition">Finance & Insurance</a></li>
              <li><a href="#industries" className="hover:text-emerald-400 transition">Education & Admissions</a></li>
              <li><a href="#industries" className="hover:text-emerald-400 transition">Logistics & Enterprise</a></li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Company & Legal</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#why-us" className="hover:text-emerald-400 transition">About WhatyPie</a></li>
              <li><a href="#process" className="hover:text-emerald-400 transition">Our Delivery Process</a></li>
              <li><a href="#case-studies" className="hover:text-emerald-400 transition">Case Studies</a></li>
              <li><a href="#faq" className="hover:text-emerald-400 transition">FAQ</a></li>
              <li><Link href="/auth/login" className="hover:text-emerald-400 transition">Client Login</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-4 sm:space-y-0">
          <div>
            © {new Date().getFullYear()} WhatyPie Systems. All rights reserved. Building Intelligent Businesses Through AI.
          </div>
          <div className="flex items-center space-x-4">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Security & Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
