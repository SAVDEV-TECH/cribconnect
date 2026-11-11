"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Smartphone,
  User,
  Phone,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import {
  saveMobileSession,
  syncOrRestoreSession,
  getQuickProfile,
  SavedAuthUser,
} from "@/lib/client-auth";

export default function LoginPage() {
  const router = useRouter();
  const [authTab, setAuthTab] = useState<"onetime" | "password">("onetime");
  const [role, setRole] = useState<"AGENT" | "LANDLORD">("AGENT");

  // One-Time Mobile Sign-In fields
  const [name, setName] = useState("");
  const [oneTimeEmail, setOneTimeEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Standard Email + Password fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingUser, setExistingUser] = useState<SavedAuthUser | null>(null);

  useEffect(() => {
    const savedQuick = getQuickProfile();
    if (savedQuick) {
      setName(savedQuick.name || "");
      setOneTimeEmail(savedQuick.email || "");
      setEmail(savedQuick.email || "");
      setPhone(savedQuick.phone || "");
      if (savedQuick.role === "LANDLORD" || savedQuick.role === "AGENT") {
        setRole(savedQuick.role);
      }
    }

    syncOrRestoreSession()
      .then((user) => {
        if (user) {
          setExistingUser(user);
        }
      })
      .catch(() => {});
  }, []);

  // One-Time Mobile Sign-In handler (Zero password / zero popup blank screen)
  const handleOneTimeMobileSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !oneTimeEmail.trim()) {
      setError("Please enter your full name and email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: oneTimeEmail.trim().toLowerCase(),
          phone: phone.trim(),
          whatsapp: phone.trim(),
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete One-Time Sign-In");
      }

      if (data.user) {
        saveMobileSession(data.user, data.deviceToken);
      }

      router.push("/list-property");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Could not sign in. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Standard Email & Password handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
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

      if (data.user) {
        saveMobileSession(data.user, data.deviceToken);
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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-5 shadow-xs">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
            <Smartphone className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sign In to CribConnect
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            One-time mobile sign-in · Stay signed in automatically on your phone
          </p>
        </div>

        {/* Already Signed-In Banner on Mobile */}
        {existingUser && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-emerald-950 truncate">
                  Signed in on this phone as {existingUser.name}
                </div>
                <div className="text-[11px] text-emerald-700 truncate">
                  {existingUser.email} · {existingUser.role}
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
                href="/agent/dashboard"
                className="py-2 px-3 rounded-xl bg-white hover:bg-gray-50 text-emerald-800 border border-emerald-200 text-xs font-bold text-center transition-colors"
              >
                Open Dashboard
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

        {/* Mode Switcher: One-Time Mobile Sign-In vs Password */}
        <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => {
              setAuthTab("onetime");
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              authTab === "onetime"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>One-Time Mobile Sign-In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab("password");
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              authTab === "password"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Email &amp; Password</span>
          </button>
        </div>

        {authTab === "onetime" ? (
          <div className="space-y-4">
            <form onSubmit={handleOneTimeMobileSignIn} className="space-y-3.5">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  I am signing in as:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("AGENT")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-colors ${
                      role === "AGENT"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}
                  >
                    Real Estate Agent
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("LANDLORD")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-colors ${
                      role === "LANDLORD"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}
                  >
                    Property Owner
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Chinedu Eze"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Gmail or Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={oneTimeEmail}
                    onChange={(e) => setOneTimeEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  WhatsApp / Phone Number (For Student Inquiries)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 08034452299"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center gap-2 text-[11px] text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>One-Time Mobile Sign-In:</strong> We save a secure 365-day token on this phone so you never have to log in again.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
              >
                <span>{loading ? "Signing you in..." : "Sign In Once & Remember My Phone"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex py-0.5 items-center">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink mx-3 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                Or quick Google option
              </span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <GoogleSignInButton
              role={role}
              redirectUrl="/list-property"
              text="signin_with"
            />
          </div>
        ) : (
          /* Standard Email & Password Form */
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
              <span>{loading ? "Signing in..." : "Sign In with Email & Remember Phone"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Explanation Note on Becoming Agent/Landlord */}
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>How does One-Time Mobile Sign-In work?</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Sign in once on your mobile phone — CribConnect stores an encrypted device session so you stay logged in permanently whenever you open the app to post houses or check tenant bookings.
          </p>
        </div>

        {/* Register link */}
        <div className="text-center text-xs sm:text-sm text-gray-500">
          Prefer full registration with password?{" "}
          <Link href="/auth/register" className="font-semibold text-emerald-700 hover:underline">
            Register with Email
          </Link>
        </div>
      </div>
    </div>
  );
}
