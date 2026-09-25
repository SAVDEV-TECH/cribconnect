"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { DEMO_PERSONAS, Currency } from "@/lib/types";
import {
  Building2,
  Compass,
  FileText,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  ChevronDown,
  UserCheck,
  Zap,
  MapPin,
  HelpCircle,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const {
    currentUser,
    currentPersona,
    switchPersona,
    currency,
    setCurrency,
    selectedUniversity,
    setSelectedUniversity,
    openRelocationModal,
  } = useApp();

  const [isPersonaOpen, setIsPersonaOpen] = useState(false);

  const universities = [
    "University of Lagos (UNILAG)",
    "Yaba College of Technology",
    "Lagos State University (LASU)",
    "University of Ibadan (UI)",
    "Covenant University",
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      {/* Top Demo Bar - Persona Switcher */}
      <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <Sparkles className="w-3 h-3 mr-1" /> Demo Switcher
            </span>
            <span className="hidden sm:inline text-slate-400">
              Active Persona:
            </span>
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {currentUser?.name} ({currentUser?.role})
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-slate-400 text-[11px] hidden md:inline mr-1">
              Switch role instantly:
            </span>
            {DEMO_PERSONAS.map((p) => {
              const isActive = currentUser?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => switchPersona(p.id)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
                    isActive
                      ? "bg-brand-600 text-white shadow-sm ring-1 ring-white/20"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                  title={p.description}
                >
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="w-3.5 h-3.5 rounded-full object-cover"
                  />
                  <span>{p.name.split(" ")[0]}</span>
                  <span className="text-[9px] opacity-70">
                    ({p.role === "STUDENT" ? "Student" : p.role === "AGENT" ? (p.id.includes("bisi") ? "Pending" : "Agent") : "Admin"})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xl tracking-tight text-slate-900">
                    Crib<span className="text-brand-600">Connect</span>
                  </span>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    UNILAG Hub
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 -mt-0.5 hidden sm:block">
                  Verified Agents • Real Homes • Student Relocation
                </p>
              </div>
            </Link>

            {/* University & Campus Selector */}
            <div className="hidden lg:flex items-center bg-slate-100/90 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-brand-600 mr-1.5 shrink-0" />
              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                {universities.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/listings"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/listings"
                  ? "text-brand-600 bg-brand-50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Browse Rentals
            </Link>

            <Link
              href="/requests"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname.startsWith("/requests")
                  ? "text-brand-600 bg-brand-50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <span>Housing Requests</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Upwork Model
              </span>
            </Link>

            <Link
              href="/agents"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                pathname === "/agents"
                  ? "text-brand-600 bg-brand-50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <UserCheck className="w-4 h-4 text-brand-600" />
              <span>Verified Agents</span>
            </Link>

            {currentUser?.role === "AGENT" && (
              <Link
                href="/agent/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  pathname.startsWith("/agent")
                    ? "text-brand-600 bg-brand-50 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Agent Portal</span>
              </Link>
            )}

            {currentUser?.role === "ADMIN" && (
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  pathname === "/admin"
                    ? "text-red-600 bg-red-50 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-red-500" />
                <span>Admin Trust & Safety</span>
              </Link>
            )}

            <Link
              href="/messages"
              className={`p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors ${
                pathname === "/messages" ? "text-brand-600 bg-brand-50" : ""
              }`}
              title="In-App Messages"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
            </Link>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency Selector */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 text-xs">
              {(["NGN", "USD", "GBP"] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-2 py-1 rounded font-semibold transition-all ${
                    currency === c
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {c === "NGN" ? "₦" : c === "USD" ? "$" : "£"} {c}
                </button>
              ))}
            </div>

            {/* Relocation Mode Button */}
            <button
              onClick={openRelocationModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Relocation Mode</span>
            </button>

            {/* Post Request CTA */}
            <Link
              href="/requests"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20 transition-all hover:scale-[1.02]"
            >
              <span>+ Post Request</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
