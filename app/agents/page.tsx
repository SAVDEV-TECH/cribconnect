"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { buildWhatsAppUrl } from "@/lib/types";
import {
  ShieldCheck,
  Search,
  MapPin,
  Star,
  MessageCircle,
  Building2,
  ArrowRight,
  Users,
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
        const res = await fetch("/api/agents", { cache: "no-store" });
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
    if (campusFilter !== "ALL") {
      const needle = campusFilter.toLowerCase();
      const hay = `${a.campusSpecialization || ""} ${a.coverageAreas || ""}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        (a.user?.name || "").toLowerCase().includes(q) ||
        (a.agencyName && a.agencyName.toLowerCase().includes(q)) ||
        (a.bio && a.bio.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-gray-100 pb-8 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <ShieldCheck className="w-4 h-4" />
          <span>UNIPORT &amp; Port Harcourt Agents Directory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Student Housing Agents &amp; Landlords
        </h1>
        <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
          Browse agents and landlords around UNIPORT &amp; Port Harcourt. Look for the green Verified badge for providers whose ID and office details have been reviewed by CribConnect.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-xl border border-gray-200 p-4 text-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents by name, agency, or area..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-medium text-gray-800"
          >
            <option value="ALL">All Port Harcourt Areas</option>
            <option value="UNIPORT">UNIPORT Campus</option>
            <option value="Choba">Choba</option>
            <option value="Ozuoba">Ozuoba</option>
            <option value="Aluu">Aluu</option>
            <option value="Rumuola">Rumuola</option>
            <option value="Rumuokoro">Rumuokoro</option>
            <option value="Rumuigbo">Rumuigbo</option>
          </select>
          <span className="text-gray-500 whitespace-nowrap">
            {filteredAgents.length} Agent{filteredAgents.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-gray-500">
          Loading housing agents...
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-8 space-y-3">
          <Building2 className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-bold text-gray-900 text-sm">No agents found</h3>
          <p className="text-xs text-gray-500">Try adjusting your search or area filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((profile) => {
            const user = profile.user;
            const isVerified = profile.verificationStatus === "VERIFIED";
            const isPending = profile.verificationStatus === "PENDING";

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

            const waUrl = buildWhatsAppUrl(
              user?.whatsapp || user?.phone,
              `Hello ${user?.name || "Agent"}, I found your profile on CribConnect. I am looking for student housing near ${selectedUniversity}.`
            );

            const hasRating = typeof profile.rating === "number" && profile.reviewCount > 0;

            return (
              <div
                key={profile.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Profile Card Header */}
                  <div className="flex items-start gap-3.5">
                    <img
                      src={
                        user.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          user.name || "Agent"
                        )}`
                      }
                      alt={user.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 shrink-0 shadow-sm bg-gray-50"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-gray-900 truncate">
                          {user.name}
                        </h3>
                        {isVerified && (
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-medium truncate">
                        {profile.agencyName || "Independent Realtor"}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs mt-0.5">
                        {hasRating ? (
                          <>
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span className="text-amber-600 font-bold">
                              {profile.rating.toFixed(1)}
                            </span>
                            <span className="text-gray-400 text-[11px]">
                              ({profile.reviewCount} reviews)
                            </span>
                          </>
                        ) : profile.tenantsHousedCount > 0 ? (
                          <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {profile.tenantsHousedCount} tenant
                            {profile.tenantsHousedCount === 1 ? "" : "s"} housed
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">New on CribConnect</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Verification Badges */}
                  <div className="flex flex-wrap gap-1">
                    {isVerified ? (
                      <span className="text-[11px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Verified Agent
                      </span>
                    ) : isPending ? (
                      <span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        Verification Pending
                      </span>
                    ) : (
                      <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        Unverified
                      </span>
                    )}
                    {badges.map((b, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium"
                      >
                        {b}
                      </span>
                    ))}
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                    {profile.bio || "Helping students find comfortable, secure accommodations near UNIPORT."}
                  </p>

                  {/* Coverage Areas */}
                  {coverage.length > 0 && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">Covers: {coverage.join(", ")}</span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                  <span className="text-gray-500 font-medium">
                    {(user.listings || []).length} Active Crib
                    {(user.listings || []).length === 1 ? "" : "s"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        title="WhatsApp Agent"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    <Link
                      href={`/agents/${user.id}`}
                      className="px-3.5 py-2 rounded-lg bg-gray-900 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors flex items-center gap-1"
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