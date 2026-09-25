"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import {
  Compass,
  X,
  MapPin,
  Calendar,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  UserCheck,
} from "lucide-react";

export default function RelocationModal() {
  const router = useRouter();
  const {
    isRelocationModalOpen,
    closeRelocationModal,
    formatMoney,
    selectedUniversity,
  } = useApp();

  const [step, setStep] = useState(1);
  const [originCity, setOriginCity] = useState("Enugu");
  const [targetUni, setTargetUni] = useState(selectedUniversity);
  const [budget, setBudget] = useState(500000);
  const [propertyType, setPropertyType] = useState("SELF_CONTAIN");
  const [moveInMonth, setMoveInMonth] = useState("September / October");

  if (!isRelocationModalOpen) return null;

  const handleFinishAndMatch = () => {
    closeRelocationModal();
    // Navigate to requests or agent matching
    router.push(`/requests?relocation=true&origin=${encodeURIComponent(originCity)}&uni=${encodeURIComponent(targetUni)}&budget=${budget}&type=${propertyType}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white relative">
          <button
            onClick={closeRelocationModal}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-xl bg-white/10 backdrop-blur">
              <Compass className="w-6 h-6 text-emerald-200" />
            </span>
            <span className="text-xs uppercase tracking-wider font-bold text-emerald-200 bg-white/10 px-2.5 py-0.5 rounded-full">
              Student Relocation Concierge
            </span>
          </div>
          <h2 className="text-2xl font-bold">Relocation Mode</h2>
          <p className="text-emerald-100 text-xs mt-1">
            Moving to an unfamiliar campus? Let verified local specialists guide you to secure, scam-free student housing before you arrive.
          </p>
        </div>

        {/* Wizard Form */}
        <div className="p-6 space-y-5">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Where are you currently relocating from?
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    placeholder="e.g., Enugu, Abuja, Port Harcourt, London"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  We match you with agents who provide verified airport/park pick-up guidance and live video tours.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Destination University or College
                </label>
                <select
                  value={targetUni}
                  onChange={(e) => setTargetUni(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="University of Lagos (UNILAG)">University of Lagos (UNILAG - Akoka / Yaba)</option>
                  <option value="Yaba College of Technology">Yaba College of Technology (YabaTech)</option>
                  <option value="Lagos State University (LASU)">Lagos State University (LASU)</option>
                  <option value="University of Ibadan (UI)">University of Ibadan (UI)</option>
                  <option value="Covenant University">Covenant University</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  3. Expected Move-In Timing
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Immediate (This Week)",
                    "Next 2-4 Weeks",
                    "October Resumption",
                    "November Semester",
                  ].map((timing) => (
                    <button
                      key={timing}
                      type="button"
                      onClick={() => setMoveInMonth(timing)}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                        moveInMonth === timing
                          ? "border-brand-600 bg-brand-50 text-brand-700 font-semibold"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {timing}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-4"
              >
                <span>Continue to Housing Preferences</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  4. Preferred Apartment Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "SELF_CONTAIN", label: "Self-Contain (Studio)" },
                    { id: "ONE_BED", label: "1-Bedroom Flat" },
                    { id: "TWO_BED", label: "2-Bed (Shared)" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPropertyType(t.id)}
                      className={`p-3 rounded-xl border text-xs text-center transition-all ${
                        propertyType === t.id
                          ? "border-brand-600 bg-brand-50 text-brand-700 font-bold"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    5. Maximum Annual Rent Budget
                  </label>
                  <span className="text-sm font-bold text-brand-700">
                    {formatMoney(budget)} / yr
                  </span>
                </div>
                <input
                  type="range"
                  min="200000"
                  max="1500000"
                  step="25000"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>₦200k</span>
                  <span>₦800k</span>
                  <span>₦1.5M+</span>
                </div>
              </div>

              {/* Matched Specialist Preview */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt="Kolawole"
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-slate-900 truncate">
                      Kolawole Adebayo
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" /> UNILAG Specialist
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    Matched based on your {targetUni} relocation from {originCity}.
                  </p>
                  <div className="text-[10px] text-emerald-600 font-medium">
                    ★ 4.95 (28 verified student reviews) • 0 Scam Guarantee
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinishAndMatch}
                  className="w-2/3 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Connect with Matching Agents</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
