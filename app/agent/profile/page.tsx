"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  ShieldCheck,
  User,
  Phone,
  MessageCircle,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  MapPin,
  Award,
  ArrowLeft,
  LayoutDashboard,
} from "lucide-react";

export default function AgentProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    agencyName: "",
    bio: "",
    specializations: "",
    avatar: "",
    isVerified: false,
    ninOrLicense: "",
    tenantsHousedCount: 0,
    role: "AGENT",
  });

  useEffect(() => {
    fetch("/api/agent/profile")
      .then((res) => {
        if (res.status === 401) {
          router.push("/auth/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.profile) {
          setFormData({
            name: data.profile.name || "",
            email: data.profile.email || "",
            phone: data.profile.phone || "",
            whatsapp: data.profile.whatsapp || "",
            agencyName: data.profile.agencyName || "",
            bio: data.profile.bio || "",
            specializations: data.profile.specializations || "",
            avatar: data.profile.avatar || "",
            isVerified: data.profile.isVerified || false,
            ninOrLicense: data.profile.ninOrLicense || "",
            tenantsHousedCount: data.profile.tenantsHousedCount || 0,
            role: data.profile.role || "AGENT",
          });
        }
      })
      .catch(() => {
        setStatusMessage({ type: "error", text: "Failed to load profile. Please try logging in again." });
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: "error", text: "Profile image must be less than 5MB." });
      return;
    }

    setUploadingPhoto(true);
    setStatusMessage(null);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload photo");

      setFormData((prev) => ({ ...prev, avatar: data.url }));
      setStatusMessage({ type: "success", text: "Photo uploaded! Click Save to apply changes." });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to upload photo." });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/agent/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile");

      setStatusMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <Link
            href="/agent/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {formData.role === "LANDLORD" ? "Landlord Profile" : "Agent Profile & Credentials"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Update your profile picture, contact numbers, and specializations visible to students.
          </p>
        </div>

        <Link
          href="/agent/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Go to Dashboard</span>
        </Link>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Profile Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Photo Upload & Verified Badge */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center space-y-4 h-fit">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500 shadow-lg bg-slate-100">
              <img
                src={formData.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400"}
                alt={formData.name}
                className="w-full h-full object-cover"
              />
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md transition-all hover:scale-110"
              title="Upload new photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handlePhotoUpload(e.target.files)}
          />

          <div>
            <h2 className="text-base font-black text-slate-900">{formData.name}</h2>
            <span className="text-xs text-slate-500 font-medium">{formData.agencyName || "Independent Realtor"}</span>
          </div>

          {formData.isVerified && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Partner</span>
            </div>
          )}

          {/* Tenants Housed Quick Metric */}
          <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-around text-center">
            <div>
              <span className="text-xl font-black text-emerald-700">{formData.tenantsHousedCount}</span>
              <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Tenants Housed
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-xl font-black text-slate-900">4.9 ★</span>
              <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Rating
              </span>
            </div>
          </div>
        </div>

        {/* Right: Edit Profile Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              Personal & Agency Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Work Email (Registered)</label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Number (For Direct Chats) *</label>
                <input
                  type="tel"
                  required
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {formData.role === "LANDLORD" ? "Estate / Property Complex Name" : "Agency / Firm Name"}
              </label>
              <input
                type="text"
                value={formData.agencyName}
                onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                placeholder="e.g. Adeyemi & Partners Realty"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Campus & Neighborhood Specializations</label>
              <input
                type="text"
                value={formData.specializations}
                onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                placeholder="e.g. UNILAG Main & New Hall Gates, Akoka, Onike, Abule-Oja"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Students filter for agents specializing in their desired campus gate.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Professional Bio / About You</label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell students about your experience, how long you've operated in the area, and your commitment to transparent rentals..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NIN or Realtor License Number</label>
              <input
                type="text"
                value={formData.ninOrLicense}
                onChange={(e) => setFormData({ ...formData, ninOrLicense: e.target.value })}
                placeholder="e.g. LAG-REA-2023-8891 or NIN-..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              <span>{saving ? "Saving Changes..." : "Save Profile Changes"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
