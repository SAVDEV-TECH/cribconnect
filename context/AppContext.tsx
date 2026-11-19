"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Currency, Role, formatMoney as formatMoneyUtil } from "@/lib/types";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isAdmin?: boolean;
  isVerified?: boolean;
  avatar: string | null;
  phone: string | null;
  whatsapp: string | null;
  agencyName?: string | null;
  city?: string | null;
  currentSchool?: string | null;
  agentProfile?: {
    id: string;
    agencyName: string | null;
    verificationStatus: string;
    tier: string;
    badges: string;
    rating: number | null;
    reviewCount: number;
    bio: string | null;
    campusSpecialization: string | null;
    featuredListingCredits: number;
  } | null;
}

interface AppContextType {
  currentUser: User | null;
  sessionReady: boolean;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatMoney: (amountInNgn: number) => string;
  selectedUniversity: string;
  setSelectedUniversity: (uni: string) => void;
  isRelocationModalOpen: boolean;
  openRelocationModal: () => void;
  closeRelocationModal: () => void;
  videoTourUrl: string | null;
  openVideoTour: (url: string) => void;
  closeVideoTour: () => void;
  isUpgradeModalOpen: boolean;
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [selectedUniversity, setSelectedUniversity] = useState<string>(
    "University of Port Harcourt (UNIPORT)"
  );
  const [isRelocationModalOpen, setIsRelocationModalOpen] = useState(false);
  const [videoTourUrl, setVideoTourUrl] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const { getSavedMobileUser, syncOrRestoreSession } = await import("@/lib/client-auth");
      const cached = getSavedMobileUser();
      if (cached) {
        setCurrentUser(cached as unknown as User);
      }
      const user = await syncOrRestoreSession();
      setCurrentUser(user ? (user as unknown as User) : null);
    } catch (err) {
      console.error("Failed to load user session", err);
    } finally {
      setSessionReady(true);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const { clearMobileSession } = await import("@/lib/client-auth");
      clearMobileSession();
      setCurrentUser(null);
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    fetchSession();

    const handleAuthChanged = (event: Event) => {
      const custom = event as CustomEvent<{ user?: User | null }>;
      setCurrentUser(custom?.detail?.user ?? null);
    };

    window.addEventListener("cribconnect:auth-changed", handleAuthChanged);
    return () => {
      window.removeEventListener("cribconnect:auth-changed", handleAuthChanged);
    };
  }, [fetchSession]);

  const formatMoney = (amountInNgn: number) => formatMoneyUtil(amountInNgn, currency);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        sessionReady,
        currency,
        setCurrency,
        formatMoney,
        selectedUniversity,
        setSelectedUniversity,
        isRelocationModalOpen,
        openRelocationModal: () => setIsRelocationModalOpen(true),
        closeRelocationModal: () => setIsRelocationModalOpen(false),
        videoTourUrl,
        openVideoTour: (url: string) => setVideoTourUrl(url),
        closeVideoTour: () => setVideoTourUrl(null),
        isUpgradeModalOpen,
        openUpgradeModal: () => setIsUpgradeModalOpen(true),
        closeUpgradeModal: () => setIsUpgradeModalOpen(false),
        refreshUser: fetchSession,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
