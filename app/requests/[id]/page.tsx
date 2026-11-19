"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { buildWhatsAppUrl } from "@/lib/types";
import {
  ShieldCheck,
  Calendar,
  MapPin,
  MessageSquare,
  MessageCircle,
  Check,
  X,
  ExternalLink,
  ChevronLeft,
  Clock,
  Video,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function RequestDetailPage() {
  const params = useParams();
  const { id } = params as { id: string };
  const { currentUser, formatMoney, openVideoTour } = useApp();

  const [request, setRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Proposal submission state for agents/landlords
  const [showPitchForm, setShowPitchForm] = useState(false);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [submittingPitch, setSubmittingPitch] = useState(false);
  const [pitchForm, setPitchForm] = useState({
    listingId: "",
    proposedPrice: "",
    agencyFee: "0",
    cautionFee: "0",
    pitchMessage: "",
  });

  const fetchRequest = useCallback(async () => {
    try {
      const res = await fetch(`/api/requests/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.request) {
        setRequest(data.request);
      } else {
        setRequest(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchRequest();
  }, [id, fetchRequest]);

  const canPitch =
    Boolean(currentUser) &&
    (currentUser?.role === "AGENT" ||
      currentUser?.role === "LANDLORD" ||
      currentUser?.role === "ADMIN" ||
      Boolean(currentUser?.isAdmin));

  useEffect(() => {
    if (!canPitch || !showPitchForm) return;
    fetch("/api/agent/profile", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.profile?.listings) {
          setMyListings(data.profile.listings);
        }
      })
      .catch(() => {});
  }, [canPitch, showPitchForm]);

  const handleUpdateProposalStatus = async (
    proposalId: string,
    status: "SHORTLISTED" | "ACCEPTED" | "DECLINED"
  ) => {
    setActionLoadingId(proposalId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/proposals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: proposalId, status }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Proposal marked as ${status.toLowerCase()}.`);
        await fetchRequest();
      } else {
        setErrorMsg(data.error || "Could not update proposal status.");
      }
    } catch {
      setErrorMsg("Network error while updating proposal.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSubmitPitch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPitch(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: id,
          listingId: pitchForm.listingId || undefined,
          proposedPrice: Number(pitchForm.proposedPrice),
          agencyFee: Number(pitchForm.agencyFee || 0),
          cautionFee: Number(pitchForm.cautionFee || 0),
          pitchMessage: pitchForm.pitchMessage,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowPitchForm(false);
        setPitchForm({
          listingId: "",
          proposedPrice: "",
          agencyFee: "0",
          cautionFee: "0",
          pitchMessage: "",
        });
        setSuccessMsg("Your proposal has been sent to the tenant.");
        await fetchRequest();
      } else {
        setErrorMsg(data.error || "Failed to submit proposal.");
      }
    } catch {
      setErrorMsg("Network error while submitting proposal.");
    } finally {
      setSubmittingPitch(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-gray-500">
        Loading housing request details...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Request Not Found</h2>
        <Link
          href="/requests"
          className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
        >
          Back to Requests Board
        </Link>
      </div>
    );
  }

  const isOwner =
    Boolean(currentUser?.id && request.student?.id && currentUser.id === request.student.id) ||
    Boolean(currentUser?.isAdmin || currentUser?.role === "ADMIN");
  const proposals = request.proposals || [];
  const studentWhatsappUrl = buildWhatsAppUrl(
    request.tenantWhatsapp || request.tenantPhone,
    `Hello ${request.student.name}, I saw your CribConnect housing request "${request.title}". I have a matching property in Port Harcourt.`
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <div>
        <Link
          href="/requests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Housing Requests Board</span>
        </Link>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Request Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={
                request.student.avatar ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                  request.student.name || "Student"
                )}`
              }
              alt={request.student.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 bg-gray-50"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {request.student.name}
                </h1>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    request.status === "MATCHED"
                      ? "bg-emerald-100 text-emerald-800"
                      : request.status === "CLOSED"
                      ? "bg-gray-100 text-gray-600"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  Status: {request.status || "OPEN"}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {request.student.city || "Port Harcourt"} •{" "}
                {request.tenantSchool || request.student.currentSchool || "UNIPORT Student"}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-gray-100">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              Budget Ceiling
            </span>
            <span className="text-2xl font-bold text-gray-900">
              {formatMoney(request.maxBudget || 0)}
            </span>
            <span className="text-xs text-gray-500 block">/year max rent</span>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-2">
          <h2 className="text-lg font-bold text-gray-900">{request.title}</h2>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {request.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Area: {request.preferredArea || "Choba / UNIPORT"}</span>
            </span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg font-medium">
              Property:{" "}
              <strong>{(request.propertyType || "SELF_CONTAIN").replace(/_/g, " ")}</strong>
            </span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>Target Move-in: {request.moveInDate || "Flexible"}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {studentWhatsappUrl && (
              <a
                href={studentWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Tenant</span>
              </a>
            )}
            {canPitch && request.status !== "CLOSED" && (
              <button
                type="button"
                onClick={() => setShowPitchForm((v) => !v)}
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{showPitchForm ? "Cancel Proposal" : "Submit Agent Proposal"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Agent Proposal Submission Form */}
      {showPitchForm && canPitch && (
        <form
          onSubmit={handleSubmitPitch}
          className="bg-white rounded-xl border border-emerald-200 p-6 shadow-sm space-y-4"
        >
          <div>
            <h3 className="text-base font-bold text-gray-900">Submit a Property Proposal</h3>
            <p className="text-xs text-gray-500">
              Provide transparent rent and fee breakdown so the student can compare options fairly.
            </p>
          </div>

          {myListings.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Attach One of Your Listings (Optional)
              </label>
              <select
                value={pitchForm.listingId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const found = myListings.find((l) => l.id === selectedId);
                  setPitchForm((prev) => ({
                    ...prev,
                    listingId: selectedId,
                    proposedPrice: found ? String(found.price) : prev.proposedPrice,
                    agencyFee: found && found.agencyFee ? String(found.agencyFee) : prev.agencyFee,
                  }));
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
              >
                <option value="">-- Custom off-market option --</option>
                {myListings.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} ({l.neighborhood} — ₦{(l.price || 0).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Annual Rent (₦) *
              </label>
              <input
                type="number"
                required
                min={10000}
                value={pitchForm.proposedPrice}
                onChange={(e) => setPitchForm({ ...pitchForm, proposedPrice: e.target.value })}
                placeholder="e.g. 350000"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Agency / Agreement Fee (₦)
              </label>
              <input
                type="number"
                min={0}
                value={pitchForm.agencyFee}
                onChange={(e) => setPitchForm({ ...pitchForm, agencyFee: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Caution Fee (₦)
              </label>
              <input
                type="number"
                min={0}
                value={pitchForm.cautionFee}
                onChange={(e) => setPitchForm({ ...pitchForm, cautionFee: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Pitch Message *
            </label>
            <textarea
              required
              minLength={10}
              rows={3}
              value={pitchForm.pitchMessage}
              onChange={(e) => setPitchForm({ ...pitchForm, pitchMessage: e.target.value })}
              placeholder="Describe proximity to UNIPORT gate, water supply, power/meter situation, and when inspection can happen..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingPitch}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingPitch ? "Submitting..." : "Send Proposal"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Submitted Agent Proposals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>Agent Proposals &amp; Pitches</span>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                {proposals.length} {proposals.length === 1 ? "Pitch" : "Pitches"}
              </span>
            </h2>
            <p className="text-xs text-gray-500">
              Local Port Harcourt agents can review this request and submit transparent property options below.
            </p>
          </div>
        </div>

        {proposals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-8 space-y-3">
            <Clock className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="font-bold text-gray-800 text-sm">No agent proposals yet</h3>
            <p className="text-xs text-gray-500">
              Local verified agents around Choba, Ozuoba, Aluu &amp; UNIPORT are reviewing this request.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {proposals.map((prop: any) => {
              const agent = prop.agent;
              const agentProfile = agent?.agentProfile;
              const isVerified = agentProfile?.verificationStatus === "VERIFIED";

              let listingPhotos: string[] = [];
              if (prop.listing?.photos) {
                if (Array.isArray(prop.listing.photos)) {
                  listingPhotos = prop.listing.photos;
                } else {
                  try {
                    listingPhotos = JSON.parse(prop.listing.photos);
                  } catch {
                    listingPhotos = [];
                  }
                }
              }

              const isAccepted = prop.status === "ACCEPTED";
              const isShortlisted = prop.status === "SHORTLISTED";
              const isDeclined = prop.status === "DECLINED";
              const agentWaUrl = buildWhatsAppUrl(
                agent?.whatsapp || agent?.phone,
                `Hello ${agent?.name || "Agent"}, I reviewed your CribConnect proposal for "${request.title}". Let's discuss!`
              );

              return (
                <div
                  key={prop.id}
                  className={`bg-white rounded-xl border transition-all p-6 flex flex-col justify-between space-y-4 shadow-sm ${
                    isAccepted
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10"
                      : isShortlisted
                      ? "border-amber-400 bg-amber-50/10"
                      : isDeclined
                      ? "border-gray-200 opacity-70"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Agent Header */}
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/agents/${agent.id}`}
                        className="flex items-center gap-3 hover:opacity-90"
                      >
                        <img
                          src={
                            agent.avatar ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              agent.name || "Agent"
                            )}`
                          }
                          alt={agent.name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 bg-gray-100"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-gray-900">
                              {agent.name}
                            </span>
                            {isVerified && (
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            )}
                          </div>
                          <span className="text-[11px] text-gray-500 block -mt-0.5">
                            {agentProfile?.agencyName || "Independent Realtor"}
                          </span>
                        </div>
                      </Link>

                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isAccepted
                            ? "bg-emerald-100 text-emerald-800"
                            : isShortlisted
                            ? "bg-amber-100 text-amber-800"
                            : isDeclined
                            ? "bg-red-50 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {prop.status}
                      </span>
                    </div>

                    {/* Pitch Message */}
                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                      <span className="font-semibold block mb-1 text-[11px] uppercase tracking-wider text-gray-400">
                        Agent Proposal Pitch:
                      </span>
                      &quot;{prop.pitchMessage}&quot;
                    </div>

                    {/* Linked Property Card (if any) */}
                    {prop.listing && (
                      <div className="p-3 rounded-xl border border-gray-200 bg-white flex gap-3 items-center">
                        {listingPhotos[0] && (
                          <img
                            src={listingPhotos[0]}
                            alt={prop.listing.title}
                            className="w-16 h-16 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0 text-xs">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">
                            Attached Property:
                          </span>
                          <h4 className="font-bold text-gray-900 truncate">
                            {prop.listing.title}
                          </h4>
                          <span className="text-gray-500 text-[11px] block">
                            {prop.listing.distanceDescription || prop.listing.neighborhood}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <Link
                              href={`/listings/${prop.listing.id}`}
                              className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-0.5"
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
                    <div className="border-t border-gray-100 pt-3 text-xs space-y-1">
                      <div className="flex justify-between text-gray-600">
                        <span>Proposed Rent:</span>
                        <span className="font-bold text-gray-900">
                          {formatMoney(prop.proposedPrice || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-500 text-[11px]">
                        <span>Agency &amp; Agreement:</span>
                        <span>{formatMoney(prop.agencyFee || 0)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 text-[11px]">
                        <span>Caution Deposit:</span>
                        <span>{formatMoney(prop.cautionFee || 0)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100 text-sm">
                        <span>Total Move-in Upfront:</span>
                        <span className="text-emerald-700">
                          {formatMoney(prop.totalUpfront || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {agentWaUrl && (
                        <a
                          href={agentWaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp Agent</span>
                        </a>
                      )}
                      <Link
                        href={`/messages?to=${encodeURIComponent(agent.id)}`}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Message</span>
                      </Link>
                    </div>

                    {/* Student Status Controls */}
                    {isOwner && !isDeclined && (
                      <div className="flex items-center gap-1.5">
                        {!isShortlisted && !isAccepted && (
                          <button
                            type="button"
                            disabled={actionLoadingId === prop.id}
                            onClick={() => handleUpdateProposalStatus(prop.id, "SHORTLISTED")}
                            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
                          >
                            Shortlist
                          </button>
                        )}

                        {!isAccepted && (
                          <button
                            type="button"
                            disabled={actionLoadingId === prop.id}
                            onClick={() => handleUpdateProposalStatus(prop.id, "DECLINED")}
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1"
                            title="Decline proposal"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {!isAccepted && (
                          <button
                            type="button"
                            disabled={actionLoadingId === prop.id}
                            onClick={() => handleUpdateProposalStatus(prop.id, "ACCEPTED")}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
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
