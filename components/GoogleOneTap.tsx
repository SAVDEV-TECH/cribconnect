"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter, usePathname } from "next/navigation";
import { GoogleLogo } from "@/components/SocialAuthModal";
import { X } from "lucide-react";
import { syncOrRestoreSession, saveMobileSession, isMobileOrWebView } from "@/lib/client-auth";

declare global {
  interface Window {
    google?: any;
    _googleOneTapInitialized?: boolean;
  }
}

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "30670641547-a07vus133ok31mnjmscrjfnfil72f96j.apps.googleusercontent.com";

export default function GoogleOneTap() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isNativeApk, setIsNativeApk] = useState(false);
  const [showApkOneTap, setShowApkOneTap] = useState(false);

  // Check if user is already logged in (including 365-day saved mobile device token)
  useEffect(() => {
    const native =
      typeof navigator !== "undefined" &&
      navigator.userAgent.includes("CribConnectAndroid");
    setIsNativeApk(native);

    syncOrRestoreSession()
      .then((user) => {
        if (user) {
          setCurrentUser(user);
          setShowApkOneTap(false);
        } else if (native) {
          const dismissed =
            typeof sessionStorage !== "undefined" &&
            sessionStorage.getItem("cribconnect_apk_onetap_dismissed");
          if (!dismissed && !pathname?.startsWith("/auth/")) {
            setShowApkOneTap(true);
          }
        }
      })
      .catch(() => {})
      .finally(() => setSessionChecked(true));
  }, [pathname]);

  const handleCredentialResponse = async (response: any) => {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: response.credential,
          role: "AGENT",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          saveMobileSession(data.user, data.deviceToken);
          setCurrentUser(data.user);
        }
        router.refresh();
      }
    } catch (err) {
      console.error("Google One Tap error:", err);
    }
  };

  const initGoogleIdentity = () => {
    if (
      !GOOGLE_CLIENT_ID ||
      typeof window === "undefined" ||
      !window.google?.accounts?.id ||
      currentUser ||
      isMobileOrWebView() ||
      pathname?.startsWith("/auth/native-google")
    ) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.prompt();
      window._googleOneTapInitialized = true;
    } catch (e) {
      console.warn("Google One Tap initialization notice:", e);
    }
  };

  const handleApkContinueWithGoogle = () => {
    setShowApkOneTap(false);
    const redirect = pathname && pathname !== "/auth/login" ? pathname : "/agent/dashboard";
    window.location.href = `${window.location.origin}/auth/native-google?role=AGENT&redirect=${encodeURIComponent(
      redirect
    )}`;
  };

  const handleDismissApkPrompt = () => {
    setShowApkOneTap(false);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("cribconnect_apk_onetap_dismissed", "1");
    }
  };

  return (
    <>
      {GOOGLE_CLIENT_ID && !isNativeApk && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={initGoogleIdentity}
        />
      )}

      {/* Native Android APK 1-Tap Google Sign-In Floating Card */}
      {sessionChecked && isNativeApk && !currentUser && showApkOneTap && (
        <div className="fixed top-16 left-3 right-3 sm:left-auto sm:right-4 sm:w-80 z-50 bg-white rounded-2xl border border-gray-200 shadow-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-2">
              <GoogleLogo className="w-4 h-4" />
              <span className="text-xs font-bold text-gray-900">
                Sign in to CribConnect with Google
              </span>
            </div>
            <button
              type="button"
              onClick={handleDismissApkPrompt}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-gray-500 leading-snug">
            Tap below to continue in 1 tap using the Google account already signed in on your phone.
          </p>
          <button
            type="button"
            onClick={handleApkContinueWithGoogle}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0F766E] hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <span>Continue with Google (1-Tap)</span>
          </button>
        </div>
      )}
    </>
  );
}
