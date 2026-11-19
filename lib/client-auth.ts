"use client";

export const SAVED_USER_KEY = "cribconnect_saved_user";
export const ACTIVE_ESCROW_KEY = "cribconnect_active_escrows";

export interface SavedAuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  role: string;
  avatar?: string;
  agencyName?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
}

export interface SavedEscrowReceipt {
  id: string;
  lookupToken: string;
  listingTitle: string;
  neighborhood?: string;
  amount: number;
  createdAt: string;
}

/**
 * Caches non-sensitive UI user metadata locally for instant hydration.
 * Authentication itself relies strictly on the server-set HttpOnly session cookie
 * (no raw session tokens are ever stored in localStorage).
 */
export function saveMobileSession(user: SavedAuthUser, _deprecatedDeviceToken?: string) {
  if (typeof window === "undefined") return;
  try {
    // Clean up any legacy token/profile keys from earlier builds
    localStorage.removeItem("cribconnect_device_token");
    localStorage.removeItem("cribconnect_quick_profile");
    if (user) {
      localStorage.setItem(SAVED_USER_KEY, JSON.stringify(user));
    }
    window.dispatchEvent(new CustomEvent("cribconnect:auth-changed", { detail: { user } }));
  } catch (e) {
    console.warn("Unable to cache user profile:", e);
  }
}

export function getSavedMobileUser(): SavedAuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVED_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearMobileSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("cribconnect_device_token");
    localStorage.removeItem("cribconnect_quick_profile");
    localStorage.removeItem(SAVED_USER_KEY);
    window.dispatchEvent(new CustomEvent("cribconnect:auth-changed", { detail: { user: null } }));
  } catch {}
}

export function getDeviceAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  return { ...(extra || {}) };
}

export async function syncOrRestoreSession(): Promise<SavedAuthUser | null> {
  if (typeof window === "undefined") return null;
  const cachedUser = getSavedMobileUser();

  try {
    const res = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.user) {
        saveMobileSession(data.user);
        return data.user;
      }
      // Server explicitly confirmed no active session — clear stale local cache
      clearMobileSession();
      return null;
    }
  } catch {
    // Offline or transient network error: preserve cached UI state
    if (cachedUser) return cachedUser;
  }

  return null;
}

export function saveEscrowReceiptLocally(receipt: SavedEscrowReceipt) {
  if (typeof window === "undefined" || !receipt.id || !receipt.lookupToken) return;
  try {
    const existing = getSavedEscrowReceipts().filter((r) => r.id !== receipt.id);
    localStorage.setItem(ACTIVE_ESCROW_KEY, JSON.stringify([receipt, ...existing].slice(0, 10)));
  } catch {}
}

export function getSavedEscrowReceipts(): SavedEscrowReceipt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACTIVE_ESCROW_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isMobileOrWebView(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    (window.navigator as any).standalone === true;
  const isMobileUa = /Android|iPhone|iPad|iPod|Mobile|CribConnectAndroid|wv/i.test(ua);
  return Boolean(isStandalone || isMobileUa || window.innerWidth < 768);
}
