"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, AlertCircle, LogOut } from "lucide-react";
import {
  syncOrRestoreSession,
  getDeviceAuthHeaders,
  clearMobileSession,
} from "@/lib/client-auth";

export default function AgentProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    agencyName: "",
    bankName: "",
    bankAccountNumber: "",
    avatar: "",
    role: "AGENT",
  });

  useEffect(() => {
    syncOrRestoreSession()
      .then(() =>
        fetch("/api/agent/profile", { headers: getDeviceAuthHeaders() })
      )
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
            phone: data.profile.phone || data.profile.whatsapp || "",
            whatsapp: data.profile.whatsapp || data.profile.phone || "",
            agencyName: data.profile.agencyName || "",
            bankName: data.profile.bankName || "",
            bankAccountNumber: data.profile.bankAccountNumber || "",
            avatar: data.profile.avatar || "",
            role: data.profile.role || "AGENT",
          });
        }
      })
      .catch(() => {
        setStatusMessage({
          type: "error",
          text: "Could not load profile.",
        });
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({
        type: "error",
        text: "Image must be under 5MB.",
      });
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
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setFormData((prev) => ({ ...prev, avatar: data.url }));
      setStatusMessage({
        type: "success",
        text: "Photo updated. Tap Save to keep changes.",
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to upload photo.",
      });
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
        headers: getDeviceAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          ...formData,
          whatsapp: formData.phone,
          bankAccountName: formData.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setStatusMessage({ type: "success", text: "Profile saved." });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Could not save profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    clearMobileSession();
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/auth/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 space-y-5">
        {/* Compact Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h1 className="text-lg font-bold text-gray-900">Profile</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/agent/dashboard"
              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium transition-colors"
            >
              My Listings
            </Link>
            <Link
              href="/list-property"
              className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
            >
              Add Property
            </Link>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
              statusMessage.type === "success"
                ? "bg-gray-100 border border-gray-200 text-gray-900"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Compact Avatar Row */}
        <div className="flex items-center gap-4">
          <img
            src={
              formData.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                formData.name || "User"
              )}&backgroundColor=63482E`
            }
            alt={formData.name}
            className="w-14 h-14 rounded-full object-cover border border-gray-300 bg-gray-100 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {formData.name || "Account"}
            </p>
            <p className="text-xs text-gray-500 truncate">{formData.email}</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-gray-900"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{uploadingPhoto ? "Uploading..." : "Change photo"}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handlePhotoUpload(e.target.files)}
            />
          </div>
        </div>

        {/* Simple 4-Field Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              WhatsApp / Phone Number
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  phone: e.target.value,
                  whatsapp: e.target.value,
                })
              }
              placeholder="08034452299"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Business or Lodge Name (Optional)
            </label>
            <input
              type="text"
              value={formData.agencyName}
              onChange={(e) =>
                setFormData({ ...formData, agencyName: e.target.value })
              }
              placeholder="e.g. Choba Executive Lodge"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Bank Name (Optional)
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                placeholder="e.g. Access, GTBank, OPay"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                maxLength={10}
                value={formData.bankAccountNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankAccountNumber: e.target.value.replace(/\D/g, ""),
                  })
                }
                placeholder="10-digit NUBAN"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 px-4 rounded-lg bg-gray-900 hover:bg-emerald-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>

        {/* Simple Sign Out Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Signed in on this device</span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
