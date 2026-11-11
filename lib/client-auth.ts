"use client";

export const DEVICE_TOKEN_KEY = "cribconnect_device_token";
export const SAVED_USER_KEY = "cribconnect_saved_user";
export const QUICK_PROFILE_KEY = "cribconnect_quick_profile";

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
}

export function saveMobileSession(user: SavedAuthUser, deviceToken?: string) {
  if (typeof window === "undefined") return;
  try {
    if (deviceToken) {
      localStorage.setItem(DEVICE_TOKEN_KEY, deviceToken);
    }
    if (user) {
      localStorage.setItem(SAVED_USER_KEY, JSON.stringify(user));
      localStorage.setItem(
        QUICK_PROFILE_KEY,
        JSON.stringify({
          name: user.name,
          email: user.email,
          phone: user.phone || user.whatsapp || "",
          role: user.role || "AGENT",
          avatar: user.avatar || "",
        })
      );
    }
    window.dispatchEvent(new CustomEvent("cribconnect:auth-changed", { detail: { user } }));
  } catch (e) {
    console.warn("Unable to persist mobile session:", e);
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

export function getSavedDeviceToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(DEVICE_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getQuickProfile(): {
  name: string;
  email: string;
  phone: string;
  role: "AGENT" | "LANDLORD";
  avatar?: string;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(QUICK_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearMobileSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DEVICE_TOKEN_KEY);
    localStorage.removeItem(SAVED_USER_KEY);
    window.dispatchEvent(new CustomEvent("cribconnect:auth-changed", { detail: { user: null } }));
  } catch {}
}

export function getDeviceAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extra || {}) };
  const token = getSavedDeviceToken();
  if (token) {
    headers["x-device-token"] = token;
  }
  return headers;
}

export async function syncOrRestoreSession(): Promise<SavedAuthUser | null> {
  if (typeof window === "undefined") return null;
  const cachedUser = getSavedMobileUser();
  const deviceToken = getSavedDeviceToken();

  try {
    const res = await fetch("/api/auth/session", {
      method: "GET",
      headers: getDeviceAuthHeaders(),
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.user) {
        saveMobileSession(data.user, data.deviceToken || deviceToken || undefined);
        return data.user;
      }
    }
  } catch {
    // Offline or network blip: return locally persisted mobile user
    if (cachedUser) return cachedUser;
  }

  return cachedUser;
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
