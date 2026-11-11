"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MediaUploader from "@/components/MediaUploader";
import SocialAuthModal, {
  GoogleLogo,
  FacebookLogo,
} from "@/components/SocialAuthModal";
import {
  Building2,
  MapPin,
  Camera,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  User,
  LogIn,
  HelpCircle,
  Sparkles,
  Mic,
  MicOff,
} from "lucide-react";

export default function ListPropertyPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Express Auto-Filler States
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Social Auth Modal State
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialProvider, setSocialProvider] = useState<"google" | "facebook" | "apple">("google");

  const openSocialAuth = (provider: "google" | "facebook" | "apple") => {
    setSocialProvider(provider);
    setSocialModalOpen(true);
  };

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

  // Check if agent/landlord is currently logged in (including saved 1-time mobile session)
  useEffect(() => {
    import("@/lib/client-auth").then(({ getSavedMobileUser, syncOrRestoreSession }) => {
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
    });
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

  const handleVoiceDictation = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice dictation is supported on Chrome/Android. Or type a 1-line note below.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-NG";
    recognition.interimResults = false;
    setIsRecording(true);
    setAiNotice("Listening... Speak your property details (e.g. 'Self contain at Choba 250k per year')");

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (transcript) {
        setAiPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setAiNotice("Voice captured! Click 'Auto-Fill with AI' to populate the listing.");
      }
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleAiAutoFill = async () => {
    setAiLoading(true);
    setError(null);
    setAiNotice(null);

    try {
      const res = await fetch("/api/ai/parse-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt || "Executive Self-Contain at Choba near UNIPORT Gate, 250k per year, steady water and security",
          photoUrl: photos[0] || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.listing) {
        throw new Error(data.error || "Failed to auto-fill property");
      }

      const l = data.listing;
      setFormData((prev) => ({
        ...prev,
        title: l.title || prev.title,
        neighborhood: l.neighborhood || prev.neighborhood,
        propertyType: l.propertyType || prev.propertyType,
        price: l.price ? String(l.price) : prev.price,
        cautionFee: l.cautionFee ? String(l.cautionFee) : prev.cautionFee,
        agencyFee: l.agencyFee ? String(l.agencyFee) : prev.agencyFee,
        distanceToCampusMinutes: l.distanceToCampusMinutes
          ? String(l.distanceToCampusMinutes)
          : prev.distanceToCampusMinutes,
        address: l.address || prev.address,
        description: l.description || prev.description,
        amenities: Array.isArray(l.amenities) ? l.amenities : prev.amenities,
      }));

      setAiNotice(
        "✨ AI Auto-Fill complete! All property details, fees, and description have been populated below. Just review and click Publish!"
      );
    } catch (err: any) {
      setError(err.message || "Could not auto-fill property");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const finalPhotos =
        photos.length > 0
          ? photos
          : [samplePhotoPresets[Math.floor(Math.random() * samplePhotoPresets.length)]];

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
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

      // Refresh router cache and redirect immediately to the published listing
      router.refresh();
      router.push(`/listings/${data.listing.id}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-10 space-y-8">
        {/* Top Header & Auth State */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Landlord & Agent Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              List a Property
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Upload photos & video walkthrough. Students will contact your WhatsApp directly.
            </p>
          </div>

          <div>
            {currentUser ? (
              <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
                <img
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <span className="font-bold text-gray-900 block truncate max-w-[130px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    {currentUser.role}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-right">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Agent / Landlord Sign In</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* AI Express Auto-Uploader for Stress-Free Landlord & Agent Listing */}
        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  1-Click AI Property Assistant (No Typing Stress)
                </h3>
                <p className="text-[11px] text-gray-600">
                  Paste a short WhatsApp note or tap Speak — AI fills the title, price, fees, area &amp; description automatically.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="e.g. Sharp selfcon at Aluu Omuoko, 250k per year, steady light, borehole, tiled..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-emerald-200 text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleVoiceDictation}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  isRecording
                    ? "bg-red-600 text-white border-red-600 animate-pulse"
                    : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
                }`}
                title="Speak property details"
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-600" />}
                <span>{isRecording ? "Listening..." : "Speak"}</span>
              </button>

              <button
                type="button"
                disabled={aiLoading}
                onClick={handleAiAutoFill}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiLoading ? "Generating..." : "Auto-Fill with AI"}</span>
              </button>
            </div>
          </div>

          {aiNotice && (
            <div className="p-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{aiNotice}</span>
            </div>
          )}
        </div>

        {/* 3-Step Agent & Landlord Progression Guide */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
              How Listing as an Agent or Landlord Works:
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-gray-200 shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block">Instant Role Access</span>
                <span className="text-[11px] text-gray-500 leading-snug block mt-0.5">
                  Sign in with Google, Facebook, or Email. Your account gets immediate listing rights.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-gray-200 shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block">Upload Media & Rent</span>
                <span className="text-[11px] text-gray-500 leading-snug block mt-0.5">
                  Upload photos, paste video tour link, and set annual rent in Naira (₦). Goes live immediately.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-gray-200 shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block">Direct Leads & Verified Badge</span>
                <span className="text-[11px] text-gray-500 leading-snug block mt-0.5">
                  Students message your WhatsApp. Add NIN/License in Profile for green Verified badge.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 1-Click Social Sign-In Banner if Not Logged In */}
        {!currentUser && (
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-emerald-950 block">
                Want this listing tied to your verified profile?
              </span>
              <span className="text-[11px] text-emerald-800 block">
                Sign in with 1-click to auto-fill your contact details and track leads in your dashboard.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openSocialAuth("google")}
                className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-transform"
              >
                <GoogleLogo className="w-3.5 h-3.5" />
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => openSocialAuth("facebook")}
                className="px-3 py-1.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-transform"
              >
                <FacebookLogo className="w-3.5 h-3.5 fill-white" />
                <span>Facebook</span>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Property Details */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1">
              1. Basic Property Information
            </h2>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Listing Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Clean Self-Contain 5 Mins to UNIPORT Choba Gate"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Neighborhood Hub *
                </label>
                <select
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Choba">Choba (Near UNIPORT Main Gate)</option>
                  <option value="Ozuoba">Ozuoba (Budget Zone)</option>
                  <option value="Aluu">Aluu (Back Gate Area)</option>
                  <option value="Rumuola">Rumuola (Quiet &amp; Residential)</option>
                  <option value="Rumuokoro">Rumuokoro (Commercial Axis)</option>
                  <option value="Rumuigbo">Rumuigbo (Mid-Range)</option>
                  <option value="GRA Port Harcourt">GRA Port Harcourt (Premium)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Property Category *
                </label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="SELF_CONTAIN">Self-Contain (Single Room with Toilet/Bath)</option>
                  <option value="ONE_BED">1-Bedroom Apartment (Room & Parlour)</option>
                  <option value="TWO_BED">2-Bedroom Shared Flat</option>
                  <option value="STUDIO">Serviced Studio with AC & Inverter</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Annual Rent (₦) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 450000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Caution Deposit (₦)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 45000"
                  value={formData.cautionFee}
                  onChange={(e) => setFormData({ ...formData, cautionFee: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Walk to Gate (Mins)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={formData.distanceToCampusMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, distanceToCampusMinutes: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Street Address / Landmark Description
              </label>
              <input
                type="text"
                placeholder="e.g. 12A Choba Road, near UNIPORT Main Gate"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Description & House Features
              </label>
              <textarea
                rows={3}
                placeholder="Describe water pressure, power source, compound security, gate closing time..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Real Media Upload (Photos & Video) */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1">
              2. Upload House Photos & Video Walkthrough
            </h2>

            <MediaUploader
              photos={photos}
              onPhotosChange={setPhotos}
              videoUrl={videoTourUrl}
              onVideoChange={setVideoTourUrl}
            />
          </div>

          {/* Section 3: Amenities */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1">
              3. Verified Amenities
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
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 ${checked ? "text-emerald-600" : "text-gray-300"}`}
                    />
                    <span>{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Contact Info */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1">
              4. Direct Contact Information (For WhatsApp Inquiries)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Agent / Landlord Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kolawole Adebayo"
                  value={formData.agentName}
                  onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 08034452299"
                  value={formData.agentWhatsapp}
                  onChange={(e) => setFormData({ ...formData, agentWhatsapp: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm shadow-sm shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <span>{loading ? "Publishing Property..." : "Publish Listing on CribConnect"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Social Auth Modal */}
      <SocialAuthModal
        isOpen={socialModalOpen}
        onClose={() => setSocialModalOpen(false)}
        defaultProvider={socialProvider}
        initialRole="AGENT"
        onSuccess={() => {
          fetch("/api/auth/session")
            .then((res) => res.json())
            .then((data) => {
              if (data && data.user) {
                setCurrentUser(data.user);
                setFormData((prev) => ({
                  ...prev,
                  agentName: data.user.name || prev.agentName,
                  agentPhone: data.user.phone || prev.agentPhone,
                  agentWhatsapp: data.user.whatsapp || prev.agentWhatsapp,
                  agencyName: data.user.agencyName || prev.agencyName,
                }));
              }
            })
            .catch(() => {});
        }}
      />
    </div>
  );
}

