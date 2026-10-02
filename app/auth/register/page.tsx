"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  UserPlus,
  Mail,
  Lock,
  Phone,
  Building2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import SocialAuthModal, {
  GoogleLogo,
  FacebookLogo,
  AppleLogo,
} from "@/components/SocialAuthModal";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"AGENT" | "LANDLORD">("AGENT");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    whatsapp: "",
    agencyName: "",
    ninOrLicense: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Social Auth Modal State
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialProvider, setSocialProvider] = useState<"google" | "facebook" | "apple">("google");

  const openSocialAuth = (provider: "google" | "facebook" | "apple") => {
    setSocialProvider(provider);
    setSocialModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      // Success! Redirect to List Property
      router.push("/list-property");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Create Agent or Landlord Account
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Connect directly with verified students and relocators searching for housing in Lagos.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Select Your Account Type:
          </label>
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setRole("AGENT")}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                role === "AGENT"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Real Estate Agent
            </button>
            <button
              type="button"
              onClick={() => setRole("LANDLORD")}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                role === "LANDLORD"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Property Owner (Landlord)
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 px-1">
            {role === "AGENT"
              ? "🏢 For brokers & agencies managing student apartments around Lagos campuses."
              : "🏠 For direct property owners or caretakers renting with 0% agency fees."}
          </p>
        </div>

        {/* 1-Click Social Sign-Up */}
        <div className="space-y-2.5 pt-1">
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Instant 1-Click Registration
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => openSocialAuth("google")}
              className="py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-2.5 shadow-xs hover:border-slate-400 transition-all hover:scale-[1.01]"
            >
              <GoogleLogo className="w-4 h-4 shrink-0" />
              <span>Sign Up with Google</span>
            </button>

            <button
              type="button"
              onClick={() => openSocialAuth("facebook")}
              className="py-2.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-xs transition-all hover:scale-[1.01]"
            >
              <FacebookLogo className="w-4 h-4 shrink-0 fill-white" />
              <span>Sign Up with Facebook</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => openSocialAuth("apple")}
            className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-xs transition-all hover:scale-[1.01]"
          >
            <AppleLogo className="w-4 h-4 shrink-0" />
            <span>Continue with Apple ID</span>
          </button>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Or fill details manually
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Legal Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kolawole Adebayo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Work Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="agent@company.ng"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password (Min 8 Characters) *
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="08034452299"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                placeholder="08034452299"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {role === "AGENT" ? "Agency / Firm Name" : "Estate / Property Name"}
              </label>
              <input
                type="text"
                placeholder={role === "AGENT" ? "e.g. Adeyemi Realty" : "e.g. Alabi Estate"}
                value={formData.agencyName}
                onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIN or Realtor License (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. NIN-77192830491"
                value={formData.ninOrLicense}
                onChange={(e) => setFormData({ ...formData, ninOrLicense: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Onboarding Milestone & Trust Explainer */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>When can you start listing houses on CribConnect?</span>
            </div>
            <ul className="text-[11px] text-emerald-900 space-y-1 pl-1">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Instant Listing:</strong> Right after signing up, you can immediately publish houses and upload photos & video tours.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Direct Inquiries:</strong> Students message your WhatsApp directly for inspections.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>Verified Trust Badge:</strong> Adding your NIN or License unlocks the green Verified Realtor badge and top ranking.</span>
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50"
          >
            <span>{loading ? "Creating Account..." : "Create Account & Start Listing"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-1">
          Already registered?{" "}
          <Link href="/auth/login" className="font-bold text-emerald-700 hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>

      {/* Social Auth Modal */}
      <SocialAuthModal
        isOpen={socialModalOpen}
        onClose={() => setSocialModalOpen(false)}
        defaultProvider={socialProvider}
        initialRole={role}
        redirectUrl="/list-property"
      />
    </div>
  );
}
