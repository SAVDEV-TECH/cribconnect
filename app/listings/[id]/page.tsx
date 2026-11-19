"use client";

import React, { useState, useEffect } from "react";
import EscrowModal from "@/components/EscrowModal";
import ReportModal from "@/components/ReportModal";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Video,
  MapPin,
  CheckCircle2,
  Phone,
  MessageCircle,
  ArrowLeft,
  AlertTriangle,
  Flag,
  Building2,
} from "lucide-react";
import {
  buildWhatsAppUrl,
  formatPeriodLabel,
  normalizeVideoTourUrl,
} from "@/lib/types";

export default function ListingDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [inspectionDate, setInspectionDate] = useState("");
  const [inspectionTime, setInspectionTime] = useState("11:00 AM - 1:00 PM");
  const [inspectionMessage, setInspectionMessage] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/listings/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (data.listing) {
          setListing(data.listing);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-96 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-xl border border-gray-200 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Listing Not Found</h2>
        <p className="text-xs text-gray-500">This property may have been rented or removed.</p>
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Cribs</span>
        </Link>
      </div>
    );
  }

  let photos: string[] = [];
  try {
    if (Array.isArray(listing.photos)) {
      photos = listing.photos;
    } else if (typeof listing.photos === "string") {
      photos = JSON.parse(listing.photos);
    }
  } catch {
    photos = [];
  }

  let amenities: string[] = [];
  try {
    if (Array.isArray(listing.amenities)) {
      amenities = listing.amenities;
    } else if (typeof listing.amenities === "string") {
      amenities = JSON.parse(listing.amenities);
    }
  } catch {
    amenities = [];
  }

  const agentName = listing.agentName || listing.agent?.name || "Property Provider";
  const agentPhone = listing.agentPhone || listing.agent?.phone || "";
  const rawWhatsapp = listing.agentWhatsapp || listing.agent?.whatsapp || agentPhone;
  const isVerified = Boolean(
    listing.agentVerified || listing.agent?.agentProfile?.verificationStatus === "VERIFIED"
  );

  const price = listing.price || 0;
  const cautionFee =
    typeof listing.cautionFee === "number" ? listing.cautionFee : Math.round(price * 0.1);
  const agencyFee =
    typeof listing.agencyFee === "number" ? listing.agencyFee : Math.round(price * 0.1);
  const totalUpfront = price + cautionFee + agencyFee;
  const periodLabel = formatPeriodLabel(listing.period);

  const whatsappUrl = buildWhatsAppUrl(
    rawWhatsapp,
    `Hello ${agentName}! I am interested in inspecting your listing on CribConnect: "${listing.title}" (₦${price.toLocaleString()}/${periodLabel}) in ${listing.neighborhood}. When are you available for a physical walkthrough?`
  );

  const normalizedVideo = normalizeVideoTourUrl(listing.videoTourUrl);
  const mapLocationQuery = `${listing.address || listing.neighborhood}, ${
    listing.neighborhood || ""
  }, Port Harcourt, Rivers State, Nigeria`;

  const handleTrackWhatsApp = () => {
    fetch(`/api/listings/${listing.id}`, { method: "POST" }).catch(() => {});
  };

  const handleBookInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          listingTitle: listing.title,
          tenantName,
          tenantPhone,
          preferredDate: inspectionDate,
          preferredTime: inspectionTime,
          message: inspectionMessage || "I would like to schedule a physical inspection.",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBookingError(data.error || "Could not book inspection. Please check your details.");
        return;
      }
      setBookingSuccess(true);
    } catch {
      setBookingError("Network error while booking inspection. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
        <Link href="/listings" className="inline-flex items-center gap-1.5 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Listings</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-bold">
            {listing.neighborhood}, Port Harcourt
          </span>
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report</span>
          </button>
        </div>
      </div>

      {/* Main Title & Campus Distance */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-gray-900 text-white text-[11px] font-bold">
              {listing.propertyType || "Self-Contain"}
            </span>
            {isVerified && (
              <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-[11px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Verified Agent
              </span>
            )}
            {listing.isAvailable === false && (
              <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold">
                Rented / Unavailable
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            {listing.title}
          </h1>
          <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{listing.address || listing.neighborhood}</span>
            <span>·</span>
            <span className="font-bold text-gray-700">
              {listing.distanceDescription ||
                `${listing.distanceToCampusMinutes ?? 5} mins to Campus Gate`}
            </span>
          </p>
        </div>

        <div className="text-left md:text-right shrink-0">
          <div className="text-3xl font-bold text-gray-900 tracking-tight">
            ₦{price.toLocaleString()}
            <span className="text-sm font-medium text-gray-500">/{periodLabel}</span>
          </div>
          <span className="text-xs text-emerald-700 font-semibold">
            Approx. ₦{Math.round(price / 12).toLocaleString()} / month
          </span>
        </div>
      </div>

      {/* Large Image Gallery */}
      <div className="space-y-3">
        <div className="aspect-[16/9] md:aspect-[21/9] bg-gray-100 rounded-xl overflow-hidden shadow-sm">
          {photos.length > 0 ? (
            <img
              src={photos[selectedPhotoIndex]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-gray-100 text-gray-500 gap-2">
              <Building2 className="w-10 h-10 text-emerald-600/50" />
              <span className="text-xs font-medium">No property photos uploaded yet</span>
            </div>
          )}
        </div>

        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedPhotoIndex(i)}
                className={`relative w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                  selectedPhotoIndex === i
                    ? "border-emerald-600 scale-105"
                    : "border-transparent opacity-70"
                }`}
              >
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Fee Breakdown */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-base text-gray-900">Fee Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
                <span className="text-gray-500 block">Base Rent</span>
                <span className="text-base font-bold text-gray-900">
                  ₦{price.toLocaleString()}
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
                <span className="text-gray-500 block">Caution Deposit</span>
                <span className="text-base font-bold text-gray-900">
                  ₦{cautionFee.toLocaleString()}
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
                <span className="text-gray-500 block">Agreement &amp; Agency</span>
                <span className="text-base font-bold text-gray-900">
                  ₦{agencyFee.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs font-bold text-emerald-950">
              <span>Total Estimated Move-in Upfront:</span>
              <span className="text-base font-bold text-emerald-700">
                ₦{totalUpfront.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg text-gray-900">About This Crib</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Key Amenities */}
          {amenities.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-gray-900">Amenities &amp; Features</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {amenities.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Walkthrough Player (HTML5 <video> for uploaded clips, sandboxed <iframe> for YouTube/Vimeo) */}
          {normalizedVideo && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-emerald-600" />
                <span>Video Walkthrough Tour</span>
              </h3>
              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-sm">
                {normalizedVideo.kind === "video" ? (
                  <video
                    src={normalizedVideo.src}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <iframe
                    src={normalizedVideo.src}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Virtual Tour"
                  />
                )}
              </div>
            </div>
          )}

          {/* Google Maps Location */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>Satellite Location &amp; Campus Distance</span>
              </h3>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  mapLocationQuery
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Open Google Maps Directions →
              </a>
            </div>
            <div className="h-72 w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
              <iframe
                title="Property Satellite Map"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  mapLocationQuery
                )}&t=h&z=16&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Escrow Guarantee */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Student Inspection Guarantee</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Every tenant who reserves via CribConnect Escrow is protected by a private
                  4-digit physical inspection PIN.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0">
                100% Protected
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Agent Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6 sticky top-24">
            {/* Agent Profile Summary */}
            <Link
              href={listing.agentId ? `/agents/${listing.agentId}` : "/agents"}
              className="flex items-center gap-3.5 pb-4 border-b border-gray-100 hover:opacity-85 transition-opacity"
            >
              <img
                src={
                  listing.agentAvatar ||
                  listing.agent?.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(agentName)}`
                }
                alt={agentName}
                className="w-14 h-14 rounded-xl object-cover border border-gray-200 shadow-sm"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-gray-900">{agentName}</span>
                  {isVerified && <ShieldCheck className="w-4 h-4 text-green-600" />}
                </div>
                <span className="text-[11px] text-gray-500 font-medium block">
                  {listing.agencyName || "Independent Housing Provider"}
                </span>
                {isVerified ? (
                  <span className="text-[10px] text-green-800 bg-green-50 border border-green-200 px-2 py-0.5 rounded font-bold inline-block mt-0.5">
                    Verified Realtor · View Profile
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-medium inline-block mt-0.5">
                    View Provider Profile
                  </span>
                )}
              </div>
            </Link>

            {/* Escrow Reservation Card */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-700 text-white text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3" /> Escrow Protected
                </span>
                <span className="text-[11px] font-semibold text-emerald-800">48-Hour Lock</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  Lock Room &amp; Hold for Inspection
                </h3>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                  Pay a ₦10,000 holding deposit into CribConnect Escrow. The agent cannot rent this
                  room to anyone else for 48 hours. 100% refunded if you inspect and reject.
                </p>
              </div>
              <button
                type="button"
                disabled={listing.isAvailable === false}
                onClick={() => setShowEscrowModal(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Reserve with ₦10k Escrow</span>
              </button>
            </div>

            {/* Direct Action Buttons */}
            <div className="space-y-2.5">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleTrackWhatsApp}
                  className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Contact Agent on WhatsApp</span>
                </a>
              )}

              {agentPhone && (
                <a
                  href={`tel:${agentPhone}`}
                  className="w-full py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span>Call {agentPhone}</span>
                </a>
              )}
            </div>

            {/* Book Inspection Form */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Book a Viewing
              </h4>

              {bookingError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {bookingError}
                </div>
              )}

              {bookingSuccess ? (
                <div className="p-3.5 rounded-xl bg-green-50 text-green-800 border border-green-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>Viewing request submitted! The agent will contact you to confirm.</span>
                </div>
              ) : (
                <form onSubmit={handleBookInspection} className="space-y-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Your Phone / WhatsApp (e.g. 08034452299)"
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      required
                      value={inspectionDate}
                      onChange={(e) => setInspectionDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <select
                      value={inspectionTime}
                      onChange={(e) => setInspectionTime(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="9:00 AM - 11:00 AM">Morning (9am - 11am)</option>
                      <option value="11:00 AM - 1:00 PM">Midday (11am - 1pm)</option>
                      <option value="2:00 PM - 4:00 PM">Afternoon (2pm - 4pm)</option>
                      <option value="4:00 PM - 6:00 PM">Evening (4pm - 6pm)</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Note for Agent (e.g. 200L Student, checking water)"
                    value={inspectionMessage}
                    onChange={(e) => setInspectionMessage(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors disabled:opacity-50"
                  >
                    {bookingLoading ? "Booking..." : "Book a Viewing"}
                  </button>
                </form>
              )}
            </div>

            {/* Anti-Scam Advisory */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
              <span className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Safety Notice
              </span>
              <p className="text-[10px] text-amber-800 leading-relaxed">
                Never pay rent or caution fee into personal accounts until you have physically
                inspected the apartment and met the agent in person.
              </p>
            </div>
          </div>
        </div>
      </div>

      {listing && (
        <EscrowModal
          isOpen={showEscrowModal}
          onClose={() => setShowEscrowModal(false)}
          listing={listing}
        />
      )}

      {listing && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetType="LISTING"
          targetId={listing.id}
          targetTitle={listing.title}
        />
      )}
    </div>
  );
}
