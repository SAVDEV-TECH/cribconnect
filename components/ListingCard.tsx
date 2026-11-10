"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Video,
  MapPin,
  MessageCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Lock,
  X,
} from "lucide-react";

interface ListingCardProps {
  listing: any;
  onOpenReport?: (listingId: string, title: string) => void;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showConnectGate, setShowConnectGate] = useState(false);

  let photos: string[] = [];
  try {
    photos = Array.isArray(listing.photos) ? listing.photos : JSON.parse(listing.photos || "[]");
  } catch {
    photos = [];
  }
  if (!photos.length) {
    photos = [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80",
    ];
  }

  let amenities: string[] = [];
  try {
    amenities = Array.isArray(listing.amenities)
      ? listing.amenities
      : JSON.parse(listing.amenities || "[]");
  } catch {
    amenities = [];
  }

  const agentName = listing.agentName || listing.agent?.name || "Verified Agent";
  const rawWhatsapp =
    listing.agentWhatsapp || listing.agent?.whatsapp || listing.agentPhone || "";
  const cleanPhone = rawWhatsapp.replace(/\D/g, "");
  const intlPhone = cleanPhone.startsWith("0")
    ? "234" + cleanPhone.slice(1)
    : cleanPhone || "2348063345521";

  const typeLabel: Record<string, string> = {
    SELF_CONTAIN: "Self-Contain",
    ONE_BED: "1-Bedroom",
    TWO_BED: "2-Bedroom",
    STUDIO: "Serviced Studio",
  };

  const formattedPrice = `₦${(listing.price || 0).toLocaleString()}`;
  const trackingCode = `CC-${String(listing.id || "UNI").slice(-5).toUpperCase()}`;
  const whatsappUrl = `https://wa.me/${intlPhone}?text=${encodeURIComponent(
    `[CribConnect Tracked Lead #${trackingCode}]\nHello ${agentName}, I am interested in inspecting "${listing.title}" (${formattedPrice}/yr at ${listing.neighborhood}) on CribConnect.\n\n⚠️ Note: I will reserve and release payment strictly through CribConnect 48-Hour Escrow Protection after physical inspection.`
  )}`;

  const handleTrackConnect = () => {
    fetch(`/api/listings/${listing.id}`, { method: "POST" }).catch(() => {});
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden flex flex-col hover:border-gray-300 hover:shadow-md transition-all duration-200 relative">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden group">
        <Link href={`/listings/${listing.id}`} className="block w-full h-full">
          <img
            src={photos[photoIndex]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
        </Link>

        {/* Top-left Type + Escrow badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-xs text-gray-900 text-[11px] font-bold shadow-xs">
            {typeLabel[listing.propertyType] || "Apartment"}
          </span>
          <span className="px-2 py-1 rounded-lg bg-emerald-600/95 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
            <Lock className="w-2.5 h-2.5" /> Escrow
          </span>
        </div>

        {/* Video badge */}
        {listing.videoTourUrl && (
          <div className="absolute top-2.5 right-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-gray-900/85 text-white text-[10px] font-bold flex items-center gap-1">
              <Video className="w-3 h-3 text-emerald-400" /> Video Tour
            </span>
          </div>
        )}

        {/* Photo nav — show on hover */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setPhotoIndex((p) => (p > 0 ? p - 1 : photos.length - 1));
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 text-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setPhotoIndex((p) => (p < photos.length - 1 ? p + 1 : 0));
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 text-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
              {photos.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === photoIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2.5">
        {/* Price + distance */}
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <span className="text-lg font-extrabold text-gray-900 tracking-tight">
              {formattedPrice}
            </span>
            <span className="text-xs text-gray-500 ml-1">/{listing.period || "yr"}</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 shrink-0">
            {listing.distanceDescription || `${listing.distanceToCampusMinutes || 5}m to gate`}
          </span>
        </div>

        {/* Title */}
        <Link href={`/listings/${listing.id}`} className="block">
          <h3 className="text-sm font-bold text-gray-900 leading-snug hover:text-emerald-700 transition-colors line-clamp-1">
            {listing.title}
          </h3>
        </Link>

        {/* Location */}
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
          <span className="line-clamp-1">{listing.address || listing.neighborhood}</span>
        </p>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {amenities.slice(0, 3).map((a, i) => (
              <span
                key={i}
                className="text-[11px] text-gray-600 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md"
              >
                {a}
              </span>
            ))}
            {amenities.length > 3 && (
              <span className="text-[11px] text-gray-400 px-1">+{amenities.length - 3}</span>
            )}
          </div>
        )}

        {/* Agent + Protected Actions */}
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={
                listing.agentAvatar ||
                listing.agent?.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(agentName)}`
              }
              alt={agentName}
              className="w-6 h-6 rounded-full object-cover shrink-0 border border-gray-200"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{agentName}</p>
              <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3" /> Verified Partner
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowConnectGate(true)}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
              title="Protected Connect"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <Link
              href={`/listings/${listing.id}`}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>Inspect / Lock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Anti-Bypass & Escrow Protection Overlay when clicking Message Icon */}
      {showConnectGate && (
        <div className="absolute inset-0 z-20 bg-white/98 backdrop-blur-xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>CribConnect Escrow Protection</span>
            </div>
            <button
              type="button"
              onClick={() => setShowConnectGate(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 my-auto py-2">
            <p className="text-xs font-bold text-gray-900">
              Protect Your Money &amp; Inspection Rights
            </p>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Do <strong>not</strong> pay inspection fees or rent directly into personal WhatsApp accounts. Lock this apartment with <strong>CribConnect 48-Hour Escrow</strong> first so your money is 100% refundable if the house doesn&apos;t match.
            </p>
            <div className="text-[10px] font-mono bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700">
              Lead Tracking ID: <strong>{trackingCode}</strong> (Logged to CribConnect Admin)
            </div>
          </div>

          <div className="space-y-1.5">
            <Link
              href={`/listings/${listing.id}`}
              onClick={handleTrackConnect}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Room via Escrow &amp; Book Inspection</span>
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                handleTrackConnect();
                setShowConnectGate(false);
              }}
              className="w-full py-1.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ask Question on WhatsApp (Tracked Lead #{trackingCode})</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
