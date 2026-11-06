"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Video, MapPin, MessageCircle, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

interface ListingCardProps {
  listing: any;
  onOpenReport?: (listingId: string, title: string) => void;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);

  let photos: string[] = [];
  try {
    photos = Array.isArray(listing.photos) ? listing.photos : JSON.parse(listing.photos || "[]");
  } catch {
    photos = [];
  }
  if (!photos.length) {
    photos = ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80"];
  }

  let amenities: string[] = [];
  try {
    amenities = Array.isArray(listing.amenities) ? listing.amenities : JSON.parse(listing.amenities || "[]");
  } catch {
    amenities = [];
  }

  const agentName = listing.agentName || listing.agent?.name || "Verified Agent";
  const rawWhatsapp = listing.agentWhatsapp || listing.agent?.whatsapp || listing.agentPhone || "";
  const whatsappNumber = rawWhatsapp.replace(/\D/g, "");

  const typeLabel: Record<string, string> = {
    SELF_CONTAIN: "Self-Contain",
    ONE_BED: "1-Bedroom",
    TWO_BED: "2-Bedroom",
    STUDIO: "Studio",
  };

  const formattedPrice = `₦${(listing.price || 0).toLocaleString()}`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hi! I saw your listing on CribConnect: "${listing.title}" (${formattedPrice}/yr). Is it still available?`
  )}`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:border-gray-300 hover:shadow-sm transition-all duration-200">

      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden group">
        <img
          src={photos[photoIndex]}
          alt={listing.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Type badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2 py-0.5 rounded-md bg-white/90 text-gray-700 text-xs font-medium border border-gray-200/60">
            {typeLabel[listing.propertyType] || "Apartment"}
          </span>
        </div>

        {/* Video badge */}
        {listing.videoTourUrl && (
          <div className="absolute top-2.5 right-2.5">
            <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-xs font-medium flex items-center gap-1">
              <Video className="w-3 h-3" /> Video
            </span>
          </div>
        )}

        {/* Photo nav — show on hover */}
        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); setPhotoIndex((p) => (p > 0 ? p - 1 : photos.length - 1)); }}
              className="absolute left-2 top-1/2 -trangray-y-1/2 w-6 h-6 rounded-full bg-white/80 text-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setPhotoIndex((p) => (p < photos.length - 1 ? p + 1 : 0)); }}
              className="absolute right-2 top-1/2 -trangray-y-1/2 w-6 h-6 rounded-full bg-white/80 text-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            {/* Dot indicators */}
            <div className="absolute bottom-2 left-1/2 -trangray-x-1/2 flex gap-1">
              {photos.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all ${i === photoIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-3">

        {/* Price + distance */}
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <span className="text-lg font-bold text-gray-900">{formattedPrice}</span>
            <span className="text-xs text-gray-400 ml-1">/{listing.period || "yr"}</span>
          </div>
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 shrink-0">
            {listing.distanceDescription || `${listing.distanceToCampusMinutes || 5}m to gate`}
          </span>
        </div>

        {/* Title */}
        <Link href={`/listings/${listing.id}`} className="block">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug hover:text-emerald-700 transition-colors line-clamp-2">
            {listing.title}
          </h3>
        </Link>

        {/* Location */}
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
          <span className="line-clamp-1">{listing.address || listing.neighborhood}</span>
        </p>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {amenities.slice(0, 3).map((a, i) => (
              <span key={i} className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                {a}
              </span>
            ))}
            {amenities.length > 3 && (
              <span className="text-xs text-gray-400">+{amenities.length - 3}</span>
            )}
          </div>
        )}

        {/* Agent + actions */}
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={listing.agentAvatar || listing.agent?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80"}
              alt={agentName}
              className="w-6 h-6 rounded-full object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{agentName}</p>
              <p className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3" /> Verified
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
              title="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <Link
              href={`/listings/${listing.id}`}
              className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-emerald-700 text-white text-xs font-medium transition-colors flex items-center gap-1"
            >
              View <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
