"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Currency, formatMoney as formatMoneyUtil } from "@/lib/types";

interface User {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "AGENT" | "ADMIN";
  avatar: string | null;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  currentSchool: string | null;
  agentProfile?: {
    id: string;
    agencyName: string | null;
    verificationStatus: string;
    tier: string;
    badges: string;
    rating: number;
    reviewCount: number;
    bio: string | null;
    campusSpecialization: string | null;
    featuredListingCredits: number;
  } | null;
}

interface AppContextType {
  currentUser: User | null;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("University of Port Harcourt (UNIPORT)");
  const [isRelocationModalOpen, setIsRelocationModalOpen] = useState(false);
  const [videoTourUrl, setVideoTourUrl] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error("Failed to load user session", err);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const formatMoney = (amountInNgn: number) => formatMoneyUtil(amountInNgn, currency);

  return (
    <AppContext.Provider
      value={{
        currentUser,
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
