"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { formatMoney } from "@/lib/types";
import { ShieldCheck, Video, MapPin, ExternalLink } from "lucide-react";

interface ListingItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  photos: string;
  latitude: number;
  longitude: number;
  distanceDescription?: string | null;
  agent?: {
    name: string;
    agentProfile?: {
      verificationStatus: string;
    } | null;
  } | null;
}

interface MapInnerProps {
  listings: ListingItem[];
  center?: [number, number];
  zoom?: number;
  activeListingId?: string | null;
  onSelectListing?: (id: string) => void;
}

// Campus Gate Pins for UNILAG
const CAMPUS_PINS = [
  {
    name: "UNILAG Main Gate (Akoka)",
    lat: 6.5186,
    lng: 3.3881,
    desc: "Primary entry for commercial buses & campus cabs",
  },
  {
    name: "UNILAG New Hall Gate",
    lat: 6.5195,
    lng: 3.386,
    desc: "Direct access to undergraduate halls of residence",
  },
  {
    name: "UNILAG Education Gate",
    lat: 6.516,
    lng: 3.391,
    desc: "Direct access to Faculty of Education and Sports Centre",
  },
  {
    name: "YabaTech Main Gate",
    lat: 6.5101,
    lng: 3.3754,
    desc: "Herbert Macaulay Way campus gate",
  },
];

export default function MapInner({
  listings,
  center = [6.5186, 3.3881],
  zoom = 14,
  activeListingId,
  onSelectListing,
}: MapInnerProps) {
  useEffect(() => {
    // Fix default marker icon issues in Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const createPropertyIcon = (price: number, isActive: boolean) => {
    const formatted = `₦${(price / 1000).toFixed(0)}k`;
    return L.divIcon({
      className: "custom-property-pin",
      html: `
        <div style="
          background: ${isActive ? "#059669" : "#0f172a"};
          color: white;
          padding: 4px 8px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 11px;
          border: 2px solid white;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
          white-space: nowrap;
          cursor: pointer;
          transform: ${isActive ? "scale(1.15)" : "scale(1)"};
          transition: transform 0.2s;
        ">
          ${formatted}
        </div>
      `,
      iconSize: [60, 25],
      iconAnchor: [30, 12],
    });
  };

  const createCampusIcon = () => {
    return L.divIcon({
      className: "campus-pin",
      html: `
        <div style="
          background: #2563eb;
          color: white;
          padding: 4px 8px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 10px;
          border: 2px solid white;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          gap: 3px;
        ">
          🎓 Gate
        </div>
      `,
      iconSize: [60, 24],
      iconAnchor: [30, 12],
    });
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* University Gate Markers */}
      {CAMPUS_PINS.map((gate, i) => (
        <Marker
          key={`gate-${i}`}
          position={[gate.lat, gate.lng]}
          icon={createCampusIcon()}
        >
          <Popup>
            <div className="p-1 text-xs">
              <span className="font-bold text-blue-700 block">🎓 {gate.name}</span>
              <span className="text-slate-600 text-[11px]">{gate.desc}</span>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Property Listing Pins */}
      {listings.map((item) => {
        let photosArray: string[] = [];
        try {
          photosArray = JSON.parse(item.photos);
        } catch {
          photosArray = [];
        }
        const firstPhoto =
          photosArray[0] ||
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600";
        const isActive = activeListingId === item.id;

        return (
          <Marker
            key={item.id}
            position={[item.latitude, item.longitude]}
            icon={createPropertyIcon(item.price, isActive)}
            eventHandlers={{
              click: () => onSelectListing?.(item.id),
            }}
          >
            <Popup className="listing-map-popup">
              <div className="w-56 overflow-hidden rounded-lg font-sans text-xs">
                <img
                  src={firstPhoto}
                  alt={item.title}
                  className="w-full h-28 object-cover rounded-md mb-2"
                />
                <div className="font-bold text-slate-900 text-xs line-clamp-1">
                  {item.title}
                </div>
                <div className="text-emerald-700 font-extrabold text-sm my-0.5">
                  ₦{item.price.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">/yr</span>
                </div>
                {item.distanceDescription && (
                  <div className="text-[11px] text-blue-600 font-medium my-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {item.distanceDescription}
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-2">
                  <span className="text-[10px] text-slate-500">
                    Agent: {item.agent?.name}
                  </span>
                  <Link
                    href={`/listings/${item.id}`}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-[11px] transition-colors"
                  >
                    View Crib
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
