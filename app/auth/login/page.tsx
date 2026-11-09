"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sign In to CribConnect
          </h1>
          <p className="text-sm text-gray-500">
            Sign in to manage your rentals or list properties near UNIPORT.
          </p>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Google Sign-In (Zero typing required) */}
        <div>
          <GoogleSignInButton
            role="AGENT"
            redirectUrl="/list-property"
            text="signin_with"
          />
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-gray-100"></div>
          <span className="flex-shrink mx-3 text-xs font-medium uppercase tracking-wider text-gray-400">
            Or sign in with email &amp; password
          </span>
          <div className="flex-grow border-t border-gray-100"></div>
        </div>

        {/* Standard Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
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
            <span>{loading ? "Signing in..." : "Sign In with Email"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Explanation Note on Becoming Agent/Landlord */}
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>How do you become an Agent or Landlord?</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Sign in with Google in 1 click or create an account with email. You can instantly publish properties, manage tenant inquiries, and add your NIN or License in Profile to receive the green <strong>Verified</strong> trust badge.
          </p>
        </div>

        {/* Register link */}
        <div className="text-center text-sm text-gray-500">
          Don&apos;t have an account yet?{" "}
          <Link href="/auth/register" className="font-semibold text-emerald-700 hover:underline">
            Register with Email
          </Link>
        </div>
      </div>
    </div>
  );
}
