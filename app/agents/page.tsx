"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  ShieldCheck,
  Search,
  MapPin,
  Star,
  MessageCircle,
  Phone,
  Building2,
  CheckCircle2,
  Sparkles,
  Award,
  ArrowRight,
} from "lucide-react";

export default function AgentsPage() {
  const { selectedUniversity } = useApp();
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [campusFilter, setCampusFilter] = useState("ALL");

  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/agents");
        const data = await res.json();
        if (data.agents) {
          setAgents(data.agents);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const filteredAgents = agents.filter((a) => {
    if (campusFilter !== "ALL" && !a.campusSpecialization?.toLowerCase().includes(campusFilter.toLowerCase())) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        a.user.name.toLowerCase().includes(q) ||
        (a.agencyName && a.agencyName.toLowerCase().includes(q)) ||
        (a.bio && a.bio.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-10 text-white border border-emerald-800/60 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>National ID & Physical Office Screened</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
          Verified Student Housing Agents
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
          Say goodbye to mysterious roadside agents who disappear after taking inspection money. Every agent listed here has passed government identity verification and holds an authenticated rental portfolio.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents by name, agency, or specialization..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-800"
          >
            <option value="ALL">All Campuses</option>
            <option value="UNILAG">UNILAG (Akoka / Yaba)</option>
            <option value="Yaba">Yaba College of Technology</option>
            <option value="LASU">Lagos State University</option>
            <option value="UI">University of Ibadan</option>
          </select>
          <span className="text-slate-500">
            {filteredAgents.length} Agents Listed
          </span>
        </div>
      </div>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-slate-500">
          Loading verified agents...
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">No agents found</h3>
          <p className="text-xs text-slate-500">Try adjusting your search or campus filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((profile) => {
            const user = profile.user;
            const isVerified = profile.verificationStatus === "VERIFIED";

            let badges: string[] = [];
            try {
              badges = JSON.parse(profile.badges || "[]");
            } catch {
              badges = [];
            }

            let coverage: string[] = [];
            try {
              coverage = JSON.parse(profile.coverageAreas || "[]");
            } catch {
              coverage = [];
            }

            const handleWhatsApp = (e: React.MouseEvent) => {
              e.preventDefault();
              const phone = user.whatsapp || user.phone || "+2348034452299";
              const clean = phone.replace(/[^0-9]/g, "");
              window.open(
                `https://wa.me/${clean}?text=${encodeURIComponent(
                  `Hello ${user.name}, I found your verified profile on CribConnect. I am looking for student housing near ${selectedUniversity}.`
                )}`,
                "_blank"
              );
            };

            return (
              <div
                key={profile.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  {/* Top Profile Card Header */}
                  <div className="flex items-start gap-3.5">
                    <img
                      src={
                        user.avatar ||
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120"
                      }
                      alt={user.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shrink-0 shadow-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-slate-900 truncate">
                          {user.name}
                        </h3>
                        {isVerified && (
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate">
                        {profile.agencyName || "Independent Specialist"}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-amber-600 font-bold mt-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{profile.rating.toFixed(1)}</span>
                        <span className="text-slate-400 font-normal text-[11px]">
                          ({profile.reviewCount} student reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Badges */}
                  <div className="flex flex-wrap gap-1">
                    {isVerified ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Verified Agent
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                        Verification Pending
                      </span>
                    )}
                    {badges.map((b, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium"
                      >
                        ✓ {b}
                      </span>
                    ))}
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {profile.bio || "Helping students find comfortable, secure accommodations near campus."}
                  </p>

                  {/* Coverage Areas */}
                  {coverage.length > 0 && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Covers: {coverage.join(", ")}</span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500 font-medium">
                    {user.listings.length} Active Crib{user.listings.length === 1 ? "" : "s"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleWhatsApp}
                      className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                      title="WhatsApp Agent"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/agents/${user.id}`}
                      className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-brand-600 text-white font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>View Profile</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
