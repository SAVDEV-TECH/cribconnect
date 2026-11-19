"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { saveMobileSession, isMobileOrWebView } from "@/lib/client-auth";

declare global {
  interface Window {
    google?: any;
    _googleOneTapInitialized?: boolean;
  }
}

const GOOGLE_CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();

export default function GoogleOneTap() {
  const router = useRouter();
  const { currentUser, sessionReady, refreshUser } = useApp();
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (
      !GOOGLE_CLIENT_ID ||
      !scriptLoaded ||
      !sessionReady ||
      currentUser ||
      typeof window === "undefined" ||
      !window.google?.accounts?.id ||
      window._googleOneTapInitialized ||
      isMobileOrWebView()
    ) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          if (!response?.credential) return;
          try {
            const res = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                credential: response.credential,
                role: "STUDENT",
              }),
            });

            if (res.ok) {
              const data = await res.json();
              if (data?.user) {
                saveMobileSession(data.user);
              }
              await refreshUser();
              router.refresh();
            }
          } catch (err) {
            console.error("Google One Tap error:", err);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.prompt();
      window._googleOneTapInitialized = true;
    } catch (e) {
      console.warn("Google One Tap initialization notice:", e);
    }
  }, [scriptLoaded, sessionReady, currentUser, refreshUser, router]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => setScriptLoaded(true)}
    />
  );
}
