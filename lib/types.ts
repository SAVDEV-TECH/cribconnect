export type Role = "STUDENT" | "TENANT" | "AGENT" | "LANDLORD" | "ADMIN";

export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export type AgentTier = "FREE" | "PRO";

export type PropertyType =
  | "SELF_CONTAIN"
  | "ONE_BED"
  | "TWO_BED"
  | "THREE_BED"
  | "HOSTEL_BED"
  | "STUDIO";

export type Currency = "NGN" | "USD" | "GBP";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
};

export const EXCHANGE_RATES: Record<Currency, number> = {
  NGN: 1,
  USD: 1 / 1550, // Approx Naira to USD
  GBP: 1 / 1950, // Approx Naira to GBP
};

export const PH_NEIGHBORHOOD_COORDS: Record<string, { lat: number; lng: number }> = {
  Choba: { lat: 4.8984, lng: 6.9315 },
  Ozuoba: { lat: 4.9245, lng: 6.9078 },
  Aluu: { lat: 4.9112, lng: 6.9187 },
  Rumuola: { lat: 4.8143, lng: 7.0135 },
  Rumuokoro: { lat: 4.8631, lng: 7.0219 },
  Rumuigbo: { lat: 4.8475, lng: 6.9896 },
  "GRA Port Harcourt": { lat: 4.8156, lng: 7.0497 },
};

export const PH_NEIGHBORHOODS = Object.keys(PH_NEIGHBORHOOD_COORDS);

export const ESCROW_DEPOSIT_AMOUNT = 10000;

export function formatMoney(amountInNgn: number, currency: Currency = "NGN"): string {
  const safeAmount = Number.isFinite(amountInNgn) ? amountInNgn : 0;
  const rate = EXCHANGE_RATES[currency] || 1;
  const converted = safeAmount * rate;
  const symbol = CURRENCY_SYMBOLS[currency] || "₦";

  if (currency === "NGN") {
    return `${symbol}${converted.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
  }
  return `${symbol}${converted.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function formatPeriodLabel(period?: string | null): string {
  if (!period) return "yr";
  const cleaned = period.trim().toLowerCase();
  if (cleaned === "per year" || cleaned === "year" || cleaned === "yr") return "yr";
  if (cleaned === "per semester" || cleaned === "semester") return "semester";
  if (cleaned === "per month" || cleaned === "month" || cleaned === "mo") return "mo";
  return period.replace(/^per\s+/i, "").trim() || "yr";
}

/**
 * Formats a Nigerian or international phone number into international digits
 * suitable for https://wa.me/<digits> (e.g. "0803 445 2299" -> "2348034452299").
 */
export function formatNigerianWhatsApp(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0") && digits.length === 11) {
    return `234${digits.slice(1)}`;
  }
  if (digits.startsWith("00")) {
    return digits.slice(2);
  }
  if (digits.length < 10 || digits.length > 15) {
    return "";
  }
  return digits;
}

export function buildWhatsAppUrl(phone: string | undefined | null, message: string): string | null {
  const intl = formatNigerianWhatsApp(phone);
  if (!intl) return null;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

/**
 * Safely classifies and normalizes a property walkthrough video URL.
 * Returns { kind: "video", src } for direct uploaded/hosted videos,
 * { kind: "iframe", src } ONLY for trusted YouTube/Vimeo embed URLs,
 * or null for disallowed/unsafe URLs.
 */
export function normalizeVideoTourUrl(
  rawUrl?: string | null
): { kind: "video" | "iframe"; src: string } | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Direct uploaded media served from our API or valid data:video URI
  if (
    /^\/api\/media\/[a-zA-Z0-9_-]+$/.test(trimmed) ||
    /^data:video\/(mp4|webm|quicktime);base64,/.test(trimmed)
  ) {
    return { kind: "video", src: trimmed };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return null;
  }

  const host = parsed.hostname.toLowerCase();

  // Direct video file hosted on Cloudinary or HTTPS MP4/WEBM/MOV
  if (
    host === "res.cloudinary.com" ||
    /\.(mp4|webm|mov)(\?.*)?$/i.test(parsed.pathname)
  ) {
    return { kind: "video", src: parsed.toString() };
  }

  // YouTube (watch, shorts, youtu.be, embed)
  if (
    host === "youtube.com" ||
    host === "www.youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtu.be" ||
    host === "www.youtube-nocookie.com"
  ) {
    let videoId = "";
    if (host === "youtu.be") {
      videoId = parsed.pathname.replace(/^\//, "").split("/")[0] || "";
    } else if (parsed.pathname.startsWith("/embed/")) {
      videoId = parsed.pathname.split("/")[2] || "";
    } else if (parsed.pathname.startsWith("/shorts/")) {
      videoId = parsed.pathname.split("/")[2] || "";
    } else {
      videoId = parsed.searchParams.get("v") || "";
    }

    if (/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
      return {
        kind: "iframe",
        src: `https://www.youtube-nocookie.com/embed/${videoId}`,
      };
    }
    return null;
  }

  // Vimeo
  if (host === "vimeo.com" || host === "www.vimeo.com" || host === "player.vimeo.com") {
    const match = parsed.pathname.match(/\/(?:video\/)?(\d{5,15})/);
    if (match) {
      return {
        kind: "iframe",
        src: `https://player.vimeo.com/video/${match[1]}`,
      };
    }
    return null;
  }

  return null;
}
