"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Building2,
  AlertCircle,
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
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Agent & Landlord Sign In
          </h1>
          <p className="text-sm text-gray-500">
            Sign in to manage your listings and access student leads.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Social Sign-In */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => openSocialAuth("google")}
            className="w-full py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-medium text-sm flex items-center justify-center gap-3 transition-colors"
          >
            <GoogleLogo className="w-4 h-4 shrink-0" />
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={() => openSocialAuth("facebook")}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-medium text-sm flex items-center justify-center gap-3 transition-colors"
          >
            <FacebookLogo className="w-4 h-4 shrink-0 fill-white" />
            <span>Continue with Facebook</span>
          </button>

          <button
            type="button"
            onClick={() => openSocialAuth("apple")}
            className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-black text-white font-medium text-sm flex items-center justify-center gap-3 transition-colors"
          >
            <AppleLogo className="w-4 h-4 shrink-0" />
            <span>Continue with Apple</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-gray-100"></div>
          <span className="flex-shrink mx-3 text-xs font-medium uppercase tracking-wider text-gray-400">
            Or use email
          </span>
          <div className="flex-grow border-t border-gray-100"></div>
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@realty.ng"
                className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <span className="text-xs text-gray-400">Min 8 characters</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <span>{loading ? "Signing in..." : "Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo credentials */}
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <span className="text-xs font-medium text-gray-400 block text-center uppercase tracking-wider">
            Quick test login
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials("emeka@chukwudirealty.ng")}
              className="p-2.5 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 text-left text-xs transition-colors"
            >
              <span className="font-semibold text-gray-800 block">Emeka (Agent)</span>
              <span className="text-gray-400 text-[11px]">UNIPORT Specialist</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials("nkem@duruproperties.com")}
              className="p-2.5 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 text-left text-xs transition-colors"
            >
              <span className="font-semibold text-gray-800 block">Chief Nkem</span>
              <span className="text-gray-400 text-[11px]">Property Owner</span>
            </button>
          </div>
        </div>

        {/* How to become an Agent/Landlord */}
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>How do you become an Agent or Landlord?</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Create an account or sign in with Google/Facebook, select your role (Agent vs Landlord), and you can instantly publish properties. Add your NIN or License in Profile to get the green <strong>Verified</strong> badge.
          </p>
        </div>

        {/* Register link */}
        <div className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="font-semibold text-emerald-700 hover:underline">
            Register as Agent or Landlord
          </Link>
        </div>
      </div>

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
