"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import { buildWhatsAppUrl } from "@/lib/types";
import {
  ShieldCheck,
  ShieldAlert,
  Star,
  MessageCircle,
  Phone,
  MessageSquare,
  CheckCircle2,
  ChevronLeft,
  Users,
} from "lucide-react";

export default function AgentProfilePage() {
  const params = useParams();
  const { id } = params as { id: string };

  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const res = await fetch(`/api/agents/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (res.ok && data.profile) {
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
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-gray-500">
        Loading agent profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Agent Not Found</h2>
        <Link
          href="/agents"
          className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
        >
          View All Agents
        </Link>
      </div>
    );
  }

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

  const listings = user.listings || [];
  const reviews = profile.reviewsReceived || [];
  const hasRating = typeof profile.rating === "number" && profile.reviewCount > 0;
  const waUrl = buildWhatsAppUrl(
    user.whatsapp || user.phone,
    `Hello ${user.name}, I am contacting you through your CribConnect profile.`
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Agents Directory</span>
        </Link>
      </div>

      {/* Main Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img
              src={
                user.avatar ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  user.name || "Agent"
                )}`
              }
              alt={user.name}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 shadow-sm bg-gray-50 ${
                isVerified ? "border-emerald-500" : "border-gray-200"
              }`}
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {user.name}
                </h1>
                {isVerified ? (
                  <span className="bg-emerald-100 text-emerald-800 font-semibold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Agent</span>
                  </span>
                ) : isPending ? (
                  <span className="bg-amber-50 text-amber-800 font-semibold text-xs px-2.5 py-1 rounded-full">
                    Verification Pending
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-600 font-semibold text-xs px-2.5 py-1 rounded-full">
                    Unverified
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-600">
                {profile.agencyName || "Independent Realtor"}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-1">
                {hasRating ? (
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    {profile.rating.toFixed(1)} ({profile.reviewCount} reviews)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <Users className="w-3.5 h-3.5" />
                    {profile.tenantsHousedCount > 0
                      ? `${profile.tenantsHousedCount} Tenants Housed`
                      : "New on CribConnect"}
                  </span>
                )}
                <span>•</span>
                <span>
                  {listings.length} Active Listing{listings.length === 1 ? "" : "s"}
                </span>
                <span>•</span>
                <span>{profile.campusSpecialization || "UNIPORT / Port Harcourt"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Direct</span>
              </a>
            )}
            <Link
              href={`/messages?to=${encodeURIComponent(user.id)}`}
              className="flex-1 md:flex-none px-4 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Message In-App</span>
            </Link>
            {user.phone && (
              <a
                href={`tel:${user.phone}`}
                className="flex-1 md:flex-none px-4 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-gray-500" />
                <span>Call</span>
              </a>
            )}
          </div>
        </div>

        {/* Verification Badges & Accreditations */}
        <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase">
              Identity Verification
            </span>
            {isVerified ? (
              <>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Identity &amp; Office Verified</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Government ID and agency details reviewed by CribConnect compliance.
                </p>
              </>
            ) : isPending ? (
              <>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Verification Under Review</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  This agent has submitted verification details awaiting admin approval.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                  <ShieldAlert className="w-4 h-4 text-gray-500" />
                  <span>Not Yet Verified</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Always physically inspect rooms and use CribConnect Escrow before paying.
                </p>
              </>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase">
              Coverage Territory
            </span>
            <div className="text-xs font-bold text-gray-800">
              {coverage.join(", ") || "Choba & UNIPORT Environs"}
            </div>
            <p className="text-[11px] text-gray-500">
              Local knowledge of campus proximity and Port Harcourt student hostels.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase">
              Trust &amp; Badges
            </span>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {badges.length > 0 ? (
                badges.map((b, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded"
                  >
                    {b}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-gray-500">No badges earned yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-6 space-y-2">
          <h3 className="font-bold text-sm text-gray-900">About the Agent</h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {profile.bio || "Dedicated Port Harcourt student housing specialist."}
          </p>
        </div>
      </div>

      {/* Agent's Active Listings */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">
          Available Cribs by {user.name} ({listings.length})
        </h2>
        {listings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-xs text-gray-500">
            This agent has no active properties at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item: any) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        )}
      </div>

      {/* Student Reviews & Testimonials */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Student Reviews &amp; Testimonials
            </h2>
            <p className="text-xs text-gray-500">
              Verified reviews from students who inspected or rented through {user.name}.
            </p>
          </div>
          {hasRating && (
            <div className="flex items-center gap-1 text-sm font-bold text-amber-600">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{profile.rating.toFixed(1)} / 5.0</span>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500">
            No student reviews yet for this profile.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((rev: any) => (
              <div key={rev.id} className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={
                        rev.student?.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          rev.student?.name || "Student"
                        )}`
                      }
                      alt={rev.student?.name || "Student"}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <span className="font-bold text-xs text-gray-900 block">
                        {rev.student?.name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {rev.student?.currentSchool || "UNIPORT Student"}
                      </span>
                    </div>
                  </div>
                  <div className="flex text-amber-500">
                    {Array.from({ length: rev.rating || 0 }).map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-amber-500" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed pl-10">
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
