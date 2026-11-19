"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useApp } from "@/context/AppContext";
import { saveMobileSession } from "@/lib/client-auth";

function getSafeNextPath(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const next = new URLSearchParams(window.location.search).get("next") || "";
  if (next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, refreshUser } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState<string>("");

  useEffect(() => {
    setNextPath(getSafeNextPath(""));
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid email or password.");
      }

      if (data.user) {
        saveMobileSession(data.user);
      }
      await refreshUser();

      const defaultDest =
        data.user?.isAdmin || data.user?.role === "ADMIN"
          ? "/admin"
          : data.user?.role === "AGENT" || data.user?.role === "LANDLORD"
          ? "/agent/dashboard"
          : "/listings";

      router.push(nextPath || defaultDest);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-5 shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sign In to CribConnect</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Sign in with your verified email &amp; password or Google account
          </p>
        </div>

        {/* Already Signed-In Banner */}
        {currentUser && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-emerald-950 truncate">
                  Signed in as {currentUser.name}
                </div>
                <div className="text-[11px] text-emerald-700 truncate">
                  {currentUser.email} · {currentUser.role}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/list-property"
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center transition-colors"
              >
                List a Property
              </Link>
              <Link
                href={currentUser.isAdmin ? "/admin" : "/agent/dashboard"}
                className="py-2 px-3 rounded-xl bg-white hover:bg-gray-50 text-emerald-800 border border-emerald-200 text-xs font-bold text-center transition-colors"
              >
                {currentUser.isAdmin ? "Admin Portal" : "Open Dashboard"}
              </Link>
            </div>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Standard Email & Password Form */}
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <span className="text-xs text-gray-400">Min 8 characters</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
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

        {/* Verified Google Sign-In (only shown when Google OAuth is configured on web) */}
        <GoogleSignInButton
          role="AGENT"
          redirectUrl={nextPath || "/agent/dashboard"}
          text="signin_with"
        />

        {/* Security Notice */}
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-2 text-[11px] text-gray-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Protected with HttpOnly signed session cookies. Sessions stay active for 30 days on your
            device and are revoked immediately on sign out.
          </span>
        </div>

        {/* Register link */}
        <div className="text-center text-xs sm:text-sm text-gray-500">
          New to CribConnect?{" "}
          <Link href="/auth/register" className="font-semibold text-emerald-700 hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
