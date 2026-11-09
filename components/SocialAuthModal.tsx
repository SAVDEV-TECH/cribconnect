"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User,
  Building2,
} from "lucide-react";

export interface SocialAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProvider?: "google" | "facebook" | "apple";
  initialRole?: "AGENT" | "LANDLORD";
  onSuccess?: () => void;
  redirectUrl?: string;
}

export function GoogleLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.91 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export function FacebookLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function AppleLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.15c.61-.75 1.04-1.8 1.01-2.85-.9.04-2.03.62-2.67 1.37-.56.65-.99 1.69-.93 2.7.99.08 2.02-.53 2.59-1.22z" />
    </svg>
  );
}

export default function SocialAuthModal({
  isOpen,
  onClose,
  defaultProvider = "google",
  initialRole = "AGENT",
  onSuccess,
  redirectUrl = "/list-property",
}: SocialAuthModalProps) {
  const router = useRouter();
  const [provider, setProvider] = useState<"google" | "facebook" | "apple">(defaultProvider);
  const [role, setRole] = useState<"AGENT" | "LANDLORD">(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const hasGoogleClientId = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  const handleNativeGoogleOAuth = () => {
    setLoading(true);
    setError(null);

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (typeof window !== "undefined" && window.google?.accounts?.oauth2 && clientId) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "email profile openid",
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  accessToken: tokenResponse.access_token,
                  role,
                }),
              });

              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Google authentication failed");

              setSuccess(true);
              setTimeout(() => {
                onSuccess?.();
                onClose();
                router.push(redirectUrl);
                router.refresh();
              }, 700);
            }
          },
        });
        tokenClient.requestAccessToken();
      } catch (err: any) {
        setError(err.message || "Failed to initialize Google OAuth");
        setLoading(false);
      }
    } else {
      setError("Google OAuth Client ID is not configured yet. Please enter your Gmail below to continue.");
      setLoading(false);
    }
  };

  const handleDirectRealAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      setError("Please provide your name and email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint = provider === "google" ? "/api/auth/google" : "/api/auth/social";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        router.push(redirectUrl);
        router.refresh();
      }, 700);
    } catch (err: any) {
      setError(err.message || "Unable to complete sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 space-y-5 border border-gray-200 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            {provider === "google" && <GoogleLogo className="w-5 h-5" />}
            {provider === "facebook" && <FacebookLogo className="w-5 h-5" />}
            {provider === "apple" && <AppleLogo className="w-5 h-5" />}
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Sign in with {provider === "google" ? "Google" : provider === "facebook" ? "Facebook" : "Apple"}
              </h2>
              <p className="text-xs text-gray-500">
                Connect your real account to manage properties
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-gray-900">Successfully Signed In</h3>
            <p className="text-xs text-gray-500">Redirecting to your portal...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Account Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Account Type:
              </label>
              <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setRole("AGENT")}
                  className={`py-2 text-xs font-medium rounded-lg transition-colors ${
                    role === "AGENT"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Real Estate Agent
                </button>
                <button
                  type="button"
                  onClick={() => setRole("LANDLORD")}
                  className={`py-2 text-xs font-medium rounded-lg transition-colors ${
                    role === "LANDLORD"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Property Owner
                </button>
              </div>
            </div>

            {/* If Google Client ID is configured, show 1-click Google OAuth button */}
            {provider === "google" && hasGoogleClientId && (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleNativeGoogleOAuth}
                  className="w-full py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors shadow-sm disabled:opacity-50"
                >
                  <GoogleLogo className="w-4 h-4" />
                  <span>Choose Google Account</span>
                </button>
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-gray-100"></div>
                  <span className="flex-shrink mx-2 text-[10px] uppercase tracking-wider text-gray-400">
                    Or enter your Gmail
                  </span>
                  <div className="flex-grow border-t border-gray-100"></div>
                </div>
              </div>
            )}

            {/* Direct Real Account Form */}
            <form onSubmit={handleDirectRealAuth} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chinedu Eze"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {provider === "google" ? "Gmail Address *" : `${provider.toUpperCase()} Email Address *`}
                </label>
                <input
                  type="email"
                  required
                  placeholder={provider === "google" ? "yourname@gmail.com" : `yourname@${provider}.com`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Phone / WhatsApp (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="08034452299"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <span>{loading ? "Authenticating..." : `Continue with ${provider === "google" ? "Gmail" : provider}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2 text-[10px] text-gray-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Session encrypted with tamper-proof HMAC tokens.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
