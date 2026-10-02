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
  Sparkles,
  Building2,
  Check,
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
  const [useCustomAccount, setUseCustomAccount] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Preset quick social profiles
  const presetProfiles = [
    {
      name: "Saviour Adeyemi",
      email: provider === "google" ? "saviour.tech@gmail.com" : provider === "facebook" ? "saviour.realty@facebook.com" : "saviour@icloud.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      tag: "Primary Connected Profile",
    },
    {
      name: "Kolawole Adebayo",
      email: provider === "google" ? "kolawole.adebayo@gmail.com" : "kolawole.agent@facebook.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
      tag: "UNILAG Verified Realtor",
    },
    {
      name: "Chief Tunde Alabi",
      email: provider === "google" ? "tunde.alabi@gmail.com" : "tunde.alabi@facebook.com",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
      tag: "Yaba Property Owner",
    },
  ];

  const handleAuthenticate = async (selectedProfile?: { name: string; email: string; avatar?: string }) => {
    setLoading(true);
    setError(null);

    const name = selectedProfile ? selectedProfile.name : customName.trim();
    const email = selectedProfile ? selectedProfile.email : customEmail.trim();

    if (!name || !email) {
      setError("Please provide a valid name and email address.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          name,
          email,
          phone: customPhone.trim() || "+234 803 000 0000",
          role,
          avatar: selectedProfile?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sign in via social provider.");
      }

      setSuccess(true);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
        router.push(redirectUrl);
        router.refresh();
      }, 700);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
      setLoading(false);
    }
  };

  const getProviderInfo = () => {
    switch (provider) {
      case "facebook":
        return {
          title: "Sign in with Facebook",
          subtitle: "Connect your Facebook account to CribConnect instantly",
          icon: FacebookLogo,
          headerColor: "bg-[#1877F2] text-white",
          btnBg: "bg-[#1877F2] hover:bg-[#166fe5] text-white",
        };
      case "apple":
        return {
          title: "Sign in with Apple",
          subtitle: "Use your Apple ID for fast and private authentication",
          icon: AppleLogo,
          headerColor: "bg-slate-900 text-white",
          btnBg: "bg-slate-900 hover:bg-black text-white",
        };
      case "google":
      default:
        return {
          title: "Sign in with Google",
          subtitle: "Choose an account to continue to CribConnect",
          icon: GoogleLogo,
          headerColor: "bg-white text-slate-900 border-b border-slate-100",
          btnBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
        };
    }
  };

  const currentInfo = getProviderInfo();
  const IconComponent = currentInfo.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Top Header */}
        <div className={`p-5 flex items-center justify-between ${currentInfo.headerColor}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-xs flex items-center justify-center shrink-0 border border-slate-100">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                {currentInfo.title}
              </h2>
              <p className="text-[11px] opacity-80 font-medium">
                {currentInfo.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto animate-bounce">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Connected Successfully!
              </h3>
              <p className="text-xs text-slate-500">
                Redirecting you to CribConnect portal...
              </p>
            </div>
          ) : (
            <>
              {/* Role Selection: Agent vs Landlord */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  I am signing in / registering as:
                </label>
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setRole("AGENT")}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      role === "AGENT"
                        ? "bg-white text-emerald-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>Real Estate Agent</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("LANDLORD")}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      role === "LANDLORD"
                        ? "bg-white text-emerald-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>Property Owner</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {role === "AGENT"
                    ? "✓ You can list multiple student accommodations & earn agency commissions."
                    : "✓ Direct landlord / caretaker listing with 0% middleman fees."}
                </p>
              </div>

              {/* Provider Quick Switcher */}
              <div className="flex items-center justify-center gap-2 pt-1 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400">Switch platform:</span>
                <button
                  type="button"
                  onClick={() => {
                    setProvider("google");
                    setError(null);
                  }}
                  className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    provider === "google"
                      ? "border-emerald-500 bg-emerald-50/50 text-emerald-800"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <GoogleLogo className="w-3.5 h-3.5" />
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProvider("facebook");
                    setError(null);
                  }}
                  className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    provider === "facebook"
                      ? "border-[#1877F2] bg-blue-50/50 text-[#1877F2]"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <FacebookLogo className="w-3.5 h-3.5" />
                  <span>Facebook</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProvider("apple");
                    setError(null);
                  }}
                  className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    provider === "apple"
                      ? "border-slate-900 bg-slate-100 text-slate-900"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <AppleLogo className="w-3.5 h-3.5" />
                  <span>Apple</span>
                </button>
              </div>

              {!useCustomAccount ? (
                /* Preset Accounts */
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Select a Verified Profile
                  </span>
                  <div className="space-y-2">
                    {presetProfiles.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={loading}
                        onClick={() => handleAuthenticate(p)}
                        className="w-full p-2.5 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-left flex items-center gap-3 transition-all group"
                      >
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                              {p.name}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold shrink-0">
                              {p.tag}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {p.email}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setUseCustomAccount(true)}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      + Use another {provider.toUpperCase()} account / custom email
                    </button>
                  </div>
                </div>
              ) : (
                /* Custom Email Form */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Enter Account Details
                    </span>
                    <button
                      type="button"
                      onClick={() => setUseCustomAccount(false)}
                      className="text-[11px] font-bold text-slate-500 hover:underline"
                    >
                      ← Back to saved profiles
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chinedu Eze"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {provider.toUpperCase()} Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder={`e.g. chinedu@${provider === "google" ? "gmail.com" : provider === "apple" ? "icloud.com" : "realty.ng"}`}
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="08012345678"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={loading || !customName || !customEmail}
                    onClick={() => handleAuthenticate()}
                    className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${currentInfo.btnBg} disabled:opacity-50`}
                  >
                    <span>{loading ? "Connecting..." : `Continue as ${customName || "User"}`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Security Badge */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-[10px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Protected by HMAC-SHA256 encrypted sessions and OWASP rate limiting.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
