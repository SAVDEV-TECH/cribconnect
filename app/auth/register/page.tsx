"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { saveMobileSession } from "@/lib/client-auth";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      if (data.user) {
        saveMobileSession(data.user, data.deviceToken);
      }

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
      <div className="max-w-xl w-full bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
            <UserPlus className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create Agent or Landlord Account
          </h1>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Connect directly with verified students and relocators searching for housing near UNIPORT, Port Harcourt.
          </p>
        </div>

        {/* Role Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account type:
          </label>
          <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setRole("AGENT")}
              className={`py-2.5 text-sm font-medium rounded-lg transition-colors ${
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
              className={`py-2.5 text-sm font-medium rounded-lg transition-colors ${
                role === "LANDLORD"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Property Owner
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5 px-1">
            {role === "AGENT"
              ? "For brokers & agencies managing student apartments around UNIPORT, Choba, PH."
              : "For direct property owners or caretakers renting with 0% agency fees."}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Google Sign-In */}
        <div>
          <GoogleSignInButton
            role={role}
            redirectUrl="/list-property"
            text="signup_with"
          />
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-gray-100"></div>
          <span className="flex-shrink mx-3 text-xs font-medium uppercase tracking-wider text-gray-400">
            Or register with email &amp; password
          </span>
          <div className="flex-grow border-t border-gray-100"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Emeka Chukwudi"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Work Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone *</label>
              <input
                type="tel"
                required
                placeholder="08034452299"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp *</label>
              <input
                type="tel"
                required
                placeholder="08034452299"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {role === "AGENT" ? "Agency Name" : "Estate / Property Name"}
              </label>
              <input
                type="text"
                placeholder={role === "AGENT" ? "e.g. Chukwudi Realty" : "e.g. Nwofor Estate"}
                value={formData.agencyName}
                onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">NIN or License (Optional)</label>
              <input
                type="text"
                placeholder="e.g. NIN-77192830491"
                value={formData.ninOrLicense}
                onChange={(e) => setFormData({ ...formData, ninOrLicense: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* When can you list */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 space-y-2">
            <p className="text-sm font-semibold text-emerald-900">When can you start listing?</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Instantly:</strong> Right after signing up, publish houses and upload photos &amp; video tours.</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Direct inquiries:</strong> Students contact your WhatsApp for inspections.</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Verified badge:</strong> Adding NIN or License unlocks the green Verified badge and top ranking.</span>
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <span>{loading ? "Creating Account..." : "Create Account & Start Listing"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">
          Already registered?{" "}
          <Link href="/auth/login" className="font-semibold text-emerald-700 hover:underline">
            Sign In with Email or Google
          </Link>
        </div>
      </div>
    </div>
  );
}
