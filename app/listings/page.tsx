"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import ListingCard from "@/components/ListingCard";
import InteractiveMap from "@/components/InteractiveMap";
import ReportModal from "@/components/ReportModal";
import {
  Search,
  Filter,
  MapPin,
  SlidersHorizontal,
  Map as MapIcon,
  List as ListIcon,
  Columns,
  CheckCircle2,
  Building2,
  PlusCircle,
} from "lucide-react";

function ListingsContent() {
  const searchParams = useSearchParams();
  const { formatMoney, selectedUniversity } = useApp();

  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"split" | "list" | "map">("split");
  const [activeListingId, setActiveListingId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [neighborhood, setNeighborhood] = useState(searchParams.get("neighborhood") || "ALL");
  const [propertyType, setPropertyType] = useState(searchParams.get("propertyType") || "ALL");
  const [maxPrice, setMaxPrice] = useState<number>(
    searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : 5000000
  );
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Report Modal state
  const [reportTarget, setReportTarget] = useState<{ id: string; title: string } | null>(null);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/listings", { cache: "no-store" });
      const data = await res.json();
      if (data.listings) {
        setListings(data.listings);
      }
    } catch (err) {
      console.error("Failed to load listings", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      if (neighborhood !== "ALL" && !item.neighborhood.toLowerCase().includes(neighborhood.toLowerCase())) {
        return false;
      }
      if (propertyType !== "ALL" && item.propertyType !== propertyType) {
        return false;
      }
      if (maxPrice < 5000000 && item.price > maxPrice) {
        return false;
      }
      if (verifiedOnly && !item.agentVerified && item.agent?.agentProfile?.verificationStatus !== "VERIFIED") {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.address.toLowerCase().includes(q) ||
          item.neighborhood.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (selectedAmenities.length > 0) {
        try {
          const itemAmenities: string[] = Array.isArray(item.amenities)
            ? item.amenities
            : JSON.parse(item.amenities || "[]");
          const hasAll = selectedAmenities.every((sa) =>
            itemAmenities.some((ia) => String(ia).toLowerCase().includes(sa.toLowerCase()))
          );
          if (!hasAll) return false;
        } catch {
          return false;
        }
      }
      return true;
    });
  }, [listings, neighborhood, propertyType, maxPrice, verifiedOnly, searchQuery, selectedAmenities]);

  const amenitiesList = [
    { id: "Water", label: "Borehole Water" },
    { id: "Generator", label: "Generator Backup" },
    { id: "Security", label: "Gated & Security" },
    { id: "Prepaid", label: "Prepaid Meter" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Filter & View Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by street (e.g. Choba Road, Ozuoba, Aluu, Rumuola)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* View Switcher Controls */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold self-start md:self-auto">
            <button
              onClick={() => setViewMode("split")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === "split"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split View</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === "list"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>List Only</span>
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === "map"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map Only</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2 border-t border-gray-100 text-xs">
          {/* Neighborhood */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Neighborhood
            </label>
            <select
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 font-medium text-gray-800 focus:outline-none"
            >
              <option value="ALL">All Areas</option>
              <option value="Choba">Choba (Main Gate)</option>
              <option value="Ozuoba">Ozuoba (Budget Zone)</option>
              <option value="Aluu">Aluu (Back Gate)</option>
              <option value="Rumuola">Rumuola</option>
              <option value="Rumuokoro">Rumuokoro</option>
              <option value="GRA Port Harcourt">GRA PH (Premium)</option>
            </select>
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Apartment Type
            </label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 font-medium text-gray-800 focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="SELF_CONTAIN">Self-Contain</option>
              <option value="ONE_BED">1-Bedroom</option>
              <option value="TWO_BED">2-Bedroom</option>
              <option value="STUDIO">Serviced Studio</option>
            </select>
          </div>

          {/* Max Budget Slider */}
          <div className="col-span-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">
                Max Budget: {maxPrice >= 5000000 ? "Any Budget" : formatMoney(maxPrice)}
              </label>
            </div>
            <input
              type="range"
              min="100000"
              max="5000000"
              step="50000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Verified Agent Toggle */}
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
              />
              <span className="font-semibold text-gray-700">Verified Agents Only</span>
            </label>
          </div>

          {/* Amenities Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {amenitiesList.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAmenity(a.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  selectedAmenities.includes(a.id)
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {selectedAmenities.includes(a.id) ? "✓ " : "+ "}
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Student Rentals near {selectedUniversity}
          </h1>
          <p className="text-xs text-gray-500">
            Found {filteredListings.length} verified accommodations matching your criteria.
          </p>
        </div>
      </div>

      {/* Main Content Layout based on View Mode */}
      {viewMode === "split" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px]">
          {/* Listings List (7 cols) */}
          <div className="lg:col-span-7 space-y-4 max-h-[850px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="text-center py-16 text-xs text-gray-500">
                Loading verified student cribs...
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-8 space-y-4">
                <Building2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="font-bold text-gray-900 text-sm">
                    {listings.length === 0 ? "No properties uploaded yet" : "No cribs matched your filters"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {listings.length === 0
                      ? "Upload your real properties and they will appear here immediately in Browse & Connect."
                      : "Try adjusting your budget or clearing amenity constraints."}
                  </p>
                </div>
                <Link
                  href="/list-property"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Upload New Property</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredListings.map((listing) => (
                  <div
                    key={listing.id}
                    onMouseEnter={() => setActiveListingId(listing.id)}
                    className={activeListingId === listing.id ? "ring-2 ring-emerald-500 rounded-2xl" : ""}
                  >
                    <ListingCard
                      listing={listing}
                      onOpenReport={(id, title) => setReportTarget({ id, title })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map View (5 cols sticky) */}
          <div className="lg:col-span-5 h-[400px] lg:h-[850px] sticky top-24 rounded-2xl overflow-hidden border border-gray-200">
            <InteractiveMap
              listings={filteredListings}
              activeListingId={activeListingId}
              onSelectListing={(id) => setActiveListingId(id)}
            />
          </div>
        </div>
      )}

      {viewMode === "list" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onOpenReport={(id, title) => setReportTarget({ id, title })}
            />
          ))}
        </div>
      )}

      {viewMode === "map" && (
        <div className="h-[750px] rounded-2xl overflow-hidden border border-gray-200">
          <InteractiveMap
            listings={filteredListings}
            activeListingId={activeListingId}
            onSelectListing={(id) => setActiveListingId(id)}
          />
        </div>
      )}

      {/* Community Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetType="LISTING"
          targetId={reportTarget.id}
          targetTitle={reportTarget.title}
        />
      )}
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-gray-500">
          Loading student rental accommodations...
        </div>
      }
    >
      <ListingsContent />
    </Suspense>
  );
}