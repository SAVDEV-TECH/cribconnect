"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import ReportModal from "@/components/ReportModal";
import {
  ShieldCheck,
  Video,
  MapPin,
  Bed,
  Bath,
  CheckCircle2,
  Phone,
  MessageCircle,
  MessageSquare,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Share2,
  Calendar,
  Sparkles,
  Info,
  Building2,
} from "lucide-react";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const { formatMoney, openVideoTour, currentUser } = useApp();

  const [listing, setListing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // In-app message popup state
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [inAppMessage, setInAppMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/listings/${id}`);
        const data = await res.json();
        if (data.listing) {
          setListing(data.listing);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchListing();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-slate-500">
        Loading property details...
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Property Not Found</h2>
        <p className="text-xs text-slate-500">
          This listing might have been rented or removed by the agent.
        </p>
        <Link
          href="/listings"
          className="inline-block px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
        >
          Browse Other Listings
        </Link>
      </div>
    );
  }

  let photos: string[] = [];
  try {
    photos = JSON.parse(listing.photos);
  } catch {
    photos = [];
  }
  if (photos.length === 0) {
    photos = ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200"];
  }

  let amenities: string[] = [];
  try {
    amenities = JSON.parse(listing.amenities);
  } catch {
    amenities = [];
  }

  const agent = listing.agent;
  const agentProfile = agent.agentProfile;
  const isVerified = agentProfile?.verificationStatus === "VERIFIED";

  // Financial breakdown calculations
  const rentPrice = listing.price;
  const agencyFee = Math.round(rentPrice * 0.1);
  const cautionDeposit = Math.round(rentPrice * 0.1);
  const totalUpfront = rentPrice + agencyFee + cautionDeposit;

  const handleWhatsApp = () => {
    const phone = agent.whatsapp || agent.phone || "+2348034452299";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const text = encodeURIComponent(
      `Hello ${agent.name}, I am interested in inspecting "${listing.title}" on CribConnect (₦${rentPrice.toLocaleString()}/yr). When is the earliest I can view it?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  const handleSendInAppMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inAppMessage.trim()) return;
    setIsSendingMessage(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: agent.id,
          content: inAppMessage,
          listingId: listing.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessageSent(true);
        setTimeout(() => {
          setMessageSent(false);
          setIsMessageModalOpen(false);
          setInAppMessage("");
          router.push("/messages");
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumbs & Actions */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Link href="/listings" className="hover:text-slate-900 transition-colors">
            Rentals
          </Link>
          <span>/</span>
          <span className="text-slate-700">{listing.neighborhood}</span>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">
            {listing.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                alert("Listing link copied to clipboard!");
              }
            }}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            onClick={() => setIsReportOpen(true)}
            className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors flex items-center gap-1"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Report</span>
          </button>
        </div>
      </div>

      {/* Hero Title & Location */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">
            {listing.propertyType.replace("_", " ")}
          </span>
          <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {listing.distanceDescription || `${listing.distanceToCampusMinutes} mins to campus`}
          </span>
          {listing.isFeatured && (
            <span className="text-xs font-extrabold uppercase bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Featured
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          {listing.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span>{listing.address}, {listing.neighborhood}, {listing.city}</span>
        </p>
      </div>

      {/* Photo Gallery & Video Tour Feature */}
      <div className="space-y-3">
        <div className="relative aspect-[16/9] md:aspect-[21/9] w-full rounded-2xl overflow-hidden bg-slate-950 shadow-md">
          <img
            src={photos[selectedPhotoIndex]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />

          {/* Video Walkthrough overlay button */}
          {listing.videoTourUrl && (
            <button
              onClick={() => openVideoTour(listing.videoTourUrl)}
              className="absolute bottom-4 left-4 bg-slate-900/90 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 backdrop-blur-sm transition-all hover:scale-105"
            >
              <Video className="w-4 h-4 text-emerald-400" />
              <span>Watch Video Walkthrough Tour</span>
            </button>
          )}

          {photos.length > 1 && (
            <>
              <button
                onClick={() =>
                  setSelectedPhotoIndex(
                    (prev) => (prev - 1 + photos.length) % photos.length
                  )
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setSelectedPhotoIndex((prev) => (prev + 1) % photos.length)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails row */}
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {photos.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedPhotoIndex(idx)}
                className={`relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                  selectedPhotoIndex === idx
                    ? "border-brand-600 scale-105 shadow-sm"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img src={p} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Details + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Property Description & Amenities (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Quick Stats Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 grid grid-cols-3 gap-4 text-center shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-center text-slate-400 mb-1">
                <Bed className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Bedrooms</div>
              <div className="text-base font-bold text-slate-900">{listing.bedrooms}</div>
            </div>
            <div className="space-y-1 border-x border-slate-100">
              <div className="flex items-center justify-center text-slate-400 mb-1">
                <Bath className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Bathrooms</div>
              <div className="text-base font-bold text-slate-900">{listing.bathrooms}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center text-slate-400 mb-1">
                <MapPin className="w-5 h-5 text-brand-600" />
              </div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Campus Gate</div>
              <div className="text-base font-bold text-slate-900">{listing.distanceToCampusMinutes} Mins</div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">About this Accommodation</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Amenities & Utilities */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">Verified Amenities & Utilities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {amenities.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-medium text-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transparent Fee Itemization */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Upfront Rental Cost Breakdown</h2>
              <span className="text-[11px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded">
                Zero Hidden Charges
              </span>
            </div>
            <p className="text-xs text-slate-500">
              CribConnect mandates transparent disclosure of all agreement and caution fees to prevent move-in surprises.
            </p>

            <div className="divide-y divide-slate-100 text-xs text-slate-700">
              <div className="py-2.5 flex justify-between">
                <span>Annual Base Rent ({listing.period}):</span>
                <span className="font-bold text-slate-900">{formatMoney(rentPrice)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span>Legal & Agreement Fee (~10%):</span>
                <span className="font-semibold">{formatMoney(agencyFee)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span>Refundable Caution Deposit (~10%):</span>
                <span className="font-semibold">{formatMoney(cautionDeposit)}</span>
              </div>
              <div className="py-3 flex justify-between text-sm font-extrabold text-slate-900 bg-slate-50 px-3 rounded-xl mt-2">
                <span>Estimated Total Move-in Upfront:</span>
                <span className="text-emerald-700">{formatMoney(totalUpfront)}</span>
              </div>
            </div>
          </div>

          {/* Student Anti-Scam Advisory */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-2 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>CribConnect Student Safety Protocol</span>
            </div>
            <p className="leading-relaxed">
              Never transfer inspection fees to any agent or third-party bank account. Always verify credentials via our platform badges, inspect the property in-person or via authenticated live video tour, and ensure an official tenancy agreement receipt is issued.
            </p>
          </div>
        </div>

        {/* Right Column: Verified Agent & Direct Contact Card (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-5 sticky top-24">
            {/* Pricing Header */}
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold">Rent</span>
              <div className="text-2xl font-black text-slate-900">
                {formatMoney(listing.price)}
                <span className="text-xs font-normal text-slate-500 ml-1">/{listing.period.replace("per ", "")}</span>
              </div>
            </div>

            {/* Agent Profile Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={agent.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120"}
                  alt={agent.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-slate-900 truncate">{agent.name}</h3>
                    {isVerified && <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {agentProfile?.agencyName || "Certified Rental Agent"}
                  </p>
                  <div className="text-[10px] text-amber-600 font-bold">
                    ★ {agentProfile?.rating?.toFixed(1) || "5.0"} ({agentProfile?.reviewCount || 0} reviews)
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 border-t border-slate-200 pt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Specialization:</span>
                  <span className="font-medium text-slate-800">UNILAG & Yaba</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>ID Status:</span>
                  <span className="font-semibold text-emerald-700">
                    {isVerified ? "✓ National ID Verified" : "Verification Pending"}
                  </span>
                </div>
              </div>

              <Link
                href={`/agents/${agent.id}`}
                className="block text-center text-[11px] font-bold text-brand-600 hover:text-brand-700 hover:underline pt-1"
              >
                View Full Agent Profile & Reviews →
              </Link>
            </div>

            {/* Direct Contact Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleWhatsApp}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat Agent on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMessageModalOpen(true)}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-brand-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message In-App (Anti-Scam Tracked)</span>
              </button>

              {agent.phone && (
                <a
                  href={`tel:${agent.phone}`}
                  className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>Call {agent.phone}</span>
                </a>
              )}
            </div>

            {/* In-App Message Modal */}
            {isMessageModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-sm text-slate-900">
                      Message {agent.name}
                    </h3>
                    <button
                      onClick={() => setIsMessageModalOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {messageSent ? (
                    <div className="text-center py-6 space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                      <div className="font-bold text-xs text-slate-900">Message Sent!</div>
                      <p className="text-[11px] text-slate-500">Redirecting to chat inbox...</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSendInAppMessage} className="space-y-3">
                      <p className="text-[11px] text-slate-500">
                        In-app messages are monitored by CribConnect trust & safety against fee scams.
                      </p>
                      <textarea
                        rows={4}
                        required
                        value={inAppMessage}
                        onChange={(e) => setInAppMessage(e.target.value)}
                        placeholder={`Hi ${agent.name}, I'm interested in "${listing.title}". Is it possible to schedule a video inspection?`}
                        className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsMessageModalOpen(false)}
                          className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSendingMessage}
                          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm"
                        >
                          {isSendingMessage ? "Sending..." : "Send Message"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {isReportOpen && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          targetType="LISTING"
          targetId={listing.id}
          targetTitle={listing.title}
        />
      )}
    </div>
  );
}
