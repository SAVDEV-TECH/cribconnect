"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Video,
  MapPin,
  MessageCircle,
  Phone,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface ListingCardProps {
  listing: any;
  onOpenReport?: (listingId: string, title: string) => void;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);

  // Parse photos safely (handles both Array and JSON string)
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

  // Resolve agent info
  const agentName = listing.agentName || listing.agent?.name || "Verified Agent";
  const agentPhone = listing.agentPhone || listing.agent?.phone || "+234 803 445 2299";
  const rawWhatsapp = listing.agentWhatsapp || listing.agent?.whatsapp || agentPhone;
  const whatsappNumber = rawWhatsapp.replace(/\D/g, "");

  const propertyTypeLabel = (type: string) => {
    switch (type) {
      case "SELF_CONTAIN":
        return "Self-Contain";
      case "ONE_BED":
        return "1-Bedroom Flat";
      case "TWO_BED":
        return "2-Bedroom Flat";
      case "STUDIO":
        return "Serviced Studio";
      default:
        return "Apartment";
    }
  };

  const formattedPrice = `₦${(listing.price || 0).toLocaleString()}`;
  const whatsappMessage = encodeURIComponent(
    `Hello! I saw your listing on CribConnect: "${listing.title}" (${formattedPrice}/yr). Is it still available for physical inspection?`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col group">
      {/* Image Gallery Header */}
      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
        <img
          src={photos[photoIndex]}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Overlay Tags */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold">
            {propertyTypeLabel(listing.propertyType)}
          </span>
          {listing.isFeatured && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black flex items-center gap-1 shadow-md">
              <Sparkles className="w-3 h-3" /> Featured
            </span>
          )}
        </div>

        {listing.videoTourUrl && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 rounded-full bg-emerald-600/90 backdrop-blur text-white text-[10px] font-bold flex items-center gap-1 shadow">
              <Video className="w-3 h-3" /> Video Tour
            </span>
          </div>
        )}

        {/* Photo Navigation dots */}
        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                setPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                setPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/30 backdrop-blur px-2 py-0.5 rounded-full">
              {photos.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === photoIndex ? "bg-white w-3" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Price & Campus Distance */}
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                {formattedPrice}
              </span>
              <span className="text-xs text-slate-500 font-medium ml-1">
                /{listing.period || "yr"}
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
              🚶 {listing.distanceDescription || `${listing.distanceToCampusMinutes || 5}m to Gate`}
            </span>
          </div>

          {/* Title */}
          <Link href={`/listings/${listing.id}`} className="block group-hover:text-emerald-600 transition-colors">
            <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
              {listing.title}
            </h3>
          </Link>

          {/* Location */}
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="line-clamp-1">{listing.address || listing.neighborhood}</span>
          </p>

          {/* Amenities Pills */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {amenities.slice(0, 3).map((item, idx) => (
              <span
                key={idx}
                className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
              >
                {item}
              </span>
            ))}
            {amenities.length > 3 && (
              <span className="text-[10px] text-slate-400 font-medium py-0.5">
                +{amenities.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Agent Info & CTAs */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Agent Avatar & Name */}
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={listing.agentAvatar || listing.agent?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
              alt={agentName}
              className="w-7 h-7 rounded-full object-cover border border-slate-200"
            />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-800 truncate block">
                {agentName}
              </span>
              <span className="text-[10px] text-emerald-700 flex items-center gap-0.5 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Agent
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* WhatsApp Direct */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition-all border border-emerald-200"
              title="Chat directly on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>

            {/* View Details */}
            <Link
              href={`/listings/${listing.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold transition-colors"
            >
              <span>View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
