"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GoogleLogo } from "@/components/SocialAuthModal";
import { CheckCircle2, AlertCircle, ShieldCheck, ArrowRight, Smartphone } from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "30670641547-a07vus133ok31mnjmscrjfnfil72f96j.apps.googleusercontent.com";

function NativeGoogleAuthContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") === "LANDLORD" ? "LANDLORD" : "AGENT";
  const redirectUrl = searchParams.get("redirect") || "/agent/dashboard";

  const [status, setStatus] = useState<"ready" | "loading" | "success" | "error">("ready");
  const [error, setError] = useState<string | null>(null);
  const [deepLinkUrl, setDeepLinkUrl] = useState<string | null>(null);
  const [googleReady, setGoogleReady] = useState(false);

  const completeNativeHandoff = async (payload: { credential?: string; accessToken?: string }) => {
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: payload.credential,
          accessToken: payload.accessToken,
          role,
        }),
      });

      const data = await res.json();
      const handoffToken = data.deviceToken || data.handoffToken;
      if (!res.ok || !handoffToken) {
        throw new Error(data.error || "Could not complete Google Sign-In.");
      }

      const appDeepLink = `cribconnect://auth-callback?token=${encodeURIComponent(
        handoffToken
      )}&redirect=${encodeURIComponent(redirectUrl)}`;

      setDeepLinkUrl(appDeepLink);
      setStatus("success");

      // Automatically bounce straight back into the native Android APK
      window.location.href = appDeepLink;
    } catch (err: any) {
      setError(err.message || "Google authentication failed.");
      setStatus("error");
    }
  };

  const launchGoogleChooser = () => {
    if (typeof window === "undefined" || !window.google) {
      setError("Google services are still loading. Please tap again in a second.");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      if (window.google.accounts?.oauth2) {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "email profile openid",
          callback: (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              completeNativeHandoff({ accessToken: tokenResponse.access_token });
            } else {
              setStatus("ready");
            }
          },
          error_callback: () => {
            setStatus("ready");
          },
        });
        tokenClient.requestAccessToken({ prompt: "select_account" });
      } else if (window.google.accounts?.id) {
        window.google.accounts.id.prompt();
      }
    } catch (err: any) {
      setError(err.message || "Could not open Google account chooser.");
      setStatus("error");
    }
  };

  useEffect(() => {
    // Load GIS script directly on this handoff page if not already loaded, then trigger Google One Tap
    if (typeof window !== "undefined" && !document.getElementById("gis-native-script")) {
      const s = document.createElement("script");
      s.id = "gis-native-script";
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }

    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      if (typeof window !== "undefined" && window.google?.accounts?.id) {
        clearInterval(timer);
        setGoogleReady(true);
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (res: any) => {
              if (res?.credential) {
                completeNativeHandoff({ credential: res.credential });
              }
            },
            auto_select: false,
            cancel_on_tap_outside: false,
          });
          // Automatically pop Google One Tap in Chrome (uses the phone's signed-in Gmail!)
          window.google.accounts.id.prompt();
        } catch (e) {
          console.warn("Native Google One Tap init:", e);
        }
      } else if (attempts > 40) {
        clearInterval(timer);
      }
    }, 250);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#FAF9F6]">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 space-y-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#0F766E] text-white font-bold text-lg flex items-center justify-center mx-auto shadow-sm">
          C
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[#0F766E] text-[11px] font-bold">
            <Smartphone className="w-3.5 h-3.5" />
            <span>CribConnect Android Secure Sign-In</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">1-Tap Google Sign-In</h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            Tap your Google account on this phone and you will be returned straight into the CribConnect app automatically — no password required.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {status === "success" && deepLinkUrl ? (
          <div className="space-y-4 py-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#0F766E] border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Signed In Successfully!</h2>
              <p className="text-xs text-gray-500 mt-1">
                Returning you to the CribConnect mobile app...
              </p>
            </div>
            <a
              href={deepLinkUrl}
              className="w-full py-3 px-4 rounded-xl bg-[#0F766E] hover:bg-teal-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <span>Open CribConnect App</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              disabled={status === "loading"}
              onClick={launchGoogleChooser}
              className="w-full py-3 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 font-bold text-sm flex items-center justify-center gap-3 shadow-xs transition-all disabled:opacity-60"
            >
              <GoogleLogo className="w-5 h-5" />
              <span>
                {status === "loading"
                  ? "Signing you in..."
                  : googleReady
                  ? "Tap to Choose Your Google Account"
                  : "Loading Google Account Picker..."}
              </span>
            </button>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2 text-[11px] text-gray-500 text-left">
              <ShieldCheck className="w-4 h-4 text-[#0F766E] shrink-0" />
              <span>
                Uses your phone&apos;s verified Chrome Google session so you don&apos;t have to type your email or password manually.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NativeGoogleAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center text-xs text-gray-500">
          Preparing secure Google Sign-In...
        </div>
      }
    >
      <NativeGoogleAuthContent />
    </Suspense>
  );
}
