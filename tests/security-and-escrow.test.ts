import test from "node:test";
import assert from "node:assert/strict";

// Ensure data-store tests run purely in-memory without touching any external database
delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;
process.env.NEXTAUTH_SECRET = "test-suite-super-secret-key-at-least-32-chars";

import {
  MAX_PASSWORD_LENGTH,
  checkRateLimit,
  createSessionToken,
  hashPassword,
  isAdminUser,
  runDummyPasswordCheck,
  sanitizeUrl,
  validateMediaMagicBytes,
  verifyPassword,
  verifySessionToken,
} from "../lib/auth-security";
import {
  buildWhatsAppUrl,
  formatNigerianWhatsApp,
  formatPeriodLabel,
  normalizeVideoTourUrl,
} from "../lib/types";
import {
  addEscrowDepositStore,
  addListingStore,
  confirmEscrowPayment,
  deleteListingById,
  isTokenRevoked,
  markEscrowDisbursed,
  revokeTokenId,
  updateEscrowStatus,
} from "../lib/data-store";

test("auth-security: password hashing, verification, and max length guard", () => {
  const { salt, hash } = hashPassword("CorrectHorseBatteryStaple!");
  assert.equal(verifyPassword("CorrectHorseBatteryStaple!", salt, hash), true);
  assert.equal(verifyPassword("WrongPassword!", salt, hash), false);
  assert.equal(verifyPassword("a".repeat(MAX_PASSWORD_LENGTH + 1), salt, hash), false);
  assert.doesNotThrow(() => runDummyPasswordCheck("any-password"));

  assert.throws(() => hashPassword("x".repeat(MAX_PASSWORD_LENGTH + 1)));
});

test("auth-security: fail-closed production secret enforcement", () => {
  const prevSecret = process.env.NEXTAUTH_SECRET;
  const prevAuthSecret = process.env.AUTH_SECRET;
  const prevNodeEnv = process.env.NODE_ENV;
  try {
    process.env.NEXTAUTH_SECRET = "";
    process.env.AUTH_SECRET = "";
    (process.env as any).NODE_ENV = "production";
    assert.throws(() => createSessionToken("u1", "AGENT"));
  } finally {
    process.env.NEXTAUTH_SECRET = prevSecret;
    if (prevAuthSecret !== undefined) process.env.AUTH_SECRET = prevAuthSecret;
    else delete process.env.AUTH_SECRET;
    (process.env as any).NODE_ENV = prevNodeEnv;
  }
});

test("auth-security: HMAC session tokens verify, include jti, and reject tampering", () => {
  const token = createSessionToken("user-123", "AGENT", {
    email: "agent@example.com",
  });
  const verified = verifySessionToken(token);
  assert.ok(verified);
  assert.equal(verified.userId, "user-123");
  assert.equal(verified.role, "AGENT");
  assert.ok(verified.jti && verified.jti.length >= 16);

  // Tamper with payload
  const [payloadPart, sigPart] = token.split(".");
  const tamperedPayload = Buffer.from(
    JSON.stringify({ userId: "admin-1", role: "ADMIN", expiresAt: Date.now() + 60000 })
  ).toString("base64url");
  assert.equal(verifySessionToken(`${tamperedPayload}.${sigPart}`), null);
  assert.equal(verifySessionToken(`${payloadPart}.invalid-signature`), null);
  assert.equal(verifySessionToken("not-a-valid-token"), null);
});

test("auth-security: isAdminUser honors ADMIN role and ADMIN_EMAILS", () => {
  const prevAdmins = process.env.ADMIN_EMAILS;
  try {
    process.env.ADMIN_EMAILS = "founder@cribconnect.ng, ops@cribconnect.ng";
    assert.equal(isAdminUser({ role: "ADMIN", email: "someone@example.com" }), true);
    assert.equal(isAdminUser({ role: "AGENT", email: "FOUNDER@cribconnect.ng" }), true);
    assert.equal(isAdminUser({ role: "AGENT", email: "regular@example.com" }), false);
    assert.equal(isAdminUser(null), false);
  } finally {
    if (prevAdmins !== undefined) process.env.ADMIN_EMAILS = prevAdmins;
    else delete process.env.ADMIN_EMAILS;
  }
});

test("auth-security: sanitizeUrl blocks javascript, data, and protocol-relative URLs", () => {
  assert.equal(sanitizeUrl("https://cribconnect-gold.vercel.app/listings"), "https://cribconnect-gold.vercel.app/listings");
  assert.equal(sanitizeUrl("/api/media/img-123"), "/api/media/img-123");
  assert.equal(sanitizeUrl("javascript:alert(1)"), null);
  assert.equal(sanitizeUrl("//evil.example.com/phish"), null);
  assert.equal(sanitizeUrl("data:text/html,<script>alert(1)</script>"), null);
});

test("auth-security: validateMediaMagicBytes accepts genuine headers and rejects spoofed HTML", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const webp = Buffer.from("RIFF0000WEBPextra", "ascii");
  const mp4 = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32]);
  const spoofedHtml = Buffer.from("<html><script>alert(1)</script></html>", "utf8");

  assert.equal(validateMediaMagicBytes(jpeg, "image/jpeg"), true);
  assert.equal(validateMediaMagicBytes(png, "image/png"), true);
  assert.equal(validateMediaMagicBytes(webp, "image/webp"), true);
  assert.equal(validateMediaMagicBytes(mp4, "video/mp4"), true);

  assert.equal(validateMediaMagicBytes(spoofedHtml, "image/jpeg"), false);
  assert.equal(validateMediaMagicBytes(spoofedHtml, "image/png"), false);
  assert.equal(validateMediaMagicBytes(spoofedHtml, "video/mp4"), false);
});

test("auth-security: checkRateLimit enforces threshold", () => {
  const key = `unit-test-${Date.now()}`;
  assert.equal(checkRateLimit(key, 2, 60_000).allowed, true);
  assert.equal(checkRateLimit(key, 2, 60_000).allowed, true);
  assert.equal(checkRateLimit(key, 2, 60_000).allowed, false);
});

test("types: WhatsApp normalization and period formatting", () => {
  assert.equal(formatNigerianWhatsApp("0803 445 2299"), "2348034452299");
  assert.equal(formatNigerianWhatsApp("+2348034452299"), "2348034452299");
  assert.equal(formatNigerianWhatsApp("12345"), "");
  assert.equal(buildWhatsAppUrl("", "hello"), null);
  assert.ok(buildWhatsAppUrl("08034452299", "Hi there")?.startsWith("https://wa.me/2348034452299?text="));

  assert.equal(formatPeriodLabel("per year"), "yr");
  assert.equal(formatPeriodLabel("per semester"), "semester");
  assert.equal(formatPeriodLabel("per month"), "mo");
});

test("types: normalizeVideoTourUrl allows trusted video/embed sources and blocks unsafe URLs", () => {
  assert.equal(normalizeVideoTourUrl("javascript:alert(1)"), null);
  assert.equal(normalizeVideoTourUrl("https://evil.example.com/embed/123"), null);

  assert.deepEqual(normalizeVideoTourUrl("/api/media/vid-abc_123"), {
    kind: "video",
    src: "/api/media/vid-abc_123",
  });
  assert.deepEqual(
    normalizeVideoTourUrl("https://www.youtube.com/watch?v=abcDEF12345"),
    {
      kind: "iframe",
      src: "https://www.youtube-nocookie.com/embed/abcDEF12345",
    }
  );
  assert.deepEqual(normalizeVideoTourUrl("https://youtu.be/abcDEF12345"), {
    kind: "iframe",
    src: "https://www.youtube-nocookie.com/embed/abcDEF12345",
  });
  assert.deepEqual(normalizeVideoTourUrl("https://www.youtube.com/shorts/abcDEF12345"), {
    kind: "iframe",
    src: "https://www.youtube-nocookie.com/embed/abcDEF12345",
  });
  assert.deepEqual(normalizeVideoTourUrl("https://vimeo.com/123456789"), {
    kind: "iframe",
    src: "https://player.vimeo.com/video/123456789",
  });
});

test("data-store: escrow lifecycle, PIN lockout, terminal states, and disbursement gating", async () => {
  // 1. Unverified transfer starts AWAITING_PAYMENT_CONFIRMATION and cannot be released yet
  const pendingEscrow = await addEscrowDepositStore({
    listingId: "listing-1",
    listingTitle: "Choba Self-Con",
    neighborhood: "Choba",
    agentId: "agent-1",
    agentName: "Agent One",
    studentName: "Student One",
    studentEmail: "student1@example.com",
    studentPhone: "08031112222",
    amount: 10000,
    platformFee: 1000,
    agentPayout: 9000,
    paystackReference: "REF-PENDING-1",
    paymentMethod: "BANK_TRANSFER",
    paymentVerified: false,
    holdDurationHours: 48,
    inspectionDate: "2026-12-01",
  });

  assert.match(pendingEscrow.releasePin, /^\d{4}$/);
  assert.ok(pendingEscrow.lookupToken.length >= 32);
  assert.equal(pendingEscrow.status, "AWAITING_PAYMENT_CONFIRMATION");

  const prematureRelease = await updateEscrowStatus(
    pendingEscrow.id,
    "RELEASED_TO_AGENT",
    pendingEscrow.releasePin
  );
  assert.equal(prematureRelease.success, false);

  const prematureDisburse = await markEscrowDisbursed(pendingEscrow.id);
  assert.equal(prematureDisburse.success, false);

  // Confirm payment -> HELD_IN_ESCROW -> release with correct PIN
  const confirmed = await confirmEscrowPayment(pendingEscrow.id);
  assert.equal(confirmed?.status, "HELD_IN_ESCROW");

  const released = await updateEscrowStatus(
    pendingEscrow.id,
    "RELEASED_TO_AGENT",
    pendingEscrow.releasePin
  );
  assert.equal(released.success, true);
  assert.equal(released.escrow?.status, "RELEASED_TO_AGENT");
  assert.equal(released.escrow?.payoutStatus, "APPROVED_FOR_PAYOUT");

  // Terminal-state protection: cannot refund after release
  const refundAfterRelease = await updateEscrowStatus(
    pendingEscrow.id,
    "REFUNDED_TO_STUDENT"
  );
  assert.equal(refundAfterRelease.success, false);

  // Admin disbursement allowed only after RELEASED_TO_AGENT
  const disbursed = await markEscrowDisbursed(pendingEscrow.id);
  assert.equal(disbursed.success, true);
  assert.equal(disbursed.escrow?.payoutStatus, "PAID_TO_BANK");

  // 2. 5-attempt PIN brute-force lockout
  const lockoutEscrow = await addEscrowDepositStore({
    listingId: "listing-2",
    listingTitle: "Aluu Studio",
    neighborhood: "Aluu",
    agentId: "agent-1",
    agentName: "Agent One",
    studentName: "Student Two",
    studentEmail: "student2@example.com",
    studentPhone: "08032223333",
    amount: 10000,
    platformFee: 1000,
    agentPayout: 9000,
    paystackReference: "REF-LOCKOUT-2",
    paymentMethod: "PAYSTACK",
    paymentVerified: true,
    holdDurationHours: 48,
    inspectionDate: "2026-12-01",
  });

  const wrongPin = lockoutEscrow.releasePin === "0000" ? "9999" : "0000";
  for (let i = 0; i < 5; i++) {
    const attempt = await updateEscrowStatus(lockoutEscrow.id, "RELEASED_TO_AGENT", wrongPin);
    assert.equal(attempt.success, false);
  }
  // Even the correct PIN must now be rejected because escrow is locked
  const afterLockout = await updateEscrowStatus(
    lockoutEscrow.id,
    "RELEASED_TO_AGENT",
    lockoutEscrow.releasePin
  );
  assert.equal(afterLockout.success, false);
  assert.match(afterLockout.error || "", /locked/i);

  // 3. Expired 48h window rejects release even with valid PIN
  const expiredEscrow = await addEscrowDepositStore({
    listingId: "listing-3",
    listingTitle: "Ozuoba Flat",
    neighborhood: "Ozuoba",
    agentId: "agent-1",
    agentName: "Agent One",
    studentName: "Student Three",
    studentEmail: "student3@example.com",
    studentPhone: "08033334444",
    amount: 10000,
    platformFee: 1000,
    agentPayout: 9000,
    paystackReference: "REF-EXPIRED-3",
    paymentMethod: "PAYSTACK",
    paymentVerified: true,
    holdDurationHours: -1,
    inspectionDate: "2026-12-01",
  });
  const expiredAttempt = await updateEscrowStatus(
    expiredEscrow.id,
    "RELEASED_TO_AGENT",
    expiredEscrow.releasePin
  );
  assert.equal(expiredAttempt.success, false);
  assert.match(expiredAttempt.error || "", /expired/i);
});

test("data-store: deleteListingById and token revocation", async () => {
  assert.equal(await deleteListingById("non-existent-id"), false);

  const created = await addListingStore({
    agentId: "agent-test-1",
    agentName: "Test Agent",
    agentPhone: "08030001111",
    agentWhatsapp: "2348030001111",
    agentAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Test",
    agentVerified: true,
    agencyName: "Test Homes",
    title: "Test Room Choba",
    description: "Clean room for testing deletion behavior",
    price: 300000,
    agencyFee: 30000,
    cautionFee: 20000,
    period: "per year",
    propertyType: "SELF_CONTAIN",
    bedrooms: 1,
    bathrooms: 1,
    address: "Choba Main Gate",
    neighborhood: "Choba",
    city: "Port Harcourt",
    universityNearby: "University of Port Harcourt (UNIPORT)",
    distanceToCampusMinutes: 5,
    distanceDescription: "5 mins walk",
    latitude: 4.8984,
    longitude: 6.9315,
    photos: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"],
    videoTourUrl: null,
    amenities: ["Borehole Water"],
    isFeatured: false,
  });

  assert.equal(await deleteListingById(created.id), true);
  assert.equal(await deleteListingById(created.id), false);

  const jti = `jti-test-${Date.now()}`;
  assert.equal(await isTokenRevoked(jti), false);
  await revokeTokenId(jti, Date.now() + 60_000);
  assert.equal(await isTokenRevoked(jti), true);

  const expiredJti = `jti-expired-${Date.now()}`;
  await revokeTokenId(expiredJti, Date.now() - 1000);
  assert.equal(await isTokenRevoked(expiredJti), false);
});
