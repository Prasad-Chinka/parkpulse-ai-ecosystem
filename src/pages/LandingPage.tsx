import React, { useState } from 'react';
import {
  Car, QrCode, ShieldCheck, Zap, ArrowRight, Sparkles,
  Layers, Clock, Compass, CheckCircle2, Database, MapPin,
  Bot, Navigation, ChevronRight, ArrowUpRight, KeyRound
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onExploreStations: () => void;
  onOpenScanner: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onExploreStations,
  onOpenScanner,
}) => {
  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* SECTION 1: HERO BANNER (SaaS Intelligent Mobility Style) */}
      <section className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-300">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=2000&q=80"
            alt="ParkPulse AI Architectural Parking Terminal"
            className="w-full h-full object-cover object-center opacity-10 filter brightness-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/70 z-10" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl z-10 pointer-events-none" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-20 p-8 sm:p-12 lg:p-16 max-w-3xl space-y-6">
          {/* Micro Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide uppercase font-mono shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Vijayawada Smart Mobility & Real-Time Parking System</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
            Intelligent Parking Across <span className="text-blue-600">Vijayawada</span> with Live Slot Allocation
          </h1>

          {/* Description */}
          <p className="text-slate-600 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl font-normal">
            Eliminate parking search delays across Governor Peta, Vijayawada Junction, Dr. NTR Complex, KR Market, Hanumanpet, and Gannavaram Airport. ParkPulse AI delivers real-time slot occupancy, instant QR gate barrier verification, and 24/7 Gemini 3.8 AI Concierge guidance.
          </p>

          {/* Action Buttons styled with Royal Blue Accent */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onExploreStations}
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-md shadow-blue-500/20 flex items-center gap-2.5 transition-all duration-200 cursor-pointer hover:scale-[1.01]"
            >
              <MapPin className="w-4 h-4 text-white" />
              <span>Explore Vijayawada Stations</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onGetStarted}
              className="px-6 py-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 text-slate-800 hover:text-blue-600 font-semibold text-sm transition-all duration-200 flex items-center gap-2.5 cursor-pointer"
            >
              <Car className="w-4 h-4 text-blue-600" />
              <span>Interactive Slot Grid</span>
            </button>
          </div>
        </div>

        {/* Live System Stats Strip */}
        <div className="relative z-20 border-t border-slate-100 bg-slate-50/70 backdrop-blur-md px-8 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 font-mono">
            <div className="space-y-0.5">
              <span className="text-2xl sm:text-3xl font-black text-blue-600">6 Hubs</span>
              <span className="block text-xs text-slate-500 font-sans">Vijayawada Stations</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">310+</span>
              <span className="block text-xs text-slate-500 font-sans">Monitored Bays</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">100%</span>
              <span className="block text-xs text-slate-500 font-sans">Contactless QR Access</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-2xl sm:text-3xl font-black text-blue-600">Gemini 3.8</span>
              <span className="block text-xs text-slate-500 font-sans">AI Mobility Assistant</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: THREE HORIZONTAL FEATURE CARDS */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600">
              End-to-End Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Smart Parking Infrastructure
            </h2>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md">
            Seamlessly integrating smart hardware sensors, encrypted mobile passes, and 24/7 AI concierges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Slot Allocation */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Real-Time Slot Allocation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Live interactive multi-floor bay visualization with color-coded bay status (Available, Occupied, Reserved).
              </p>
            </div>
            <button
              onClick={onGetStarted}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer pt-2"
            >
              <span>Explore Interactive Grid</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: QR Gate Barrier Access */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">QR Gate Barrier Verification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Instant digital QR tickets generated upon booking. Scan at the boom barrier or operator station for contactless entry.
              </p>
            </div>
            <button
              onClick={onOpenScanner}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 cursor-pointer pt-2"
            >
              <span>Launch Operator Scanner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: AI Assistant */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Gemini 3.8 AI Concierge</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Always-on AI chatbot answering questions about bay vacancies, tariffs, EV charging, and account workflows in real time.
              </p>
            </div>
            <span className="text-xs font-bold text-purple-600 flex items-center gap-1.5 pt-2">
              <Sparkles className="w-3.5 h-3.5" /> Click floating bot on bottom-right
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 3: DEMO ACCESS & TEST CREDENTIALS CALLOUT */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-bold text-blue-950 uppercase tracking-wide">
                Evaluation & Demo Credentials
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Easily evaluate ParkPulse AI using pre-seeded role credentials with bcrypt security.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-600 text-white shadow-2xs">
            1-Click Available in Login Modal
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
          <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs space-y-1">
            <span className="font-bold text-slate-900 block">System Administrator</span>
            <div className="font-mono text-[11px] text-slate-600">admin@parkpulse.demo</div>
            <div className="font-mono text-[11px] text-blue-600 font-semibold">Password: Admin@12345</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs space-y-1">
            <span className="font-bold text-slate-900 block">Station Operator</span>
            <div className="font-mono text-[11px] text-slate-600">operator@parkpulse.demo</div>
            <div className="font-mono text-[11px] text-amber-600 font-semibold">Password: Operator@12345</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs space-y-1">
            <span className="font-bold text-slate-900 block">Registered Driver</span>
            <div className="font-mono text-[11px] text-slate-600">driver@parkpulse.demo</div>
            <div className="font-mono text-[11px] text-emerald-600 font-semibold">Password: User@12345</div>
          </div>
        </div>
      </section>
    </div>
  );
};
