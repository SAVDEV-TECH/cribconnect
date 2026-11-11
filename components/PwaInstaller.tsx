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
  Share2,
  WifiOff,
  CheckCircle2,
} from "lucide-react";

export default function PwaInstaller() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Register Service Worker for PWA installability & force immediate update to v3
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch((err) => console.warn("SW registration skipped:", err));
    }

    // 2. Detect standalone installed app mode
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const dismissed = sessionStorage.getItem("cribconnect_pwa_dismissed");

    // 3. Detect iOS device
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(iosDevice);

    if (iosDevice && !standalone && !dismissed) {
      setShowInstallBanner(true);
    }

    // 4. Listen for native Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed && !standalone) {
        setShowInstallBanner(true);
      }
    };

    // 5. Listen for Navbar "Get App" click event
    const handleOpenInstallModal = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(({ outcome }: any) => {
          if (outcome === "accepted") {
            setShowInstallBanner(false);
            setShowInstallModal(false);
          }
          setDeferredPrompt(null);
        });
      } else {
        setShowInstallModal(true);
      }
    };

    // 6. Track online/offline state like a native app
    setIsOffline(!navigator.onLine);
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("cribconnect:open-install", handleOpenInstallModal);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("cribconnect:open-install", handleOpenInstallModal);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowInstallBanner(false);
        setShowInstallModal(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  };

  const handleShareApp = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "CribConnect UNIPORT",
          text: "Find verified student housing near UNIPORT (Choba, Aluu, Ozuoba, Rumuola) with video tours & Escrow protection.",
          url: window.location.origin,
        });
      } catch {
        // User cancelled share sheet
      }
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("cribconnect_pwa_dismissed", "1");
    }
  };

  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(8);
      } catch {}
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
      {/* Native Offline Status Bar */}
      {isOffline && (
        <div className="fixed top-14 left-0 right-0 z-50 bg-amber-600 text-white text-xs font-semibold py-1.5 px-4 flex items-center justify-center gap-2 shadow-sm">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode · Viewing cached CribConnect UNIPORT listings</span>
        </div>
      )}

      {/* Install CribConnect PWA Banner */}
      {showInstallBanner && !isStandalone && (
        <div className="fixed bottom-16 md:bottom-5 left-3 right-3 md:left-auto md:right-5 md:max-w-sm z-40 bg-gray-900 text-white rounded-2xl p-3.5 shadow-xl border border-gray-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                Install CribConnect Mobile App
              </div>
              <p className="text-[11px] text-gray-300 leading-snug">
                {isIos
                  ? "Tap 'Install' to add CribConnect to your iPhone Home Screen."
                  : "Launch full-screen from your phone home screen with offline access."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
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

      {/* Full Native App Installation Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-gray-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  C
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Install CribConnect App
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Full-screen mobile experience &middot; Zero Play Store / App Store wait
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Install Instant Web App (PWA)</span>
              </button>
            )}

            <a
              href="/CribConnect.apk"
              download="CribConnect.apk"
              className="w-full py-3 px-4 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Native Android APK (CribConnect.apk)</span>
            </a>

            <div className="space-y-3 text-xs text-gray-700">
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>On Android (Chrome / Edge / Samsung Internet):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-emerald-900">
                    <li>Tap the <strong>3-dot menu (⋮)</strong> at the top-right of your browser.</li>
                    <li>Select <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>.</li>
                    <li>Open CribConnect directly from your phone app drawer!</li>
                  </ol>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>On iPhone / iPad (Safari):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-600">
                    <li>Tap the <strong>Share icon (square with arrow up)</strong> at the bottom of Safari.</li>
                    <li>Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.</li>
                    <li>Tap <strong>Add</strong> in the top-right corner.</li>
                  </ol>
                </div>
              </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleShareApp}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share App Link</span>
              </button>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile App Bottom Navigation Bar (Native App Tab Bar on Phones) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 pt-1.5 pb-safe flex items-center justify-around shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
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
              onClick={triggerHaptic}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-all active:scale-95 ${
                active
                  ? "text-emerald-700 bg-emerald-50/80"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`w-4 h-4 mb-0.5 ${
                  active ? "text-emerald-600 stroke-[2.5]" : "text-gray-400"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
