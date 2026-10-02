"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Camera,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function ListPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    neighborhood: "Akoka",
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
    videoTourUrl: "",
    photoUrl: "",
    amenities: ["Borehole Water", "Prepaid Meter", "24/7 Security", "Fenced Gate"],
  });

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
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const photos = formData.photoUrl
        ? [formData.photoUrl]
        : [samplePhotoPresets[Math.floor(Math.random() * samplePhotoPresets.length)]];

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          photos,
          distanceDescription: `${formData.distanceToCampusMinutes} mins to Campus Gate`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to publish listing");
      }

      // Redirect immediately to the published listing
      router.push(`/listings/${data.listing.id}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Landlord & Agent Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            List a Student Property
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Publish your rental accommodation. Students & relocators will contact you directly via WhatsApp and phone.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Property Details */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              1. Property Info
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Listing Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Clean Executive Self-Contain on Jaja Street"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Neighborhood *
                </label>
                <select
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Akoka">Akoka (Near UNILAG Gates)</option>
                  <option value="Onike">Onike (Quiet & Residential)</option>
                  <option value="Abule-Oja">Abule-Oja (2nd Gate Axis)</option>
                  <option value="Yaba">Yaba / Commercial Ave</option>
                  <option value="Bariga">Bariga / St. Finbarr&apos;s</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Property Type *
                </label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="SELF_CONTAIN">Self-Contain (Studio Room)</option>
                  <option value="ONE_BED">1-Bedroom Apartment</option>
                  <option value="TWO_BED">2-Bedroom Flat (Shared)</option>
                  <option value="STUDIO">Serviced Studio with AC</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Annual Rent (₦) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 450000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Caution Deposit (₦)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 45000"
                  value={formData.cautionFee}
                  onChange={(e) => setFormData({ ...formData, cautionFee: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Walk to Gate (Mins)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={formData.distanceToCampusMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, distanceToCampusMinutes: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Street Address / Landmark
              </label>
              <input
                type="text"
                placeholder="e.g. 14B Jaja Street, behind UNILAG New Hall"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description & House Rules
              </label>
              <textarea
                rows={3}
                placeholder="Describe water availability, power, compound security, gate closing time..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Amenities */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              2. Key Amenities
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableAmenities.map((amenity) => {
                const checked = formData.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                      checked
                        ? "bg-emerald-50 border-emerald-400 text-emerald-800 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 ${checked ? "text-emerald-600" : "text-slate-300"}`}
                    />
                    <span>{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Photo & Video URL */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              3. Photos & Walkthrough
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Photo Image URL (Optional — or leave blank to use high-res rental preset)
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={formData.photoUrl}
                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                YouTube Video Tour Embed URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://www.youtube.com/embed/..."
                value={formData.videoTourUrl}
                onChange={(e) => setFormData({ ...formData, videoTourUrl: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 4: Contact Info */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              4. Contact Details (For Student Inquiries)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kolawole Adebayo"
                  value={formData.agentName}
                  onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 08034452299 or +234..."
                  value={formData.agentWhatsapp}
                  onChange={(e) => setFormData({ ...formData, agentWhatsapp: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          >
            <span>{loading ? "Publishing Listing..." : "Publish Listing on CribConnect"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
