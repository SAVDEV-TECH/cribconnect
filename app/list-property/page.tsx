"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MediaUploader from "@/components/MediaUploader";
import { useApp } from "@/context/AppContext";
import { PH_NEIGHBORHOODS } from "@/lib/types";
import { CheckCircle2, ArrowRight, LogIn, Lock, AlertCircle } from "lucide-react";

export default function ListPropertyPage() {
  const router = useRouter();
  const { currentUser, sessionReady } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [photos, setPhotos] = useState<string[]>([]);
  const [videoTourUrl, setVideoTourUrl] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    neighborhood: "Choba",
    propertyType: "SELF_CONTAIN",
    price: "",
    cautionFee: "",
    agencyFee: "",
    distanceToCampusMinutes: "5",
    address: "",
    description: "",
    agentWhatsapp: "",
    agencyName: "",
    amenities: ["Borehole Water", "Prepaid Meter", "24/7 Security", "Fenced Gate"],
  });

  useEffect(() => {
    if (!currentUser) return;
    setFormData((prev) => ({
      ...prev,
      agentWhatsapp: prev.agentWhatsapp || currentUser.whatsapp || currentUser.phone || "",
      agencyName: prev.agencyName || currentUser.agencyName || "",
    }));
  }, [currentUser]);

  const availableAmenities = [
    "Borehole Water",
    "Prepaid Meter",
    "24/7 Security",
    "Fenced Gate",
    "Generator Line",
    "Air Conditioning",
    "Furnished",
    "Personal Water Tank",
    "Kitchen Cabinets",
    "Balcony",
  ];

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const canPublish = Boolean(
    currentUser &&
      (currentUser.isAdmin ||
        currentUser.role === "ADMIN" ||
        currentUser.role === "AGENT" ||
        currentUser.role === "LANDLORD")
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (photos.length === 0) {
      setError("Please upload at least 1 real photo of the apartment or compound before publishing.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          agentPhone: formData.agentWhatsapp || currentUser?.phone || "",
          photos,
          videoTourUrl: videoTourUrl || null,
          distanceDescription: `${formData.distanceToCampusMinutes || "5"} mins to UNIPORT Gate`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to publish listing");
      }

      router.refresh();
      router.push(`/listings/${data.listing.id}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  if (sessionReady && !currentUser) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Sign In to List a Property</h1>
        <p className="text-xs text-gray-500 leading-relaxed">
          To keep students safe from fake listings, only signed-in Agents and Property Owners can
          publish accommodations on CribConnect.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
          <Link
            href="/auth/login?next=/list-property"
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors"
          >
            Create Agent / Owner Account
          </Link>
        </div>
      </div>
    );
  }

  if (sessionReady && currentUser && !canPublish) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-amber-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Agent or Landlord Account Required</h1>
        <p className="text-xs text-gray-500 leading-relaxed">
          You are currently signed in as a <strong>{currentUser.role}</strong>. Register an Agent
          or Property Owner account to publish apartments, or post a housing request instead.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Link
            href="/requests"
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
          >
            Post a Housing Request
          </Link>
          <Link
            href="/auth/register"
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold"
          >
            Register as Agent / Owner
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8 space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">List a Property</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Publish real photos, pricing, and video walkthroughs directly to UNIPORT students.
            </p>
          </div>

          {currentUser && (
            <Link
              href="/agent/profile"
              className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 text-xs font-medium truncate max-w-[160px]"
            >
              {currentUser.name}
            </Link>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Property Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Clean Self-Contain near UNIPORT Choba Gate"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Area *</label>
              <select
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              >
                {PH_NEIGHBORHOODS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Room Type *</label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              >
                <option value="SELF_CONTAIN">Self-Contain</option>
                <option value="ONE_BED">1-Bedroom</option>
                <option value="TWO_BED">2-Bedroom</option>
                <option value="THREE_BED">3-Bedroom</option>
                <option value="STUDIO">Studio</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Annual Rent (₦) *
              </label>
              <input
                type="number"
                required
                min={1000}
                placeholder="250000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Caution Fee (₦)
              </label>
              <input
                type="number"
                min={0}
                placeholder="25000"
                value={formData.cautionFee}
                onChange={(e) => setFormData({ ...formData, cautionFee: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Agency Fee (₦)
              </label>
              <input
                type="number"
                min={0}
                placeholder="0 for direct owner"
                value={formData.agencyFee}
                onChange={(e) => setFormData({ ...formData, agencyFee: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mins to Gate</label>
              <input
                type="number"
                min={0}
                max={180}
                placeholder="5"
                value={formData.distanceToCampusMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, distanceToCampusMinutes: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Address / Landmark
            </label>
            <input
              type="text"
              placeholder="e.g. 12A Choba Road, near Main Gate"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Short Description
            </label>
            <textarea
              rows={3}
              placeholder="Water supply, power, compound security..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Real Property Photos (At least 1 required) &amp; Video Walkthrough
            </label>
            <MediaUploader
              photos={photos}
              onPhotosChange={setPhotos}
              videoUrl={videoTourUrl}
              onVideoChange={setVideoTourUrl}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Amenities</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableAmenities.map((amenity) => {
                const checked = formData.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs font-medium transition-colors ${
                      checked
                        ? "bg-gray-900 border-gray-900 text-white"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${checked ? "text-white" : "text-gray-400"}`}
                    />
                    <span className="truncate">{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Agency / Estate Name
              </label>
              <input
                type="text"
                placeholder="e.g. Choba Realty"
                value={formData.agencyName}
                onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                WhatsApp Number *
              </label>
              <input
                type="tel"
                required
                placeholder="08034452299"
                value={formData.agentWhatsapp}
                onChange={(e) => setFormData({ ...formData, agentWhatsapp: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-5 rounded-lg bg-gray-900 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <span>{loading ? "Publishing..." : "Publish Property"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
