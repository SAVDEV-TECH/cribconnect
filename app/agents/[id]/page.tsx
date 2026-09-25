"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import ListingCard from "@/components/ListingCard";
import {
  ShieldCheck,
  Star,
  MessageCircle,
  Phone,
  MessageSquare,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Calendar,
  Award,
  MapPin,
} from "lucide-react";

export default function AgentProfilePage() {
  const params = useParams();
  const { id } = params as { id: string };
  const { formatMoney } = useApp();

  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const res = await fetch(`/api/agents/${id}`);
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchAgent();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-slate-500">
        Loading agent profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Agent Not Found</h2>
        <Link
          href="/agents"
          className="inline-block px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
        >
          View All Verified Agents
        </Link>
      </div>
    );
  }

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

  const listings = user.listings || [];
  const reviews = profile.reviewsReceived || [];

  const handleWhatsApp = () => {
    const phone = user.whatsapp || user.phone || "+2348034452299";
    const clean = phone.replace(/[^0-9]/g, "");
    window.open(
      `https://wa.me/${clean}?text=${encodeURIComponent(
        `Hello ${user.name}, I am contacting you through your CribConnect verified profile.`
      )}`,
      "_blank"
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Verified Agents Directory</span>
        </Link>
      </div>

      {/* Main Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img
              src={
                user.avatar ||
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"
              }
              alt={user.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-emerald-500 shadow-md"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {user.name}
                </h1>
                {isVerified && (
                  <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Agent</span>
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-600">
                {profile.agencyName || "Independent Real Estate Specialist"}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1 text-amber-600 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  {profile.rating.toFixed(1)} ({profile.reviewCount} reviews)
                </span>
                <span>•</span>
                <span>{profile.yearsExperience} Years Experience</span>
                <span>•</span>
                <span>{profile.campusSpecialization}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
            <button
              onClick={handleWhatsApp}
              className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Direct</span>
            </button>
            {user.phone && (
              <a
                href={`tel:${user.phone}`}
                className="flex-1 md:flex-none px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-slate-500" />
                <span>Call Agent</span>
              </a>
            )}
          </div>
        </div>

        {/* Verification Badges & Accreditations */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Identity Verification
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>NIMC National Identity Validated</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Agent NIN and government document screened by platform compliance.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Coverage Territory
            </span>
            <div className="text-xs font-bold text-slate-800">
              {coverage.join(", ") || "Akoka & Yaba Environs"}
            </div>
            <p className="text-[11px] text-slate-500">
              Specialized local knowledge of campus proximity and student hostels.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Trust & Badges
            </span>
            <div className="flex flex-wrap gap-1">
              {badges.map((b, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded"
                >
                  ✓ {b}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-6 space-y-2">
          <h3 className="font-bold text-sm text-slate-900">About the Agent</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {profile.bio || "Dedicated student housing specialist committed to honest dealings."}
          </p>
        </div>
      </div>

      {/* Agent's Active Listings */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">
          Available Cribs by {user.name} ({listings.length})
        </h2>
        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            This agent has no active properties at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item: any) => (
              <ListingCard
                key={item.id}
                listing={{
                  ...item,
                  agent: {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    whatsapp: user.whatsapp,
                    avatar: user.avatar,
                    agentProfile: profile,
                  },
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Student Reviews & Testimonials */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Student Reviews & Testimonials
            </h2>
            <p className="text-xs text-slate-500">
              Verified reviews from students who inspected or rented through {user.name}.
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm font-black text-amber-600">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>{profile.rating.toFixed(1)} / 5.0</span>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No reviews yet for this agent profile.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((rev: any) => (
              <div key={rev.id} className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={
                        rev.student.avatar ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                      }
                      alt={rev.student.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">
                        {rev.student.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {rev.student.currentSchool || "Verified Student"}
                      </span>
                    </div>
                  </div>
                  <div className="flex text-amber-500">
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-amber-500" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-10">
                  &quot;{rev.comment}&quot;
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
