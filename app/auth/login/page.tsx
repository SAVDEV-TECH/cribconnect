"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Building2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import SocialAuthModal, {
  GoogleLogo,
  FacebookLogo,
  AppleLogo,
} from "@/components/SocialAuthModal";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sign in");
      }

      // Signed in! Redirect to List Property or Dashboard
      router.push("/list-property");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Agent & Landlord Sign In
          </h1>
          <p className="text-xs text-slate-500">
            Sign in to manage your listings, view tenants housed, and access student leads.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Social Sign-In Options */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => openSocialAuth("google")}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-3 shadow-xs hover:border-slate-400 transition-all hover:scale-[1.01]"
          >
            <GoogleLogo className="w-4 h-4 shrink-0" />
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={() => openSocialAuth("facebook")}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs flex items-center justify-center gap-3 shadow-xs transition-all hover:scale-[1.01]"
          >
            <FacebookLogo className="w-4 h-4 shrink-0 fill-white" />
            <span>Continue with Facebook</span>
          </button>

          <button
            type="button"
            onClick={() => openSocialAuth("apple")}
            className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-3 shadow-xs transition-all hover:scale-[1.01]"
          >
            <AppleLogo className="w-4 h-4 shrink-0" />
            <span>Continue with Apple</span>
          </button>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Or sign in with work email
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@realty.ng"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Password
              </label>
              <span className="text-[11px] text-slate-400">Min 8 characters</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Account"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Credentials Helper */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
            Instant Test Login
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials("kolawole@adeyemirealty.ng")}
              className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left text-[11px] transition-colors"
            >
              <span className="font-bold text-slate-800 block">Kolawole (Agent)</span>
              <span className="text-slate-400 text-[10px]">UNILAG Specialist</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials("tunde@alabiproperties.com")}
              className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left text-[11px] transition-colors"
            >
              <span className="font-bold text-slate-800 block">Chief Tunde</span>
              <span className="text-slate-400 text-[10px]">Property Owner</span>
            </button>
          </div>
        </div>

        {/* Explanation Note on Becoming Agent/Landlord */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>How do you become an Agent or Landlord?</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Create an account or sign in with Google/Facebook, select your role (Agent vs Landlord), and you can instantly publish properties. Add your NIN or License in Profile to receive the green <strong>Verified</strong> trust badge.
          </p>
        </div>

        {/* Link to Register */}
        <div className="text-center text-xs text-slate-500 pt-1">
          Don&apos;t have an account yet?{" "}
          <Link href="/auth/register" className="font-bold text-emerald-700 hover:underline">
            Register as an Agent or Landlord
          </Link>
        </div>
      </div>

      {/* Social Auth Modal */}
      <SocialAuthModal
        isOpen={socialModalOpen}
        onClose={() => setSocialModalOpen(false)}
        defaultProvider={socialProvider}
        initialRole="AGENT"
        redirectUrl="/list-property"
      />
    </div>
  );
}
