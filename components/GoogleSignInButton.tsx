"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogo } from "@/components/SocialAuthModal";
import { AlertCircle, HelpCircle, X, ExternalLink } from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInButtonProps {
  role?: "AGENT" | "LANDLORD";
  redirectUrl?: string;
  onSuccess?: () => void;
  text?: "continue_with" | "signin_with" | "signup_with";
}

export default function GoogleSignInButton({
  role = "AGENT",
  redirectUrl = "/list-property",
  onSuccess,
  text = "continue_with",
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const nativeButtonRef = useRef<HTMLDivElement>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Process verified token returned from Google (zero typing needed)
  const handleGoogleResponse = async (payload: { credential?: string; accessToken?: string }) => {
    setLoading(true);
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
      if (!res.ok) {
        throw new Error(data.error || "Google authentication failed");
      }

      onSuccess?.();
      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  // Trigger Google's official OAuth popup
  const handleSignInClick = () => {
    if (!clientId) {
      setShowConfigModal(true);
      return;
    }

    if (typeof window === "undefined" || !window.google) {
      setError("Google authentication service is loading. Please try again in a few seconds.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Launch official Google OAuth2 Token Client Popup
      if (window.google.accounts?.oauth2) {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "email profile openid",
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              await handleGoogleResponse({ accessToken: tokenResponse.access_token });
            } else {
              setLoading(false);
            }
          },
        });
        tokenClient.requestAccessToken();
      } else if (window.google.accounts?.id) {
        // Fallback to Google ID prompt
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            setLoading(false);
            setError("Google popup was blocked by browser. Please allow popups or use email sign in.");
          }
        });
      }
    } catch (err: any) {
      setError(err.message || "Could not launch Google sign in");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!clientId || typeof window === "undefined" || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (res: any) => handleGoogleResponse({ credential: res.credential }),
        auto_select: false,
      });

      if (nativeButtonRef.current) {
        window.google.accounts.id.renderButton(nativeButtonRef.current, {
          theme: "outline",
          size: "large",
          width: nativeButtonRef.current.offsetWidth || 340,
          text,
          shape: "rectangular",
        });
      }
    } catch (e) {
      console.warn("Google button init:", e);
    }
  }, [clientId, text]);

  return (
    <div className="w-full space-y-2">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-tight">{error}</span>
        </div>
      )}

      {/* 1-Click Google Button */}
      <button
        type="button"
        disabled={loading}
        onClick={handleSignInClick}
        className="w-full py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-medium text-sm flex items-center justify-center gap-3 transition-colors shadow-xs disabled:opacity-50"
      >
        <GoogleLogo className="w-4 h-4 shrink-0" />
        <span>{loading ? "Connecting to Google..." : "Continue with Google"}</span>
      </button>

      {/* Hidden native container used by GIS if rendered */}
      <div ref={nativeButtonRef} className="hidden" />

      {/* Modal shown if Client ID is not yet added in environment */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <GoogleLogo className="w-5 h-5" />
                <h3 className="font-bold text-sm text-gray-900">Google 1-Click Sign-In Setup</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              To allow users to sign in with Google in 1 click without typing anything, your Google Cloud OAuth Client ID is required.
            </p>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-2">
              <span className="font-semibold text-gray-800 block">Quick 2-Minute Setup:</span>
              <ol className="list-decimal pl-4 space-y-1 text-gray-600">
                <li>Go to Google Cloud Console (APIs & Services &gt; Credentials).</li>
                <li>Create an OAuth 2.0 Client ID (Web Application).</li>
                <li>
                  Add Authorized JavaScript origins:
                  <code className="block bg-white p-1 rounded border border-gray-200 text-[11px] font-mono text-emerald-800 mt-0.5">
                    https://cribconnect-gold.vercel.app
                  </code>
                  <code className="block bg-white p-1 rounded border border-gray-200 text-[11px] font-mono text-emerald-800 mt-0.5">
                    http://localhost:3000
                  </code>
                </li>
                <li>Copy the Client ID and add it to your environment variables:
                  <code className="block bg-white p-1 rounded border border-gray-200 text-[11px] font-mono text-gray-800 mt-0.5">
                    NEXT_PUBLIC_GOOGLE_CLIENT_ID=&quot;your-client-id.apps.googleusercontent.com&quot;
                  </code>
                </li>
              </ol>
            </div>

            <p className="text-xs text-gray-500">
              In the meantime, you can sign in directly using the <strong>Email &amp; Password</strong> form below.
            </p>

            <button
              type="button"
              onClick={() => setShowConfigModal(false)}
              className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs transition-colors"
            >
              Continue to Email &amp; Password Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
