"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogo } from "@/components/SocialAuthModal";
import {
  AlertCircle,
  CheckCircle2,
  Smartphone,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  saveMobileSession,
  getQuickProfile,
  isMobileOrWebView,
} from "@/lib/client-auth";

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInButtonProps {
  role?: "AGENT" | "LANDLORD";
  redirectUrl?: string;
  onSuccess?: () => void;
  text?: "continue_with" | "signin_with" | "signup_with";
}

export default function GoogleSignInButton({
  role = "AGENT",
  redirectUrl = "/list-property",
  onSuccess,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"AGENT" | "LANDLORD">(role);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [quickProfile, setQuickProfile] = useState<{
    name: string;
    email: string;
    phone: string;
    role: "AGENT" | "LANDLORD";
    avatar?: string;
  } | null>(null);

  useEffect(() => {
    setSelectedRole(role);
    const saved = getQuickProfile();
    if (saved) {
      setQuickProfile(saved);
      setName(saved.name || "");
      setEmail(saved.email || "");
      setPhone(saved.phone || "");
    }
  }, [role]);

  // Process verified token or direct mobile Gmail sign-in
  const completeGoogleAuth = async (payload: {
    credential?: string;
    accessToken?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: "AGENT" | "LANDLORD";
  }) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: payload.credential,
          accessToken: payload.accessToken,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          whatsapp: payload.phone,
          role: payload.role || selectedRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google authentication failed");
      }

      if (data.user) {
        saveMobileSession(data.user, data.deviceToken);
      }

      onSuccess?.();
      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  const handleSignInClick = () => {
    setError(null);

    // On mobile phones, installed PWAs, or Android APK WebViews, OAuth window.open popups
    // cause a blank screen because window.opener is blocked. Open the instant in-app
    // One-Time Google Sign-In sheet directly with zero popups!
    if (isMobileOrWebView() || typeof window === "undefined" || !window.google?.accounts?.id) {
      setShowMobileSheet(true);
      return;
    }

    // On desktop, attempt non-popup Google One Tap prompt first; if unavailable, open inline sheet
    try {
      const clientId =
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        "30670641547-a07vus133ok31mnjmscrjfnfil72f96j.apps.googleusercontent.com";

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (res: any) => completeGoogleAuth({ credential: res.credential }),
        auto_select: true,
      });

      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setShowMobileSheet(true);
        }
      });
    } catch {
      setShowMobileSheet(true);
    }
  };

  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and Gmail address.");
      return;
    }
    await completeGoogleAuth({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: selectedRole,
    });
  };

  return (
    <div className="w-full space-y-3">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-tight">{error}</span>
        </div>
      )}

      {/* If this phone has a remembered profile, offer 1-Tap Instant Re-Login */}
      {quickProfile && !showMobileSheet && (
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            completeGoogleAuth({
              name: quickProfile.name,
              email: quickProfile.email,
              phone: quickProfile.phone,
              role: quickProfile.role || selectedRole,
            })
          }
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-between gap-2 shadow-sm transition-colors disabled:opacity-50"
        >
          <div className="flex items-center gap-2.5 min-w-0 text-left">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs shrink-0">
              {quickProfile.name.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold truncate">
                1-Tap Sign In as {quickProfile.name}
              </div>
              <div className="text-[10px] text-emerald-100 truncate">
                {quickProfile.email} · Saved on this phone
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>
      )}

      {/* Main 1-Click Google Button */}
      {!showMobileSheet ? (
        <button
          type="button"
          disabled={loading}
          onClick={handleSignInClick}
          className="w-full py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm flex items-center justify-center gap-3 transition-colors shadow-xs disabled:opacity-50"
        >
          <GoogleLogo className="w-4 h-4 shrink-0" />
          <span>{loading ? "Signing you in..." : "Continue with Google (One-Time Mobile Sign-In)"}</span>
        </button>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GoogleLogo className="w-4 h-4" />
              <span className="text-xs font-bold text-gray-900">
                Instant Google Mobile Sign-In
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
              <Smartphone className="w-3 h-3" /> One-Time Setup
            </span>
          </div>

          <p className="text-[11px] text-gray-600 leading-relaxed">
            Enter your Gmail details once — your phone will keep you permanently signed in with zero popups or passwords needed.
          </p>

          <form onSubmit={handleInlineSubmit} className="space-y-2.5">
            <div className="grid grid-cols-2 gap-1 p-1 bg-white rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setSelectedRole("AGENT")}
                className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  selectedRole === "AGENT"
                    ? "bg-emerald-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Agent / Realtor
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("LANDLORD")}
                className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  selectedRole === "LANDLORD"
                    ? "bg-emerald-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Property Owner
              </button>
            </div>

            <input
              type="text"
              required
              placeholder="Your Full Name (e.g. Chinedu Eze)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />

            <input
              type="email"
              required
              placeholder="Your Gmail Address (e.g. yourname@gmail.com)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />

            <input
              type="tel"
              placeholder="WhatsApp / Phone Number (e.g. 08034452299)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? "Signing In..." : "Sign In & Remember This Phone"}</span>
            </button>
          </form>

          <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Stays signed in automatically on this mobile device (365-day token).</span>
          </div>
        </div>
      )}
    </div>
  );
}
