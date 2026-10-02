"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Video,
  MapPin,
  CheckCircle2,
  Phone,
  MessageCircle,
  Calendar,
  Sparkles,
  ArrowLeft,
  Share2,
  Clock,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

export default function ListingDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Inspection Booking form state
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [inspectionDate, setInspectionDate] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/listings/${id}`);
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
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-96 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
        <h2 className="text-xl font-black text-slate-900">Listing Not Found</h2>
        <p className="text-xs text-slate-500">This property may have been rented or removed.</p>
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

  // Parse photos safely
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
  if (!photos || photos.length === 0) {
    photos = [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80",
    ];
  }

  // Parse amenities safely
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

  // Resolve agent contact
  const agentName = listing.agentName || listing.agent?.name || "Verified Agent";
  const agentPhone = listing.agentPhone || listing.agent?.phone || "+234 803 445 2299";
  const rawWhatsapp = listing.agentWhatsapp || listing.agent?.whatsapp || agentPhone;
  const whatsappNumber = rawWhatsapp.replace(/\D/g, "");

  const price = listing.price || 0;
  const cautionFee = listing.cautionFee || Math.round(price * 0.1);
  const agencyFee = listing.agencyFee || Math.round(price * 0.1);
  const totalUpfront = price + cautionFee + agencyFee;

  const whatsappMessage = encodeURIComponent(
    `Hello ${agentName}! I am interested in inspecting your listing on CribConnect: "${listing.title}" (₦${price.toLocaleString()}/yr) in ${listing.neighborhood}. When are you available for a physical walkthrough?`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  const handleBookInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
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
        }),
      });
      if (res.ok) {
        setBookingSuccess(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <Link href="/listings" className="inline-flex items-center gap-1.5 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Listings</span>
        </Link>
        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-bold">
          📍 {listing.neighborhood}, Lagos
        </span>
      </div>

      {/* Main Title & Campus Distance */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-bold">
              {listing.propertyType || "Self-Contain"}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Listing
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
            {listing.title}
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{listing.address || listing.neighborhood}</span>
            <span>•</span>
            <span className="font-bold text-slate-700">
              🚶 {listing.distanceDescription || `${listing.distanceToCampusMinutes || 5} mins walk to Campus Gate`}
            </span>
          </p>
        </div>

        <div className="text-left md:text-right shrink-0">
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            ₦{price.toLocaleString()}
            <span className="text-sm font-medium text-slate-500">/{listing.period || "yr"}</span>
          </div>
          <span className="text-xs text-emerald-700 font-semibold">
            Approx. ₦{Math.round(price / 12).toLocaleString()} / month
          </span>
        </div>
      </div>

      {/* Large Image Gallery */}
      <div className="space-y-3">
        <div className="aspect-[16/9] md:aspect-[21/9] bg-slate-100 rounded-3xl overflow-hidden shadow-md">
          <img
            src={photos[selectedPhotoIndex]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        </div>

        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setSelectedPhotoIndex(i)}
                className={`relative w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                  selectedPhotoIndex === i ? "border-emerald-600 scale-105" : "border-transparent opacity-70"
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
        {/* Left Column: Details & Transparency */}
        <div className="lg:col-span-2 space-y-8">
          {/* Total Move-In Fee Breakdown (Transparent - Anti-Scam) */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h3 className="font-black text-base text-slate-900">
                Transparent Fee Breakdown (Zero Hidden Charges)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-2xl border border-emerald-100">
                <span className="text-slate-500 block">Annual Base Rent</span>
                <span className="text-base font-black text-slate-900">₦{price.toLocaleString()}</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-emerald-100">
                <span className="text-slate-500 block">Caution Deposit</span>
                <span className="text-base font-black text-slate-900">₦{cautionFee.toLocaleString()}</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-emerald-100">
                <span className="text-slate-500 block">Agreement & Legal</span>
                <span className="text-base font-black text-slate-900">₦{agencyFee.toLocaleString()}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs font-bold text-emerald-950">
              <span>Total Estimated Move-in Upfront:</span>
              <span className="text-base font-black text-emerald-700">₦{totalUpfront.toLocaleString()}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="font-black text-lg text-slate-900">About This Crib</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Key Amenities */}
          <div className="space-y-3">
            <h3 className="font-black text-lg text-slate-900">Amenities & Features</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {amenities.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Video Walkthrough Player (if present) */}
          {listing.videoTourUrl && (
            <div className="space-y-3">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-emerald-600" />
                <span>Video Walkthrough Tour</span>
              </h3>
              <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-lg">
                <iframe
                  src={listing.videoTourUrl}
                  className="w-full h-full"
                  allowFullScreen
                  title="Virtual Tour"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Contact Agent Card (Sticky) */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl space-y-6 sticky top-24">
            {/* Agent Profile Summary */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <img
                src={listing.agentAvatar || listing.agent?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"}
                alt={agentName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-slate-900">{agentName}</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  {listing.agencyName || "Verified Housing Specialist"}
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold inline-block mt-0.5">
                  NIN Verified Realtor
                </span>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="space-y-2.5">
              {/* WhatsApp (Primary) */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat with Agent on WhatsApp</span>
              </a>

              {/* Call */}
              <a
                href={`tel:${agentPhone}`}
                className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4 text-slate-600" />
                <span>Call {agentPhone}</span>
              </a>
            </div>

            {/* Book Inspection Form */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Book a Free Physical Walkthrough
              </h4>

              {bookingSuccess ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Inspection request submitted! The agent will call you to confirm time.</span>
                </div>
              ) : (
                <form onSubmit={handleBookInspection} className="space-y-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Your Phone / WhatsApp"
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <input
                    type="date"
                    required
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                  >
                    {bookingLoading ? "Booking..." : "Schedule Physical Inspection"}
                  </button>
                </form>
              )}
            </div>

            {/* Anti-Scam Advisory */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
              <span className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Safety Notice
              </span>
              <p className="text-[10px] text-amber-800 leading-relaxed">
                Never pay rent or caution fee into personal accounts until you have physically inspected the apartment and met the verified agent in person.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
