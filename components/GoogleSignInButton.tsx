"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { saveMobileSession, isMobileOrWebView } from "@/lib/client-auth";

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInButtonProps {
  role?: "AGENT" | "LANDLORD" | "STUDENT";
  redirectUrl?: string;
  onSuccess?: () => void;
  text?: "continue_with" | "signin_with" | "signup_with";
}

const GOOGLE_CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();

export default function GoogleSignInButton({
  role = "AGENT",
  redirectUrl = "/agent/dashboard",
  onSuccess,
  text = "continue_with",
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const { refreshUser } = useApp();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gsiReady, setGsiReady] = useState(false);

  const completeGoogleAuth = async (credential: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google authentication failed.");
      }
      if (data.user) {
        saveMobileSession(data.user);
      }
      await refreshUser();
      onSuccess?.();
      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || typeof window === "undefined" || isMobileOrWebView()) {
      return;
    }

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return false;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (res: any) => {
            if (res?.credential) {
              completeGoogleAuth(res.credential);
            }
          },
        });
        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          text,
          shape: "rectangular",
          width: 340,
        });
        setGsiReady(true);
        return true;
      } catch {
        return false;
      }
    };

    if (renderGoogleButton()) return;
    const interval = setInterval(() => {
      if (renderGoogleButton()) {
        clearInterval(interval);
      }
    }, 400);

    const timeout = setTimeout(() => clearInterval(interval), 6000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, text]);

  if (!GOOGLE_CLIENT_ID || (typeof window !== "undefined" && isMobileOrWebView())) {
    return null;
  }

  return (
    <div className="w-full space-y-3">
      {gsiReady && (
        <div className="relative flex py-0.5 items-center">
          <div className="flex-grow border-t border-gray-100"></div>
          <span className="flex-shrink mx-3 text-[11px] font-medium uppercase tracking-wider text-gray-400">
            Or continue with Google
          </span>
          <div className="flex-grow border-t border-gray-100"></div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div
        ref={buttonRef}
        className={`flex justify-center ${loading ? "opacity-50 pointer-events-none" : ""}`}
      />
    </div>
  );
}
