"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  ShieldCheck,
  Zap,
  Plus,
  Eye,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Building2,
  Trash2,
  Video,
  FileCheck,
  Send,
  Upload,
} from "lucide-react";

export default function AgentDashboardPage() {
  const { currentUser, formatMoney, openUpgradeModal } = useApp();

  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Listing Modal
  const [isAddListingOpen, setIsAddListingOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [propertyType, setPropertyType] = useState("SELF_CONTAIN");
  const [neighborhood, setNeighborhood] = useState("Akoka");
  const [address, setAddress] = useState("");
  const [distanceMinutes, setDistanceMinutes] = useState(5);
  const [photoUrl, setPhotoUrl] = useState("");
  const [videoTourUrl, setVideoTourUrl] = useState("");
  const [amenitiesInput, setAmenitiesInput] = useState("Borehole Water, Generator Backup, Gated Compound");
  const [isSubmittingListing, setIsSubmittingListing] = useState(false);
  const [listingError, setListingError] = useState("");

  // Verification Form Modal
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [agencyName, setAgencyName] = useState("");
  const [ninNumber, setNinNumber] = useState("");
  const [idDocumentUrl, setIdDocumentUrl] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  const fetchAgentData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/listings?agentId=${currentUser.id}`);
      const data = await res.json();
      if (data.listings) {
        setListings(data.listings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentData();
  }, [currentUser]);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setListingError("");
    setIsSubmittingListing(true);
    try {
      const photosArray = photoUrl.trim()
        ? [photoUrl.trim()]
        : [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
          ];
      const amenitiesArray = amenitiesInput.split(",").map((s) => s.trim());

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price),
          propertyType,
          neighborhood,
          address,
          distanceToCampusMinutes: distanceMinutes,
          distanceDescription: `${distanceMinutes} mins to UNILAG gate`,
          photos: photosArray,
          videoTourUrl: videoTourUrl || null,
          amenities: amenitiesArray,
        }),
      });

      const data = await res.json();
      if (data.limitReached) {
        setListingError(data.error);
        openUpgradeModal();
        return;
      }
      if (data.success) {
        setIsAddListingOpen(false);
        setTitle("");
        setDescription("");
        setPrice("");
        fetchAgentData();
      } else {
        setListingError(data.error || "Failed to create listing");
      }
    } catch (err) {
      console.error(err);
      setListingError("Network error occurred");
    } finally {
      setIsSubmittingListing(false);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm("Are you sure you want to remove this property?")) return;
    try {
      const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
      if (res.ok) {
        fetchAgentData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAvailable = async (listingId: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });
      fetchAgentData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingVerify(true);
    try {
      const res = await fetch("/api/agent/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName,
          ninNumber,
          idDocumentUrl: idDocumentUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600",
          bio,
          campusSpecialization: "University of Lagos (UNILAG)",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVerifySuccess(true);
        setTimeout(() => {
          setVerifySuccess(false);
          setIsVerifyModalOpen(false);
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingVerify(false);
    }
  };

  const profile = currentUser?.agentProfile;
  const isPro = profile?.tier === "PRO";
  const isVerified = profile?.verificationStatus === "VERIFIED";
  const isPending = profile?.verificationStatus === "PENDING";

  const totalViews = listings.reduce((acc, curr) => acc + (curr.viewsCount || 0), 0);
  const totalInquiries = listings.reduce((acc, curr) => acc + (curr.inquiriesCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Tier Status Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={
                currentUser?.avatar ||
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120"
              }
              alt="Agent"
              className="w-16 h-16 rounded-full object-cover border-2 border-brand-500"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {currentUser?.name}
                </h1>
                {isVerified ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Agent</span>
                  </span>
                ) : isPending ? (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                    Verification Awaiting Admin Approval
                  </span>
                ) : (
                  <button
                    onClick={() => setIsVerifyModalOpen(true)}
                    className="bg-red-100 hover:bg-red-200 text-red-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer"
                  >
                    <span>Upload ID for Verification →</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {profile?.agencyName || "Rental Agent"} • {profile?.campusSpecialization || "UNILAG Hub"}
              </p>
            </div>
          </div>

          {/* Current Tier Badge & Upgrade CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">
                Current Tier
              </span>
              <span className="font-extrabold text-slate-900 flex items-center gap-1">
                {isPro ? (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-amber-600">CribConnect PRO</span>
                  </>
                ) : (
                  <>
                    <span className="text-slate-600">FREE Tier (2 Listings Cap)</span>
                  </>
                )}
              </span>
            </div>

            {!isPro ? (
              <button
                type="button"
                onClick={openUpgradeModal}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Upgrade to Pro (Unlimited)</span>
              </button>
            ) : (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Unlimited Listings Active</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Prompt if Unverified */}
        {!isVerified && !isPending && (
          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Boost student trust: Submit your NIN and proof of address to earn the official Verified Agent badge.
              </span>
            </div>
            <button
              onClick={() => setIsVerifyModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0"
            >
              Submit Credentials
            </button>
          </div>
        )}
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Active Cribs</span>
            <Building2 className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {listings.length}
            {!isPro && <span className="text-xs font-normal text-slate-400"> / 2 max</span>}
          </div>
          <span className="text-[11px] text-slate-500">
            {isPro ? "Unlimited tier active" : "Free listing allowance"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Listing Impressions</span>
            <Eye className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalViews}</div>
          <span className="text-[11px] text-emerald-600 font-semibold">
            +18% from student searches
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Lead Inquiries</span>
            <MessageSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalInquiries}</div>
          <span className="text-[11px] text-slate-500">WhatsApp & in-app queries</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Client Rating</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ★ {profile?.rating?.toFixed(1) || "5.0"}
          </div>
          <span className="text-[11px] text-slate-500">
            {profile?.reviewCount || 0} student testimonials
          </span>
        </div>
      </div>

      {/* Listing Management Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Property Listings</h2>
            <p className="text-xs text-slate-500">
              Manage status, update walkthrough video links, or feature your best properties.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!isPro && listings.length >= 2) {
                openUpgradeModal();
              } else {
                setIsAddListingOpen(true);
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Property Listing</span>
          </button>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="font-bold text-sm text-slate-800">No properties listed yet</h3>
            <p className="text-xs text-slate-500">
              Upload your first verified student accommodation to start receiving inquiries.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {listings.map((item) => {
              let photos: string[] = [];
              try {
                photos = JSON.parse(item.photos);
              } catch {
                photos = [];
              }
              const photo = photos[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300";

              return (
                <div
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={photo}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/listings/${item.id}`}
                          className="font-bold text-slate-900 hover:text-brand-600 text-sm line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        {item.isFeatured && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2 rounded">
                            Featured
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 text-[11px] block">
                        {item.neighborhood} • {item.distanceDescription}
                      </span>
                      <div className="font-extrabold text-emerald-700 mt-0.5">
                        {formatMoney(item.price)} <span className="text-[10px] font-normal text-slate-500">/{item.period}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleToggleAvailable(item.id, item.isAvailable)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        item.isAvailable
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.isAvailable ? "Status: Available" : "Status: Rented"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteListing(item.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Listing Modal */}
      {isAddListingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Add New Property Listing</h3>
              <button
                onClick={() => setIsAddListingOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {listingError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
                {listingError}
              </div>
            )}

            <form onSubmit={handleCreateListing} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Property Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern Self-Con with Generator - 5 Mins to UNILAG New Hall Gate"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Detailed Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe room dimensions, water pressure, prepaid meter status, compound security..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Annual Rent (₦)
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 500000"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Property Type
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="SELF_CONTAIN">Self-Contain (Studio)</option>
                    <option value="ONE_BED">1-Bedroom Apartment</option>
                    <option value="TWO_BED">2-Bedroom Flat</option>
                    <option value="STUDIO">Serviced Studio with AC</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Neighborhood
                  </label>
                  <select
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="Akoka">Akoka</option>
                    <option value="Onike">Onike</option>
                    <option value="Abule-Oja">Abule-Oja</option>
                    <option value="Yaba">Yaba</option>
                    <option value="Bariga">Bariga</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Campus Gate Proximity (Mins)
                  </label>
                  <input
                    type="number"
                    value={distanceMinutes}
                    onChange={(e) => setDistanceMinutes(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Physical Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 14 St. Finbarr's College Road, Akoka"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Photo URL (Interior / Exterior)
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="Paste direct image URL or leave blank for default student crib photography"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Video Walkthrough Tour URL (YouTube / Stream)
                </label>
                <input
                  type="url"
                  value={videoTourUrl}
                  onChange={(e) => setVideoTourUrl(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/embed/dQw4w9WgXcQ"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Amenities (comma-separated)
                </label>
                <input
                  type="text"
                  value={amenitiesInput}
                  onChange={(e) => setAmenitiesInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddListingOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingListing}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-sm"
                >
                  {isSubmittingListing ? "Publishing..." : "Publish Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verification Documents Modal */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">
                Agent ID Verification Submission
              </h3>
              <button
                onClick={() => setIsVerifyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {verifySuccess ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-900 text-sm">Credentials Submitted!</h4>
                <p className="text-xs text-slate-500">
                  Platform administrators will inspect your NIN and ID documents.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitVerification} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Agency / Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="e.g. Yaba Accommodations & Co."
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    National Identity Number (NIN)
                  </label>
                  <input
                    type="text"
                    required
                    value={ninNumber}
                    onChange={(e) => setNinNumber(e.target.value)}
                    placeholder="11-digit NIMC NIN number"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Government ID Card URL / Photo
                  </label>
                  <input
                    type="url"
                    value={idDocumentUrl}
                    onChange={(e) => setIdDocumentUrl(e.target.value)}
                    placeholder="Paste link to scanned ID or NIN slip"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Professional Bio
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Briefly state your years of experience in student rentals..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setIsVerifyModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingVerify}
                    className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-sm flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Submit for Admin Approval</span>
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
