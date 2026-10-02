// lib/auth-security.ts
// Industry-Standard Security Utilities: PBKDF2 Hashing, Timing-Safe Comparison,
// HMAC Session Tokens, Rate Limiting, and Input Sanitization.

import crypto from "crypto";

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || "cribconnect-super-secure-key-2026-lagos-housing";

// --- 1. Password Hashing & Verification (PBKDF2 with SHA-512) ---

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  try {
    const hash = crypto
      .pbkdf2Sync(password, salt, 100000, 64, "sha512")
      .toString("hex");

    const hashBuffer = Buffer.from(hash, "hex");
    const storedBuffer = Buffer.from(storedHash, "hex");

    if (hashBuffer.length !== storedBuffer.length) {
      return false;
    }

    // Timing-safe comparison to prevent side-channel timing attacks
    return crypto.timingSafeEqual(hashBuffer, storedBuffer);
  } catch {
    return false;
  }
}

// --- 2. Tamper-Proof Signed Session Tokens ---

export function createSessionToken(userId: string, role: string): string {
  const payload = {
    userId,
    role,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(token: string): { userId: string; role: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadBase64, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(payloadBase64)
      .digest("base64url");

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString());
    if (Date.now() > payload.expiresAt) return null;

    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

// --- 3. Rate Limiter (Brute-Force & DoS Protection) ---

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count };
}

// Cleanup rate limit map every 10 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((record, key) => {
      if (now > record.resetAt) {
        rateLimitMap.delete(key);
      }
    });
  }, 10 * 60 * 1000);
}

// --- 4. Input Sanitization & Anti-XSS Protection ---

export function sanitizeText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>]/g, "") // Strip dangerous HTML brackets
    .replace(/javascript:/gi, "") // Disallow pseudo-protocols
    .replace(/data:text\/html/gi, "")
    .trim();
}

export function sanitizeUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const clean = url.trim();

  // Allow only valid HTTP/HTTPS URLs or YouTube/Vimeo embed links
  if (!clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("/")) {
    return null;
  }

  // Reject dangerous protocols
  const lower = clean.toLowerCase();
  if (lower.includes("javascript:") || lower.includes("vbscript:") || lower.includes("data:text")) {
    return null;
  }

  return clean;
}

export function isValidEmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

export function isValidPhone(phone: unknown): boolean {
  if (typeof phone !== "string") return false;
  // Nigerian or international phone numbers
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15 && /^\d+$/.test(cleaned);
}
