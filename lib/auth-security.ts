// lib/auth-security.ts
// Security utilities: PBKDF2 password hashing, timing-safe comparison,
// HMAC session tokens with revocation IDs, admin authorization,
// MIME/magic-byte media validation, rate limiting, and input sanitization.

import crypto from "crypto";
import type { NextRequest } from "next/server";

const DEV_EPHEMERAL_SECRET = crypto.randomBytes(32).toString("hex");
const DUMMY_PASSWORD_SALT = "00112233445566778899aabbccddeeff";
const DUMMY_PASSWORD_HASH = crypto
  .pbkdf2Sync("cribconnect-dummy-timing-guard", DUMMY_PASSWORD_SALT, 100000, 64, "sha512")
  .toString("hex");

export const MAX_PASSWORD_LENGTH = 256;
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days persistent HttpOnly cookie
// Keep legacy export name for backwards compatibility with existing imports
export const ONE_YEAR_SECONDS = SESSION_MAX_AGE_SECONDS;

function getAuthSecret(): string {
  const configured = (process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "").trim();
  if (configured.length >= 16) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXTAUTH_SECRET (minimum 16 characters) must be configured in production environment variables."
    );
  }

  return DEV_EPHEMERAL_SECRET;
}

// --- 1. Password Hashing & Verification (PBKDF2 with SHA-512) ---

export function hashPassword(password: string): { salt: string; hash: string } {
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(`Password exceeds maximum length of ${MAX_PASSWORD_LENGTH} characters.`);
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  try {
    if (!password || password.length > MAX_PASSWORD_LENGTH || !salt || !storedHash) {
      // Perform dummy PBKDF2 to keep response timing consistent
      crypto.pbkdf2Sync(
        (password || "").slice(0, MAX_PASSWORD_LENGTH),
        DUMMY_PASSWORD_SALT,
        100000,
        64,
        "sha512"
      );
      return false;
    }

    const hash = crypto
      .pbkdf2Sync(password, salt, 100000, 64, "sha512")
      .toString("hex");

    const hashBuffer = Buffer.from(hash, "hex");
    const storedBuffer = Buffer.from(storedHash, "hex");

    if (hashBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(hashBuffer, storedBuffer);
  } catch {
    return false;
  }
}

export function runDummyPasswordCheck(password: string): void {
  try {
    const safe = (password || "").slice(0, MAX_PASSWORD_LENGTH);
    const computed = crypto
      .pbkdf2Sync(safe, DUMMY_PASSWORD_SALT, 100000, 64, "sha512")
      .toString("hex");
    crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(DUMMY_PASSWORD_HASH, "hex"));
  } catch {
    // Ignore
  }
}

export function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// --- 2. CSPRNG Helpers ---

export function generateSecurePin(): string {
  return crypto.randomInt(1000, 10000).toString();
}

export function generateSecureToken(byteLength = 24): string {
  return crypto.randomBytes(byteLength).toString("hex");
}

// --- 3. Tamper-Proof Signed Session Tokens ---

export interface SessionTokenMeta {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  avatar?: string;
  agencyName?: string;
}

export interface VerifiedSessionPayload extends SessionTokenMeta {
  userId: string;
  role: string;
  jti: string;
  issuedAt: number;
  expiresAt: number;
}

export function createSessionToken(userId: string, role: string, meta?: SessionTokenMeta): string {
  const secret = getAuthSecret();
  const now = Date.now();
  const payload = {
    v: 2,
    jti: crypto.randomUUID(),
    userId,
    role,
    ...(meta || {}),
    issuedAt: now,
    expiresAt: now + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(token: string): VerifiedSessionPayload | null {
  try {
    const secret = getAuthSecret();
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadBase64, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payloadBase64)
      .digest("base64url");

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8"));
    if (!payload || typeof payload.userId !== "string" || typeof payload.expiresAt !== "number") {
      return null;
    }
    if (Date.now() > payload.expiresAt) return null;

    return {
      userId: payload.userId,
      role: String(payload.role || "TENANT"),
      jti: typeof payload.jti === "string" ? payload.jti : "",
      issuedAt: Number(payload.issuedAt || 0),
      expiresAt: payload.expiresAt,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      whatsapp: payload.whatsapp,
      avatar: payload.avatar,
      agencyName: payload.agencyName,
    };
  } catch {
    return null;
  }
}

// --- 4. Admin Authorization Helper ---

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const rawList = process.env.ADMIN_EMAILS || "";
  if (!rawList.trim()) return false;
  const normalized = email.trim().toLowerCase();
  return rawList
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}

export function isAdminUser(user?: { role?: string | null; email?: string | null } | null): boolean {
  if (!user) return false;
  return user.role === "ADMIN" || isAdminEmail(user.email);
}

// --- 5. Rate Limiter (Brute-Force & DoS Protection) ---

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const MAX_RATE_LIMIT_ENTRIES = 10000;

export function getClientIp(req: NextRequest): string {
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return "local";
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    if (rateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES) {
      // Evict expired entries to bound memory usage
      rateLimitMap.forEach((rec, k) => {
        if (now > rec.resetAt) rateLimitMap.delete(k);
      });
    }
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(0, maxRequests - 1) };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: Math.max(0, maxRequests - record.count) };
}

if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((record, key) => {
      if (now > record.resetAt) {
        rateLimitMap.delete(key);
      }
    });
  }, 10 * 60 * 1000);
  if (typeof (timer as any).unref === "function") {
    (timer as any).unref();
  }
}

// --- 6. Media MIME Allowlist & Magic-Byte Validation ---

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB (fits within serverless limits)
export const MAX_VIDEO_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB (for direct cloud uploads)

export function isAllowedMediaMime(mimeType: string): boolean {
  const normalized = mimeType.toLowerCase().trim();
  return ALLOWED_IMAGE_TYPES.has(normalized) || ALLOWED_VIDEO_TYPES.has(normalized);
}

export function validateMediaMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (!buffer || buffer.length < 12) return false;
  const mime = mimeType.toLowerCase().trim();

  if (mime === "image/jpeg" || mime === "image/jpg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mime === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  if (mime === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  if (mime === "image/avif") {
    return buffer.subarray(4, 8).toString("ascii") === "ftyp";
  }
  if (mime === "video/mp4" || mime === "video/quicktime") {
    return buffer.subarray(4, 8).toString("ascii") === "ftyp";
  }
  if (mime === "video/webm") {
    return (
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    );
  }
  return false;
}

// --- 7. Input Sanitization & Validation ---

export function sanitizeText(input: unknown, maxLength = 2000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/data:text\/html/gi, "")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const clean = url.trim();
  if (!clean) return null;

  // Reject protocol-relative URLs (//evil.com) and non-HTTP/relative schemes
  if (clean.startsWith("//")) return null;
  if (
    !clean.startsWith("https://") &&
    !clean.startsWith("http://") &&
    !clean.startsWith("/")
  ) {
    return null;
  }

  const lower = clean.toLowerCase();
  if (
    lower.includes("javascript:") ||
    lower.includes("vbscript:") ||
    lower.includes("data:")
  ) {
    return null;
  }

  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    try {
      const parsed = new URL(clean);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
      return parsed.toString();
    } catch {
      return null;
    }
  }

  return clean;
}

export function isValidEmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(trimmed);
}

export function isValidPhone(phone: unknown): boolean {
  if (typeof phone !== "string") return false;
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15 && /^\d+$/.test(cleaned);
}
