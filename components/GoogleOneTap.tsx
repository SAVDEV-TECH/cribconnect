"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";

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
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Check if user is already logged in
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

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
        router.refresh();
      }
    } catch (err) {
      console.error("Google One Tap error:", err);
    }
  };

  const initGoogleIdentity = () => {
    // Only initialize if a real client ID is configured and user is not logged in
    if (!GOOGLE_CLIENT_ID || typeof window === "undefined" || !window.google?.accounts?.id || currentUser) {
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

  return (
    <>
      {GOOGLE_CLIENT_ID && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={initGoogleIdentity}
        />
      )}
    </>
  );
}
