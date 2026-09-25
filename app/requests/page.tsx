"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  FileText,
  Plus,
  Search,
  Filter,
  MapPin,
  Calendar,
  Wallet,
  Users,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  Zap,
} from "lucide-react";

export default function HousingRequestsPage() {
  const { currentUser, formatMoney, selectedUniversity } = useApp();

  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterUniversity, setFilterUniversity] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");

  // Post Request Modal state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newUni, setNewUni] = useState(selectedUniversity);
  const [newMaxBudget, setNewMaxBudget] = useState(500000);
  const [newPropertyType, setNewPropertyType] = useState("SELF_CONTAIN");
  const [newMoveInDate, setNewMoveInDate] = useState("2026-10-01");
  const [newPreferredAreas, setNewPreferredAreas] = useState("Akoka, Onike");
  const [newNeedsRoommate, setNewNeedsRoommate] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Proposal Submission Modal state (for agents)
  const [selectedRequestForPitch, setSelectedRequestForPitch] = useState<any | null>(null);
  const [agentListings, setAgentListings] = useState<any[]>([]);
  const [selectedListingId, setSelectedListingId] = useState("");
  const [pitchPrice, setPitchPrice] = useState("");
  const [pitchMessage, setPitchMessage] = useState("");
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [proposalSuccess, setProposalSuccess] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/requests");
      const data = await res.json();
      if (data.requests) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgentListings = async () => {
    if (currentUser?.role === "AGENT") {
      try {
        const res = await fetch(`/api/listings?agentId=${currentUser.id}`);
        const data = await res.json();
        if (data.listings) {
          setAgentListings(data.listings);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchAgentListings();
  }, [currentUser]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRequest(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          targetUniversity: newUni,
          maxBudget: newMaxBudget,
          propertyType: newPropertyType,
          moveInDate: newMoveInDate,
          preferredAreas: newPreferredAreas.split(",").map((s) => s.trim()),
          needsRoommate: newNeedsRoommate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPostModalOpen(false);
        setNewTitle("");
        setNewDescription("");
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleOpenPitchModal = (req: any) => {
    setSelectedRequestForPitch(req);
    setPitchPrice(String(req.maxBudget));
    setPitchMessage(
      `Hello ${req.student.name}, I saw your housing request on CribConnect. We have verified options matching your requirements with 24/7 borehole water, security, and close proximity to campus gates.`
    );
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForPitch) return;
    setIsSubmittingProposal(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequestForPitch.id,
          listingId: selectedListingId || null,
          pitchMessage,
          proposedPrice: pitchPrice,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProposalSuccess(true);
        setTimeout(() => {
          setProposalSuccess(false);
          setSelectedRequestForPitch(null);
          fetchRequests();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filterUniversity !== "ALL" && !r.targetUniversity.toLowerCase().includes(filterUniversity.toLowerCase())) {
      return false;
    }
    if (filterType !== "ALL" && r.propertyType !== filterType) {
      return false;
    }
    return true;
  });

  const isAgent = currentUser?.role === "AGENT" || currentUser?.role === "ADMIN";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Reverse Marketplace Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-10 text-white border border-slate-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 fill-amber-300" />
            <span>The Reverse Marketplace: Upwork Model for Housing</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Students post requests. Verified agents pitch cribs.
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Don&apos;t spend days hunting random agents across unfamiliar streets. Specify your budget, preferred campus gate, and move-in timeline. Accredited local agents will send you customized proposals with verified video walkthroughs.
          </p>
        </div>

        <div className="shrink-0">
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold text-sm shadow-xl shadow-brand-500/20 transition-all hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post a Housing Request</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-brand-600" />
            <span>Filter Campus:</span>
          </div>
          <select
            value={filterUniversity}
            onChange={(e) => setFilterUniversity(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800"
          >
            <option value="ALL">All Campuses</option>
            <option value="UNILAG">UNILAG (Akoka / Yaba)</option>
            <option value="Yaba">Yaba College of Technology</option>
            <option value="LASU">Lagos State University</option>
            <option value="UI">University of Ibadan</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800"
          >
            <option value="ALL">All Property Types</option>
            <option value="SELF_CONTAIN">Self-Contain (Studio)</option>
            <option value="ONE_BED">1-Bedroom Apartment</option>
            <option value="TWO_BED">2-Bedroom Shared</option>
          </select>
        </div>

        <div className="text-slate-500 font-medium">
          Showing <strong>{filteredRequests.length}</strong> active student requests
        </div>
      </div>

      {/* Requests Feed */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-slate-500">
          Loading student housing requests...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">No housing requests found</h3>
          <p className="text-xs text-slate-500">
            Be the first to post what you need, and verified agents will respond with matching cribs.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            let preferredAreas: string[] = [];
            try {
              preferredAreas = JSON.parse(req.preferredAreas || "[]");
            } catch {
              preferredAreas = [];
            }

            const isRequester = currentUser?.id === req.student.id;

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-brand-500/50 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left: Requester & Details */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        req.student.avatar ||
                        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100"
                      }
                      alt={req.student.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {req.student.name}
                        </span>
                        {isRequester && (
                          <span className="text-[10px] bg-brand-50 text-brand-700 font-extrabold px-2 py-0.5 rounded-full border border-brand-200">
                            Your Request
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {req.student.city || "Incoming Student"} • {req.targetUniversity}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-slate-900">{req.title}</h3>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {req.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-lg">
                      Type: <strong>{req.propertyType.replace("_", " ")}</strong>
                    </span>
                    <span className="bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Move-in: {req.moveInDate}</span>
                    </span>
                    {preferredAreas.length > 0 && (
                      <span className="bg-emerald-50 text-emerald-800 font-medium px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Areas: {preferredAreas.join(", ")}</span>
                      </span>
                    )}
                    {req.needsRoommate && (
                      <span className="bg-purple-50 text-purple-800 font-medium px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-purple-600" />
                        <span>Open to Roommate</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Budget & Action CTA */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 shrink-0 gap-4">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Max Annual Budget
                    </span>
                    <span className="text-xl font-black text-slate-900">
                      {formatMoney(req.maxBudget)}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      /year budget ceiling
                    </span>
                  </div>

                  <div className="space-y-2 text-right">
                    <div className="text-[11px] font-bold text-brand-700 flex items-center gap-1 justify-end">
                      <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                      <span>
                        {req.proposals.length} Agent Proposal{req.proposals.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/requests/${req.id}`}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <span>View Pitches</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      {isAgent && (
                        <button
                          type="button"
                          onClick={() => handleOpenPitchModal(req)}
                          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Proposal</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Request Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Post Your Student Housing Request
                </h3>
                <p className="text-xs text-slate-500">
                  Verified agents will review your post and send tailored property proposals.
                </p>
              </div>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Request Headline
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Need self-con near UNILAG New Hall Gate with reliable water"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Detailed Housing Requirements
                </label>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Mention your department, required amenities (generator, borehole water, security), and any specific constraints..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Target University
                  </label>
                  <select
                    value={newUni}
                    onChange={(e) => setNewUni(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="University of Lagos (UNILAG)">University of Lagos (UNILAG)</option>
                    <option value="Yaba College of Technology">Yaba College of Technology</option>
                    <option value="Lagos State University (LASU)">Lagos State University</option>
                    <option value="University of Ibadan (UI)">University of Ibadan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Property Type
                  </label>
                  <select
                    value={newPropertyType}
                    onChange={(e) => setNewPropertyType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="SELF_CONTAIN">Self-Contain (Studio)</option>
                    <option value="ONE_BED">1-Bedroom Flat</option>
                    <option value="TWO_BED">2-Bedroom (Shared)</option>
                    <option value="HOSTEL_BED">Private Hostel Bed Space</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Max Annual Rent Budget (₦)
                  </label>
                  <input
                    type="number"
                    required
                    step="10000"
                    value={newMaxBudget}
                    onChange={(e) => setNewMaxBudget(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Target Move-In Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newMoveInDate}
                    onChange={(e) => setNewMoveInDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Preferred Neighborhoods (comma-separated)
                </label>
                <input
                  type="text"
                  value={newPreferredAreas}
                  onChange={(e) => setNewPreferredAreas(e.target.value)}
                  placeholder="e.g. Akoka, Onike, Abule Oja, St. Finbarr's"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="roommateCheckbox"
                  checked={newNeedsRoommate}
                  onChange={(e) => setNewNeedsRoommate(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="roommateCheckbox" className="font-medium text-slate-700">
                  I am open to splitting a 2-bedroom with a verified student roommate.
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRequest}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-sm"
                >
                  {isSubmittingRequest ? "Posting Request..." : "Post Request to Verified Agents"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Agent Proposal Pitch Modal */}
      {selectedRequestForPitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Submit Housing Proposal (Agent Pitch)
                </h3>
                <p className="text-xs text-slate-500">
                  Pitch to {selectedRequestForPitch.student.name} for &quot;{selectedRequestForPitch.title}&quot;
                </p>
              </div>
              <button
                onClick={() => setSelectedRequestForPitch(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {proposalSuccess ? (
              <div className="text-center py-8 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-base text-slate-900">Proposal Submitted!</h4>
                <p className="text-xs text-slate-500">
                  The student has received your pitch and can now inspect your linked property and start a conversation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitProposal} className="space-y-3.5 text-xs">
                {/* Select from agent's existing active listings */}
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Attach One of Your Verified Listings (Optional)
                  </label>
                  <select
                    value={selectedListingId}
                    onChange={(e) => setSelectedListingId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="">-- Pitch Off-Market / Custom Property --</option>
                    {agentListings.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title} (₦{l.price.toLocaleString()} / {l.neighborhood})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Proposed Annual Rent (₦)
                  </label>
                  <input
                    type="number"
                    required
                    value={pitchPrice}
                    onChange={(e) => setPitchPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Pitch Message to Student
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={pitchMessage}
                    onChange={(e) => setPitchMessage(e.target.value)}
                    placeholder="Describe how your option solves their distance, water, and power needs..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-800">CribConnect Fee Policy:</div>
                  <p className="text-[11px]">
                    Standard 10% agency & agreement fee will be transparently itemized for the student. No undocumented charges permitted.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRequestForPitch(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProposal}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-sm flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingProposal ? "Submitting Pitch..." : "Submit Proposal"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
