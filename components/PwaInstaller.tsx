"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Download,
  X,
  Home,
  Building2,
  MessageSquarePlus,
  PlusCircle,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

export default function PwaInstaller() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register Service Worker for PWA installability & offline support
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.warn("SW registration skipped:", err));
    }

    // Check if already installed in standalone mode
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const dismissed = sessionStorage.getItem("cribconnect_pwa_dismissed");

    // Check iOS device
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(iosDevice);

    if (iosDevice && !standalone && !dismissed) {
      setShowInstallBanner(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed && !standalone) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("cribconnect_pwa_dismissed", "1");
    }
  };

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/listings", label: "Browse", icon: Building2 },
    { href: "/requests", label: "Connect", icon: MessageSquarePlus },
    { href: "/agent/dashboard", label: "List Room", icon: PlusCircle },
    { href: "/admin", label: "Admin", icon: ShieldCheck },
  ];

  return (
    <>
      {/* Install CribConnect PWA Banner */}
      {showInstallBanner && !isStandalone && (
        <div className="fixed bottom-16 md:bottom-5 left-3 right-3 md:left-auto md:right-5 md:max-w-sm z-40 bg-gray-900 text-white rounded-2xl p-3.5 shadow-xl border border-gray-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                Install CribConnect App
              </div>
              <p className="text-[11px] text-gray-300 leading-snug">
                {isIos
                  ? "Tap Share → 'Add to Home Screen' for the full mobile app."
                  : "Add to your phone home screen for fast offline access & alerts."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
            )}
            <button
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile App Bottom Navigation Bar (Visible on phones/small screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-colors ${
                active
                  ? "text-emerald-600"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${active ? "text-emerald-600" : "text-gray-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
