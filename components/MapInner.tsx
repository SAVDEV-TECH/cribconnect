"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { MapPin, Navigation, Layers, Globe } from "lucide-react";

interface ListingItem {
  id: string;
  title: string;
  price: number;
  currency?: string;
  photos: string | string[];
  latitude: number;
  longitude: number;
  neighborhood?: string;
  address?: string;
  distanceDescription?: string | null;
  agentName?: string;
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

// Campus Gate Pins for UNIPORT
const CAMPUS_PINS = [
  {
    name: "UNIPORT Choba Main Gate",
    lat: 4.8984,
    lng: 6.9315,
    desc: "Primary entry for commercial buses & campus shuttles",
  },
  {
    name: "UNIPORT Abuja Campus (Main)",
    lat: 4.9018,
    lng: 6.9212,
    desc: "Senate Building, University Park & Faculties",
  },
  {
    name: "UNIPORT Delta Park Gate",
    lat: 4.8965,
    lng: 6.9278,
    desc: "Direct access to hostels & Choba Extension",
  },
  {
    name: "UNIPORT Back Gate (Aluu Road)",
    lat: 4.9112,
    lng: 6.9187,
    desc: "Aluu / Omuoko student lodges corridor",
  },
];

export default function MapInner({
  listings,
  center = [4.8995, 6.9265],
  zoom = 15,
  activeListingId,
  onSelectListing,
}: MapInnerProps) {
  const [mapMode, setMapMode] = useState<"satellite" | "street" | "google">("satellite");

  useEffect(() => {
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
          background: ${isActive ? "#059669" : "#111827"};
          color: white;
          padding: 5px 10px;
          border-radius: 9999px;
          font-weight: 800;
          font-size: 11px;
          border: 2px solid white;
          box-shadow: 0 6px 14px rgba(0,0,0,0.35);
          white-space: nowrap;
          cursor: pointer;
          transform: ${isActive ? "scale(1.18)" : "scale(1)"};
          transition: transform 0.2s;
        ">
          ${formatted}
        </div>
      `,
      iconSize: [68, 28],
      iconAnchor: [34, 14],
    });
  };

  const createCampusIcon = () => {
    return L.divIcon({
      className: "campus-pin",
      html: `
        <div style="
          background: #059669;
          color: white;
          padding: 4px 9px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 10px;
          border: 2px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          gap: 3px;
          white-space: nowrap;
        ">
          🎓 UNIPORT
        </div>
      `,
      iconSize: [76, 24],
      iconAnchor: [38, 12],
    });
  };

  const activeListing = listings.find((l) => l.id === activeListingId) || listings[0];
  const googleQuery = activeListing
    ? `${activeListing.latitude || 4.8984},${activeListing.longitude || 6.9315}`
    : "University+of+Port+Harcourt,Choba,Port+Harcourt";

  return (
    <div className="relative w-full h-full min-h-[360px] rounded-xl overflow-hidden border border-gray-200 bg-gray-900">
      {/* Top-Right Map Style Switcher (Satellite Hybrid / HD Street / Google Maps Live) */}
      <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-gray-200 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setMapMode("satellite")}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
            mapMode === "satellite"
              ? "bg-gray-900 text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Globe className="w-3 h-3 text-emerald-400" />
          <span>Satellite HD</span>
        </button>
        <button
          type="button"
          onClick={() => setMapMode("street")}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
            mapMode === "street"
              ? "bg-gray-900 text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Layers className="w-3 h-3 text-emerald-500" />
          <span>Street HD</span>
        </button>
        <button
          type="button"
          onClick={() => setMapMode("google")}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
            mapMode === "google"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Navigation className="w-3 h-3" />
          <span>Google Maps</span>
        </button>
      </div>

      {mapMode === "google" ? (
        <div className="w-full h-full min-h-[360px] relative">
          <iframe
            title="UNIPORT Google Maps Satellite & Road View"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(
              googleQuery
            )}&t=h&z=16&ie=UTF8&iwloc=&output=embed`}
            className="w-full h-full min-h-[360px] border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              googleQuery
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 left-3 z-[400] px-3.5 py-2 rounded-xl bg-gray-900/90 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-lg"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open in Google Maps App</span>
          </a>
        </div>
      ) : (
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={false}
          className="w-full h-full min-h-[360px]"
        >
          {mapMode === "satellite" ? (
            <>
              {/* High-Resolution Satellite Aerial Layer */}
              <TileLayer
                attribution="Tiles &copy; Esri &mdash; High-Resolution Satellite"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
              {/* Crisp Street & Neighborhood Labels Overlay */}
              <TileLayer
                attribution="&copy; CARTO"
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={19}
              />
            </>
          ) : (
            /* Clean Enterprise Retina HD Street Layer */
            <TileLayer
              attribution="&copy; OpenStreetMap &copy; CARTO"
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={19}
            />
          )}

          {/* University Gate Markers */}
          {CAMPUS_PINS.map((gate, i) => (
            <Marker
              key={`gate-${i}`}
              position={[gate.lat, gate.lng]}
              icon={createCampusIcon()}
            >
              <Popup>
                <div className="p-1 text-xs space-y-1">
                  <span className="font-bold text-emerald-700 block">🎓 {gate.name}</span>
                  <span className="text-gray-600 text-[11px] block">{gate.desc}</span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${gate.lat},${gate.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline pt-1"
                  >
                    <span>Directions in Google Maps →</span>
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Property Listing Pins */}
          {listings.map((item) => {
            let photosArray: string[] = [];
            try {
              photosArray = Array.isArray(item.photos)
                ? item.photos
                : JSON.parse(item.photos || "[]");
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
                position={[item.latitude || 4.8984, item.longitude || 6.9315]}
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
                    <div className="font-bold text-gray-900 text-xs line-clamp-1">
                      {item.title}
                    </div>
                    <div className="text-emerald-700 font-bold text-sm my-0.5">
                      ₦{item.price.toLocaleString()}{" "}
                      <span className="text-[10px] font-normal text-gray-500">/yr</span>
                    </div>
                    {item.distanceDescription && (
                      <div className="text-[11px] text-gray-600 font-medium my-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" /> {item.distanceDescription}
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 mt-2">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${
                          item.latitude || 4.8984
                        },${item.longitude || 6.9315}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        Google Directions
                      </a>
                      <Link
                        href={`/listings/${item.id}`}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-[11px] transition-colors"
                      >
                        Inspect Crib
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      )}
    </div>
  );
}
