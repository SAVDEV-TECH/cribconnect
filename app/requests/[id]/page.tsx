"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  ShieldCheck,
  Calendar,
  MapPin,
  MessageSquare,
  MessageCircle,
  CheckCircle2,
  Check,
  X,
  ExternalLink,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  UserCheck,
  Clock,
  Video,
} from "lucide-react";

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { currentUser, formatMoney, openVideoTour } = useApp();

  const [request, setRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/requests/${id}`);
      const data = await res.json();
      if (data.request) {
        setRequest(data.request);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchRequest();
  }, [id]);

  const handleUpdateProposalStatus = async (proposalId: string, status: string) => {
    setActionLoadingId(proposalId);
    try {
      const res = await fetch("/api/proposals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchRequest();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-slate-500">
        Loading housing request details...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Request Not Found</h2>
        <Link
          href="/requests"
          className="inline-block px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
        >
          Back to Requests Board
        </Link>
      </div>
    );
  }

  const isOwner = currentUser?.id === request.student.id || currentUser?.role === "ADMIN";
  const proposals = request.proposals || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <div>
        <Link
          href="/requests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Housing Requests Board</span>
        </Link>
      </div>

      {/* Main Request Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={
                request.student.avatar ||
                "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120"
              }
              alt={request.student.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-slate-200"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {request.student.name}
                </h1>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  request.status === "MATCHED"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-blue-100 text-blue-800"
                }`}>
                  Status: {request.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {request.student.city || "Student Relocator"} • {request.targetUniversity}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Budget Ceiling
            </span>
            <span className="text-2xl font-black text-slate-900">
              {formatMoney(request.maxBudget)}
            </span>
            <span className="text-xs text-slate-500 block">/year max rent</span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-2">
          <h2 className="text-lg font-bold text-slate-900">{request.title}</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {request.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs pt-2">
          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-medium">
            Property: <strong>{request.propertyType.replace("_", " ")}</strong>
          </span>
          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Target Move-in: {request.moveInDate}</span>
          </span>
          {request.needsRoommate && (
            <span className="bg-purple-50 text-purple-800 px-3 py-1 rounded-lg font-medium">
              Open to Roommate Split
            </span>
          )}
        </div>
      </div>

      {/* Submitted Agent Proposals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Agent Proposals & Pitches</span>
              <span className="text-xs bg-brand-50 text-brand-700 font-extrabold px-2 py-0.5 rounded-full border border-brand-200">
                {proposals.length} Pitches
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Verified local agents have reviewed this student&apos;s request and submitted the following custom options.
            </p>
          </div>
        </div>

        {proposals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
            <Clock className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No agent proposals yet</h3>
            <p className="text-xs text-slate-500">
              Verified local agents in Akoka & Yaba are currently reviewing this request.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {proposals.map((prop: any) => {
              const agent = prop.agent;
              const agentProfile = agent.agentProfile;
              const isVerified = agentProfile?.verificationStatus === "VERIFIED";

              let listingPhotos: string[] = [];
              if (prop.listing?.photos) {
                try {
                  listingPhotos = JSON.parse(prop.listing.photos);
                } catch {
                  listingPhotos = [];
                }
              }

              const isAccepted = prop.status === "ACCEPTED";
              const isShortlisted = prop.status === "SHORTLISTED";

              return (
                <div
                  key={prop.id}
                  className={`bg-white rounded-2xl border transition-all p-6 flex flex-col justify-between space-y-4 shadow-sm ${
                    isAccepted
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10"
                      : isShortlisted
                      ? "border-amber-400 bg-amber-50/10"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Agent Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            agent.avatar ||
                            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
                          }
                          alt={agent.name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900">
                              {agent.name}
                            </span>
                            {isVerified && (
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block -mt-0.5">
                            {agentProfile?.agencyName || "Accredited Agent"} • ★{" "}
                            {agentProfile?.rating?.toFixed(1) || "5.0"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isAccepted
                            ? "bg-emerald-100 text-emerald-800"
                            : isShortlisted
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {prop.status}
                      </span>
                    </div>

                    {/* Pitch Message */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      <span className="font-semibold text-slate-900 block mb-1 text-[11px] uppercase tracking-wider text-slate-400">
                        Agent Proposal Pitch:
                      </span>
                      &quot;{prop.pitchMessage}&quot;
                    </div>

                    {/* Linked Property Card (if any) */}
                    {prop.listing && (
                      <div className="p-3 rounded-xl border border-slate-200 bg-white flex gap-3 items-center">
                        <img
                          src={
                            listingPhotos[0] ||
                            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300"
                          }
                          alt={prop.listing.title}
                          className="w-16 h-16 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <span className="text-[10px] font-bold text-brand-600 uppercase">
                            Attached Property:
                          </span>
                          <h4 className="font-bold text-slate-900 truncate">
                            {prop.listing.title}
                          </h4>
                          <span className="text-slate-500 text-[11px] block">
                            {prop.listing.distanceDescription || prop.listing.neighborhood}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <Link
                              href={`/listings/${prop.listing.id}`}
                              className="text-[11px] font-bold text-brand-600 hover:underline flex items-center gap-0.5"
                            >
                              <span>Inspect Property</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                            {prop.listing.videoTourUrl && (
                              <button
                                type="button"
                                onClick={() => openVideoTour(prop.listing.videoTourUrl)}
                                className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-0.5"
                              >
                                <Video className="w-3 h-3" />
                                <span>Video Tour</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Transparent Financial Itemization */}
                    <div className="border-t border-slate-100 pt-3 text-xs space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Proposed Rent:</span>
                        <span className="font-bold text-slate-900">
                          {formatMoney(prop.proposedPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Agency & Agreement (10%):</span>
                        <span>{formatMoney(prop.agencyFee)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Caution Deposit:</span>
                        <span>{formatMoney(prop.cautionFee)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100 text-sm">
                        <span>Total Move-in Upfront:</span>
                        <span className="text-emerald-700">
                          {formatMoney(prop.totalUpfront)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    {/* WhatsApp Quick Direct Connect */}
                    <a
                      href={`https://wa.me/${(agent.whatsapp || agent.phone || "+2348034452299").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${agent.name}, I reviewed your CribConnect proposal for "${request.title}". Let's discuss!`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Agent</span>
                    </a>

                    {/* Student Status Controls */}
                    {isOwner && (
                      <div className="flex items-center gap-1.5">
                        {!isShortlisted && !isAccepted && (
                          <button
                            type="button"
                            disabled={actionLoadingId === prop.id}
                            onClick={() => handleUpdateProposalStatus(prop.id, "SHORTLISTED")}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                          >
                            Shortlist
                          </button>
                        )}

                        {!isAccepted && (
                          <button
                            type="button"
                            disabled={actionLoadingId === prop.id}
                            onClick={() => handleUpdateProposalStatus(prop.id, "ACCEPTED")}
                            className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept Proposal</span>
                          </button>
                        )}

                        {isAccepted && (
                          <Link
                            href="/messages"
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Chat with Agent</span>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
