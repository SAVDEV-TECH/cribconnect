"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  ShieldCheck,
  Video,
  MapPin,
  Bed,
  Bath,
  Zap,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    period: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    neighborhood: string;
    distanceToCampusMinutes: number;
    distanceDescription?: string | null;
    photos: string;
    videoTourUrl?: string | null;
    amenities: string;
    isFeatured: boolean;
    viewsCount: number;
    agent: {
      id: string;
      name: string;
      phone?: string | null;
      whatsapp?: string | null;
      avatar?: string | null;
      agentProfile?: {
        verificationStatus: string;
        badges: string;
        rating: number;
      } | null;
    };
  };
  onOpenReport?: (listingId: string, title: string) => void;
}

export default function ListingCard({ listing, onOpenReport }: ListingCardProps) {
  const { formatMoney, openVideoTour } = useApp();
  const [photoIndex, setPhotoIndex] = useState(0);

  let photos: string[] = [];
  try {
    photos = JSON.parse(listing.photos);
  } catch {
    photos = [];
  }
  if (photos.length === 0) {
    photos = ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"];
  }

  let amenities: string[] = [];
  try {
    amenities = JSON.parse(listing.amenities);
  } catch {
    amenities = [];
  }

  const isVerifiedAgent = listing.agent.agentProfile?.verificationStatus === "VERIFIED";

  const nextPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const phone = listing.agent.whatsapp || listing.agent.phone || "+2348034452299";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const text = encodeURIComponent(
      `Hello ${listing.agent.name}, I saw your listing "${listing.title}" on CribConnect. Is it still available for inspection?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  return (
    <div className={`group bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col ${
      listing.isFeatured
        ? "border-amber-300 shadow-md ring-1 ring-amber-200"
        : "border-slate-200 hover:border-slate-300 hover:shadow-lg"
    }`}>
      {/* Image Gallery Container */}
      <div className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden">
        <img
          src={photos[photoIndex]}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Featured Tag */}
        {listing.isFeatured && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow flex items-center gap-1">
            <Sparkles className="w-3 h-3 fill-slate-900" /> Featured Crib
          </div>
        )}

        {/* Video Tour Badge */}
        {listing.videoTourUrl && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openVideoTour(listing.videoTourUrl!);
            }}
            className="absolute top-3 right-3 bg-slate-900/80 hover:bg-emerald-600 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-emerald-400" />
            <span>Virtual Tour</span>
          </button>
        )}

        {/* Campus Proximity Pill */}
        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1">
          <MapPin className="w-3 h-3 text-brand-400" />
          <span>{listing.distanceDescription || `${listing.distanceToCampusMinutes} mins to campus`}</span>
        </div>

        {/* Gallery Carousel Controls */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] px-1.5 py-0.5 rounded">
              {photoIndex + 1}/{photos.length}
            </div>
          </>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Price and Property Type */}
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                {formatMoney(listing.price)}
              </span>
              <span className="text-xs text-slate-500 ml-1">/{listing.period.replace("per ", "")}</span>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
              {listing.propertyType.replace("_", " ")}
            </span>
          </div>

          {/* Title */}
          <Link href={`/listings/${listing.id}`}>
            <h3 className="font-bold text-sm text-slate-900 line-clamp-2 hover:text-brand-600 transition-colors mt-1.5">
              {listing.title}
            </h3>
          </Link>

          {/* Room Specs */}
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-slate-400" />
              {listing.bedrooms} {listing.bedrooms === 1 ? "Bed" : "Beds"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-slate-400" />
              {listing.bathrooms} Bath
            </span>
            <span>•</span>
            <span className="truncate">{listing.neighborhood}</span>
          </div>

          {/* Key Amenities preview */}
          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {amenities.slice(0, 2).map((a, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium"
                >
                  ✓ {a}
                </span>
              ))}
              {amenities.length > 2 && (
                <span className="text-[10px] text-slate-400 px-1 py-0.5">
                  +{amenities.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Agent Info & Action Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <Link
            href={`/agents/${listing.agent.id}`}
            className="flex items-center gap-2 group/agent min-w-0"
          >
            <img
              src={
                listing.agent.avatar ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
              }
              alt={listing.agent.name}
              className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-800 truncate group-hover/agent:text-brand-600">
                  {listing.agent.name}
                </span>
                {isVerifiedAgent && (
                  <span title="Verified Agent">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block -mt-0.5 truncate">
                {isVerifiedAgent ? "Verified Local Agent" : "Independent Agent"}
              </span>
            </div>
          </Link>

          {/* Quick Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleWhatsApp}
              title="Chat with Agent on WhatsApp"
              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <Link
              href={`/listings/${listing.id}`}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-brand-600 text-white font-semibold text-xs transition-colors flex items-center gap-1"
            >
              <span>View</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
