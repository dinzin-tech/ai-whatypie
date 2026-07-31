"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Sparkles } from "lucide-react";
import { useAppSelector } from "@/src/redux/hooks";
import { ROUTES } from "@/src/constants";
import { StrategyCallModal } from "./StrategyCallModal";

export const Header: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Services", href: "#services" },
    { name: "Solutions", href: "#solutions" },
    { name: "Industries", href: "#industries" },
    { name: "Process", href: "#process" },
    { name: "Why Us", href: "#why-us" },
    { name: "Platform", href: "#platform" },
    { name: "Case Studies", href: "#case-studies" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-slate-950/90 backdrop-blur-xl border-b border-emerald-500/20 py-3 shadow-2xl shadow-black/50"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative flex items-center py-1">
                <Image
                  src="/assets/logos/whatypie-logo.png"
                  alt="WhatyPie Logo"
                  width={210}
                  height={60}
                  className="h-12 sm:h-14 w-auto object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/80 p-1.5 rounded-full border border-slate-800 backdrop-blur-md">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-emerald-950/80 hover:text-emerald-300 rounded-full transition"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* Action CTAs */}
            <div className="hidden lg:flex items-center space-x-3">
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    router.push(ROUTES.Dashboard);
                  } else {
                    router.push(ROUTES.Login);
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                {isAuthenticated ? "Dashboard" : "Sign In"}
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-full shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95 transition"
              >
                Book AI Strategy Call
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="lg:hidden flex items-center space-x-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-full shadow-md"
              >
                Book Call
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-950/95 backdrop-blur-2xl border-b border-slate-800 px-4 pt-4 pb-6 space-y-3 mt-3 animate-fadeIn">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-slate-200 hover:bg-emerald-950/60 hover:text-emerald-300 rounded-xl transition"
              >
                {link.name}
              </a>
            ))}

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isAuthenticated) {
                    router.push(ROUTES.Dashboard);
                  } else {
                    router.push(ROUTES.Login);
                  }
                }}
                className="w-full py-2.5 text-center text-sm font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-xl"
              >
                {isAuthenticated ? "Go to Dashboard" : "Sign In"}
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsModalOpen(true);
                }}
                className="w-full py-3 text-center text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg shadow-emerald-600/30"
              >
                Book Free AI Strategy Call
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Booking Modal */}
      <StrategyCallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
