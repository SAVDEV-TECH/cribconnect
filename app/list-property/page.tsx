"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MediaUploader from "@/components/MediaUploader";
import { CheckCircle2, ArrowRight, LogIn } from "lucide-react";

export default function ListPropertyPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
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
    agentName: "",
    agentPhone: "",
    agentWhatsapp: "",
    agencyName: "Independent Verified Realtor",
    amenities: ["Borehole Water", "Prepaid Meter", "24/7 Security", "Fenced Gate"],
  });

  useEffect(() => {
    import("@/lib/client-auth").then(
      ({ getSavedMobileUser, syncOrRestoreSession }) => {
        const applyUser = (u: any) => {
          if (!u) return;
          setCurrentUser(u);
          setFormData((prev) => ({
            ...prev,
            agentName: u.name || prev.agentName,
            agentPhone: u.phone || prev.agentPhone,
            agentWhatsapp: u.whatsapp || u.phone || prev.agentWhatsapp,
            agencyName: u.agencyName || prev.agencyName,
          }));
        };
        const cached = getSavedMobileUser();
        if (cached) applyUser(cached);
        syncOrRestoreSession()
          .then((user) => {
            if (user) applyUser(user);
          })
          .catch(() => {});
      }
    );
  }, []);

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

  const samplePhotoPresets = [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const finalPhotos =
        photos.length > 0
          ? photos
          : [
              samplePhotoPresets[
                Math.floor(Math.random() * samplePhotoPresets.length)
              ],
            ];

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          agentPhone: formData.agentWhatsapp || formData.agentPhone,
          agentId: currentUser?.id || undefined,
          agentAvatar: currentUser?.avatar || undefined,
          photos: finalPhotos,
          videoTourUrl: videoTourUrl || null,
          distanceDescription: `${formData.distanceToCampusMinutes} mins to UNIPORT Gate`,
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8 space-y-6">
        {/* Compact Header */}
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">List a Property</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Add property details, rent, and photos.
            </p>
          </div>

          {currentUser ? (
            <Link
              href="/agent/profile"
              className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 text-xs font-medium truncate max-w-[140px]"
            >
              {currentUser.name}
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
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
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Area *
              </label>
              <select
                value={formData.neighborhood}
                onChange={(e) =>
                  setFormData({ ...formData, neighborhood: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              >
                <option value="Choba">Choba</option>
                <option value="Ozuoba">Ozuoba</option>
                <option value="Aluu">Aluu</option>
                <option value="Rumuola">Rumuola</option>
                <option value="Rumuokoro">Rumuokoro</option>
                <option value="Rumuigbo">Rumuigbo</option>
                <option value="GRA Port Harcourt">GRA Port Harcourt</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Room Type *
              </label>
              <select
                value={formData.propertyType}
                onChange={(e) =>
                  setFormData({ ...formData, propertyType: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              >
                <option value="SELF_CONTAIN">Self-Contain</option>
                <option value="ONE_BED">1-Bedroom</option>
                <option value="TWO_BED">2-Bedroom</option>
                <option value="STUDIO">Studio</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Annual Rent (₦) *
              </label>
              <input
                type="number"
                required
                placeholder="250000"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Caution Fee (₦)
              </label>
              <input
                type="number"
                placeholder="25000"
                value={formData.cautionFee}
                onChange={(e) =>
                  setFormData({ ...formData, cautionFee: e.target.value })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Mins to Gate
              </label>
              <input
                type="number"
                placeholder="5"
                value={formData.distanceToCampusMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    distanceToCampusMinutes: e.target.value,
                  })
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
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Short Description
            </label>
            <textarea
              rows={2}
              placeholder="Water supply, power, compound security..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Photos & Video
            </label>
            <MediaUploader
              photos={photos}
              onPhotosChange={setPhotos}
              videoUrl={videoTourUrl}
              onVideoChange={setVideoTourUrl}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Amenities
            </label>
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
                      className={`w-3.5 h-3.5 shrink-0 ${
                        checked ? "text-white" : "text-gray-400"
                      }`}
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
                Your Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Chinedu Eze"
                value={formData.agentName}
                onChange={(e) =>
                  setFormData({ ...formData, agentName: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, agentWhatsapp: e.target.value })
                }
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
