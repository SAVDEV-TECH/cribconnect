// lib/data-store.ts
// Persistent PostgreSQL (StoreRecord + MediaAsset) data store for CribConnect.
// Zero demo products or fake personas — stores only real user data.

import crypto from "crypto";
import { prisma } from "./prisma";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  generateSecurePin,
  generateSecureToken,
  isAllowedMediaMime,
  sanitizeUrl,
  timingSafeStringEqual,
  validateMediaMagicBytes,
} from "./auth-security";

export interface Listing {
  id: string;
  agentId: string;
  agentName: string;
  agentPhone: string;
  agentWhatsapp: string;
  agentAvatar: string;
  agentVerified: boolean;
  agencyName: string;
  title: string;
  description: string;
  price: number;
  period: string; // "per year" | "per semester"
  propertyType: string; // "SELF_CONTAIN" | "ONE_BED" | "TWO_BED" | "STUDIO"
  bedrooms: number;
  bathrooms: number;
  address: string;
  neighborhood: string;
  city: string;
  universityNearby: string;
  distanceToCampusMinutes: number;
  distanceDescription: string;
  latitude: number;
  longitude: number;
  photos: string[];
  videoTourUrl?: string | null;
  amenities: string[];
  isFeatured: boolean;
  viewsCount: number;
  whatsappClicksCount?: number;
  isAvailable: boolean;
  createdAt: string;
  cautionFee: number;
  agencyFee: number;
}

export interface HousingRequest {
  id: string;
  studentId?: string;
  tenantName: string;
  tenantPhone: string;
  tenantWhatsapp: string;
  tenantSchool: string;
  title: string;
  description: string;
  targetUniversity: string;
  preferredArea: string;
  maxBudget: number;
  propertyType: string;
  moveInDate: string;
  status: "OPEN" | "MATCHED" | "CLOSED";
  createdAt: string;
  responsesCount: number;
}

export interface StoredProposal {
  id: string;
  requestId: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  agentPhone: string;
  agentWhatsapp: string;
  agentVerified: boolean;
  agencyName: string;
  listingId?: string | null;
  pitchMessage: string;
  proposedPrice: number;
  currency: string;
  period: string;
  agencyFee: number;
  cautionFee: number;
  totalUpfront: number;
  status: "SUBMITTED" | "SHORTLISTED" | "ACCEPTED" | "DECLINED";
  createdAt: string;
}

export interface StoredMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: string;
  recipientId: string;
  recipientName?: string;
  requestId?: string | null;
  listingId?: string | null;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface StoredReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  targetType: "LISTING" | "AGENT";
  targetId: string;
  reason: string;
  details?: string | null;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantRentalRecord {
  id: string;
  tenantName: string;
  propertyTitle: string;
  neighborhood: string;
  date: string;
  amount: number;
  agencyFeeTotal?: number;
  platformCommission?: number; // 20% of 10% Agency Fee
  agentNetCommission?: number; // 80% of 10% Agency Fee
  payoutStatus?: "PENDING_VERIFICATION" | "APPROVED_FOR_PAYOUT" | "PAID_TO_BANK";
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  role: "AGENT" | "LANDLORD" | "TENANT" | "STUDENT" | "ADMIN";
  avatar: string;
  agencyName?: string;
  bio?: string;
  specializations?: string;
  coverageAreas?: string[];
  passwordSalt: string;
  passwordHash: string;
  isVerified: boolean;
  verificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  verificationNotes?: string;
  idDocumentUrl?: string;
  tier?: "FREE" | "PRO";
  featuredListingCredits?: number;
  badges?: string[];
  ninOrLicense?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  tenantsHousedCount: number;
  rentalsHistory: TenantRentalRecord[];
  createdAt: string;
}

export interface EscrowDeposit {
  id: string;
  lookupToken: string;
  listingId: string;
  listingTitle: string;
  neighborhood: string;
  agentId?: string;
  agentName: string;
  agentPhone?: string;
  agentWhatsapp?: string;
  studentUserId?: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  amount: number;
  platformFee: number;
  agentPayout: number;
  releasePin: string;
  pinAttempts: number;
  pinLocked?: boolean;
  paystackReference: string;
  paymentMethod?: "PAYSTACK" | "BANK_TRANSFER";
  paymentVerified?: boolean;
  senderBankName?: string;
  senderAccountName?: string;
  transferSessionId?: string;
  status:
    | "AWAITING_PAYMENT_CONFIRMATION"
    | "HELD_IN_ESCROW"
    | "RELEASED_TO_AGENT"
    | "REFUNDED_TO_STUDENT"
    | "DISPUTED";
  payoutStatus?: "LOCKED" | "APPROVED_FOR_PAYOUT" | "PAID_TO_BANK" | "REFUNDED";
  paidOutAt?: string;
  holdDurationHours: number;
  inspectionDate: string;
  inspectionTime?: string;
  expiresAt: string;
  createdAt: string;
  disputeReason?: string;
}

export interface InspectionBooking {
  id: string;
  listingId: string;
  listingTitle: string;
  agentId?: string;
  agentName?: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  preferredDate: string;
  preferredTime?: string;
  message: string;
  status: "PENDING" | "CONFIRMED" | "DECLINED" | "COMPLETED";
  createdAt: string;
}

interface RevokedTokenRecord {
  id: string;
  expiresAt: number;
}

export const MAX_ESCROW_PIN_ATTEMPTS = 5;

export const INITIAL_LISTINGS: Listing[] = [];
export const INITIAL_REQUESTS: HousingRequest[] = [];
export const INITIAL_BOOKINGS: InspectionBooking[] = [];
export const INITIAL_ESCROWS: EscrowDeposit[] = [];
export const INITIAL_USERS: StoredUser[] = [];

// Local memory cache used ONLY as fallback when no DB is configured or on transient DB error
let activeListings: Listing[] = [];
let activeRequests: HousingRequest[] = [];
let activeBookings: InspectionBooking[] = [];
let activeEscrows: EscrowDeposit[] = [];
let activeUsers: StoredUser[] = [];
let activeProposals: StoredProposal[] = [];
let activeMessages: StoredMessage[] = [];
let activeReports: StoredReport[] = [];
const revokedTokenCache = new Map<string, number>();

function hasDatabaseConfigured(): boolean {
  return Boolean((process.env.POSTGRES_URL || process.env.DATABASE_URL || "").trim());
}

export async function offloadDataUrlToMediaAsset(url?: string | null): Promise<string> {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  if (!trimmed.startsWith("data:")) {
    const safe = sanitizeUrl(trimmed);
    return safe || "";
  }

  const match = trimmed.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw new Error("Invalid media data URL format.");
  }

  const mimeType = match[1].toLowerCase();
  const base64Payload = match[2];

  if (!isAllowedMediaMime(mimeType)) {
    throw new Error(`Disallowed media MIME type: ${mimeType}`);
  }

  const binaryBuffer = Buffer.from(base64Payload, "base64");
  const maxBytes = ALLOWED_VIDEO_TYPES.has(mimeType)
    ? MAX_VIDEO_SIZE_BYTES
    : ALLOWED_IMAGE_TYPES.has(mimeType)
    ? MAX_IMAGE_SIZE_BYTES
    : 0;

  if (binaryBuffer.length === 0 || binaryBuffer.length > maxBytes) {
    throw new Error("Media file exceeds allowed size limit.");
  }

  if (!validateMediaMagicBytes(binaryBuffer, mimeType)) {
    throw new Error("Media file contents do not match declared MIME type.");
  }

  const prefix = mimeType.startsWith("video/") ? "vid" : "img";
  const id = `${prefix}-${crypto.randomUUID()}`;

  if (hasDatabaseConfigured()) {
    await prisma.mediaAsset.create({
      data: {
        id,
        mimeType,
        data: base64Payload,
        sizeBytes: binaryBuffer.length,
      },
    });
    return `/api/media/${id}`;
  }

  return trimmed;
}

async function normalizeListingMedia<T extends Partial<Listing>>(listing: T): Promise<T> {
  const photos = Array.isArray(listing.photos) ? listing.photos : [];
  const normalizedPhotos: string[] = [];

  for (const p of photos.slice(0, 12)) {
    if (typeof p !== "string" || !p.trim()) continue;
    const processed = await offloadDataUrlToMediaAsset(p);
    if (processed) normalizedPhotos.push(processed);
  }

  let normalizedVideo = listing.videoTourUrl ?? null;
  if (typeof listing.videoTourUrl === "string" && listing.videoTourUrl.trim()) {
    normalizedVideo = listing.videoTourUrl.startsWith("data:")
      ? await offloadDataUrlToMediaAsset(listing.videoTourUrl)
      : sanitizeUrl(listing.videoTourUrl);
  }

  return {
    ...listing,
    photos: normalizedPhotos,
    videoTourUrl: normalizedVideo,
  };
}

async function upsertRecordInDb<T extends { id: string }>(
  collection: string,
  item: T
): Promise<void> {
  if (!hasDatabaseConfigured()) return;
  await prisma.storeRecord.upsert({
    where: {
      collection_id: {
        collection,
        id: item.id,
      },
    },
    update: {
      data: item as any,
    },
    create: {
      collection,
      id: item.id,
      data: item as any,
    },
  });
}

async function deleteRecordFromDb(collection: string, id: string): Promise<boolean> {
  if (!hasDatabaseConfigured()) return true;
  const result = await prisma.storeRecord.deleteMany({
    where: { collection, id },
  });
  return result.count > 0;
}

async function loadFromDb<T extends { id: string }>(
  key: string,
  memoryFallback: T[]
): Promise<T[]> {
  if (!hasDatabaseConfigured()) {
    return memoryFallback;
  }

  try {
    // 1. Read from dedicated indexed StoreRecord rows
    const rows = await prisma.storeRecord.findMany({
      where: { collection: key },
      orderBy: { createdAt: "desc" },
    });

    if (rows.length > 0) {
      return rows.map((r) => r.data as unknown as T);
    }

    // 2. One-time migration from legacy AppState JSON array if present
    const legacyRow = await prisma.appState.findUnique({ where: { key } });
    if (legacyRow && Array.isArray(legacyRow.data) && legacyRow.data.length > 0) {
      const legacyItems = legacyRow.data as unknown as T[];
      const migratedItems: T[] = [];

      for (const rawItem of legacyItems) {
        if (!rawItem || !rawItem.id) continue;
        let item = rawItem;
        if (key === "listings") {
          try {
            item = (await normalizeListingMedia(rawItem as any)) as unknown as T;
          } catch {
            // Skip unsafe media payloads during migration
          }
        }
        migratedItems.push(item);
        await upsertRecordInDb(key, item);
      }

      await prisma.appState.update({
        where: { key },
        data: { data: [] as any },
      });

      return migratedItems;
    }

    // Collection is genuinely empty in Postgres — do NOT resurrect stale memory cache!
    return [];
  } catch (err) {
    console.error(`[data-store] Failed to load collection "${key}" from Postgres:`, err);
    return memoryFallback;
  }
}

async function getRecordById<T extends { id: string }>(
  collection: string,
  id: string,
  fallbackLoader: () => Promise<T[]>
): Promise<T | undefined> {
  if (hasDatabaseConfigured()) {
    try {
      const row = await prisma.storeRecord.findUnique({
        where: { collection_id: { collection, id } },
      });
      if (row && row.data) {
        return row.data as unknown as T;
      }
      return undefined;
    } catch (err) {
      console.error(`[data-store] Failed to fetch "${id}" from "${collection}":`, err);
    }
  }
  const current = await fallbackLoader();
  return current.find((item) => item.id === id);
}

// --- Token Revocation Store ---

export async function revokeTokenId(jti: string, expiresAt: number): Promise<void> {
  if (!jti) return;
  revokedTokenCache.set(jti, expiresAt);
  try {
    await upsertRecordInDb<RevokedTokenRecord>("revoked_tokens", { id: jti, expiresAt });
  } catch (err) {
    console.error("[data-store] Failed to persist revoked token:", err);
  }
}

export async function isTokenRevoked(jti?: string): Promise<boolean> {
  if (!jti) return false;
  const cachedExp = revokedTokenCache.get(jti);
  if (cachedExp !== undefined) {
    if (Date.now() > cachedExp) {
      revokedTokenCache.delete(jti);
      return false;
    }
    return true;
  }

  if (!hasDatabaseConfigured()) return false;

  try {
    const row = await prisma.storeRecord.findUnique({
      where: { collection_id: { collection: "revoked_tokens", id: jti } },
    });
    if (!row || !row.data) return false;
    const record = row.data as unknown as RevokedTokenRecord;
    if (Date.now() > record.expiresAt) {
      await deleteRecordFromDb("revoked_tokens", jti).catch(() => {});
      return false;
    }
    revokedTokenCache.set(jti, record.expiresAt);
    return true;
  } catch {
    return false;
  }
}

// --- Listings Store ---

export async function getListingsStore(): Promise<Listing[]> {
  activeListings = await loadFromDb<Listing>("listings", activeListings);
  return activeListings;
}

export async function addListingStore(
  listing: Omit<Listing, "id" | "createdAt" | "viewsCount" | "isAvailable">
): Promise<Listing> {
  const cleanListing = await normalizeListingMedia(listing);
  const newListing: Listing = {
    ...cleanListing,
    id: `crib-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString().split("T")[0],
    viewsCount: 0,
    whatsappClicksCount: 0,
    isAvailable: true,
  };
  await upsertRecordInDb("listings", newListing);
  activeListings = [newListing, ...activeListings.filter((l) => l.id !== newListing.id)];
  return newListing;
}

export async function getListingById(id: string): Promise<Listing | undefined> {
  return getRecordById<Listing>("listings", id, getListingsStore);
}

export async function updateListingStore(
  id: string,
  updates: Partial<Listing>
): Promise<Listing | undefined> {
  const existing = await getListingById(id);
  if (!existing) return undefined;
  const cleanUpdates = await normalizeListingMedia(updates);
  const updated: Listing = { ...existing, ...cleanUpdates, id: existing.id };
  await upsertRecordInDb("listings", updated);
  activeListings = activeListings.map((l) => (l.id === id ? updated : l));
  return updated;
}

export async function deleteListingById(id: string): Promise<boolean> {
  const existing = await getListingById(id);
  if (!existing) return false;

  await deleteRecordFromDb("listings", id);
  activeListings = activeListings.filter((l) => l.id !== id);
  return true;
}

export async function incrementListingMetric(
  id: string,
  metric: "views" | "whatsapp"
): Promise<Listing | undefined> {
  const existing = await getListingById(id);
  if (!existing) return undefined;

  const updated: Listing = {
    ...existing,
    viewsCount: metric === "views" ? (existing.viewsCount || 0) + 1 : existing.viewsCount || 0,
    whatsappClicksCount:
      metric === "whatsapp"
        ? (existing.whatsappClicksCount || 0) + 1
        : existing.whatsappClicksCount || 0,
  };
  await upsertRecordInDb("listings", updated);
  activeListings = activeListings.map((l) => (l.id === id ? updated : l));
  return updated;
}

// --- Housing Requests Store ---

export async function getRequestsStore(): Promise<HousingRequest[]> {
  activeRequests = await loadFromDb<HousingRequest>("requests", activeRequests);
  return activeRequests;
}

export async function getRequestById(id: string): Promise<HousingRequest | undefined> {
  return getRecordById<HousingRequest>("requests", id, getRequestsStore);
}

export async function addRequestStore(
  request: Omit<HousingRequest, "id" | "createdAt" | "status" | "responsesCount">
): Promise<HousingRequest> {
  const newRequest: HousingRequest = {
    ...request,
    id: `req-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString().split("T")[0],
    status: "OPEN",
    responsesCount: 0,
  };
  await upsertRecordInDb("requests", newRequest);
  activeRequests = [newRequest, ...activeRequests.filter((r) => r.id !== newRequest.id)];
  return newRequest;
}

export async function updateRequestStore(
  id: string,
  updates: Partial<HousingRequest>
): Promise<HousingRequest | undefined> {
  const existing = await getRequestById(id);
  if (!existing) return undefined;
  const updated: HousingRequest = { ...existing, ...updates, id: existing.id };
  await upsertRecordInDb("requests", updated);
  activeRequests = activeRequests.map((r) => (r.id === id ? updated : r));
  return updated;
}

// --- Proposals Store ---

export async function getProposalsStore(): Promise<StoredProposal[]> {
  activeProposals = await loadFromDb<StoredProposal>("proposals", activeProposals);
  return activeProposals;
}

export async function getProposalById(id: string): Promise<StoredProposal | undefined> {
  return getRecordById<StoredProposal>("proposals", id, getProposalsStore);
}

export async function getProposalsByRequestId(requestId: string): Promise<StoredProposal[]> {
  const all = await getProposalsStore();
  return all.filter((p) => p.requestId === requestId);
}

export async function addProposalStore(
  proposal: Omit<StoredProposal, "id" | "createdAt" | "status">
): Promise<StoredProposal> {
  const newProposal: StoredProposal = {
    ...proposal,
    id: `prop-${crypto.randomUUID()}`,
    status: "SUBMITTED",
    createdAt: new Date().toISOString(),
  };
  await upsertRecordInDb("proposals", newProposal);
  activeProposals = [newProposal, ...activeProposals.filter((p) => p.id !== newProposal.id)];

  const parentReq = await getRequestById(proposal.requestId);
  if (parentReq) {
    await updateRequestStore(parentReq.id, {
      responsesCount: (parentReq.responsesCount || 0) + 1,
    });
  }

  return newProposal;
}

export async function updateProposalStatus(
  id: string,
  status: StoredProposal["status"]
): Promise<StoredProposal | undefined> {
  const existing = await getProposalById(id);
  if (!existing) return undefined;
  const updated: StoredProposal = { ...existing, status };
  await upsertRecordInDb("proposals", updated);
  activeProposals = activeProposals.map((p) => (p.id === id ? updated : p));
  return updated;
}

// --- Messages Store ---

export async function getMessagesStore(): Promise<StoredMessage[]> {
  activeMessages = await loadFromDb<StoredMessage>("messages", activeMessages);
  return activeMessages;
}

export async function getMessagesForUser(userId: string): Promise<StoredMessage[]> {
  const all = await getMessagesStore();
  return all.filter((m) => m.senderId === userId || m.recipientId === userId);
}

export async function addMessageStore(
  message: Omit<StoredMessage, "id" | "createdAt" | "isRead">
): Promise<StoredMessage> {
  const newMsg: StoredMessage = {
    ...message,
    id: `msg-${crypto.randomUUID()}`,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  await upsertRecordInDb("messages", newMsg);
  activeMessages = [newMsg, ...activeMessages.filter((m) => m.id !== newMsg.id)];
  return newMsg;
}

// --- Reports Store ---

export async function getReportsStore(): Promise<StoredReport[]> {
  activeReports = await loadFromDb<StoredReport>("reports", activeReports);
  return activeReports;
}

export async function getReportById(id: string): Promise<StoredReport | undefined> {
  return getRecordById<StoredReport>("reports", id, getReportsStore);
}

export async function addReportStore(
  report: Omit<StoredReport, "id" | "status" | "createdAt" | "updatedAt">
): Promise<StoredReport> {
  const now = new Date().toISOString();
  const newReport: StoredReport = {
    ...report,
    id: `rep-${crypto.randomUUID()}`,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  };
  await upsertRecordInDb("reports", newReport);
  activeReports = [newReport, ...activeReports.filter((r) => r.id !== newReport.id)];
  return newReport;
}

export async function updateReportStore(
  id: string,
  updates: { status: StoredReport["status"]; adminNotes?: string | null }
): Promise<StoredReport | undefined> {
  const existing = await getReportById(id);
  if (!existing) return undefined;
  const updated: StoredReport = {
    ...existing,
    status: updates.status,
    adminNotes: updates.adminNotes ?? existing.adminNotes ?? null,
    updatedAt: new Date().toISOString(),
  };
  await upsertRecordInDb("reports", updated);
  activeReports = activeReports.map((r) => (r.id === id ? updated : r));
  return updated;
}

// --- Inspection Bookings Store ---

export async function getBookingsStore(): Promise<InspectionBooking[]> {
  activeBookings = await loadFromDb<InspectionBooking>("bookings", activeBookings);
  return activeBookings;
}

export async function getBookingById(id: string): Promise<InspectionBooking | undefined> {
  return getRecordById<InspectionBooking>("bookings", id, getBookingsStore);
}

export async function addBookingStore(
  booking: Omit<InspectionBooking, "id" | "createdAt" | "status">
): Promise<InspectionBooking> {
  const newBooking: InspectionBooking = {
    ...booking,
    id: `book-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    status: "PENDING",
  };
  await upsertRecordInDb("bookings", newBooking);
  activeBookings = [newBooking, ...activeBookings.filter((b) => b.id !== newBooking.id)];
  return newBooking;
}

export async function getBookingsByAgent(agentId: string): Promise<InspectionBooking[]> {
  const [bookings, listings] = await Promise.all([getBookingsStore(), getListingsStore()]);
  const ownedListingIds = new Set(
    listings.filter((l) => l.agentId === agentId).map((l) => l.id)
  );
  return bookings.filter(
    (b) => b.agentId === agentId || ownedListingIds.has(b.listingId)
  );
}

export async function updateBookingStatus(
  id: string,
  status: "PENDING" | "CONFIRMED" | "DECLINED" | "COMPLETED"
): Promise<InspectionBooking | undefined> {
  const existing = await getBookingById(id);
  if (!existing) return undefined;
  const updated: InspectionBooking = { ...existing, status };
  await upsertRecordInDb("bookings", updated);
  activeBookings = activeBookings.map((b) => (b.id === id ? updated : b));
  return updated;
}

// --- Escrow Deposits Store ---

export async function getEscrowDepositsStore(): Promise<EscrowDeposit[]> {
  activeEscrows = await loadFromDb<EscrowDeposit>("escrows", activeEscrows);
  return activeEscrows;
}

export async function getEscrowById(id: string): Promise<EscrowDeposit | undefined> {
  return getRecordById<EscrowDeposit>("escrows", id, getEscrowDepositsStore);
}

export async function getEscrowByReference(reference: string): Promise<EscrowDeposit | undefined> {
  const normalized = reference.trim().toLowerCase();
  const current = await getEscrowDepositsStore();
  return current.find(
    (e) =>
      e.paystackReference.toLowerCase() === normalized ||
      (e.transferSessionId && e.transferSessionId.toLowerCase() === normalized)
  );
}

export async function getActiveEscrowForListing(
  listingId: string
): Promise<EscrowDeposit | undefined> {
  const current = await getEscrowDepositsStore();
  const now = Date.now();
  return current.find((e) => {
    if (e.listingId !== listingId) return false;
    if (e.status !== "HELD_IN_ESCROW") return false;
    const expiresAtMs = new Date(e.expiresAt).getTime();
    return Number.isFinite(expiresAtMs) && expiresAtMs > now;
  });
}

export async function getEscrowsByListingId(listingId: string): Promise<EscrowDeposit[]> {
  const current = await getEscrowDepositsStore();
  return current.filter((e) => e.listingId === listingId);
}

export async function getEscrowsByAgent(agentId: string): Promise<EscrowDeposit[]> {
  const [escrows, listings] = await Promise.all([getEscrowDepositsStore(), getListingsStore()]);
  const ownedListingIds = new Set(
    listings.filter((l) => l.agentId === agentId).map((l) => l.id)
  );
  return escrows.filter(
    (e) => e.agentId === agentId || ownedListingIds.has(e.listingId)
  );
}

export async function getEscrowsByStudent(
  studentEmail?: string,
  studentUserId?: string
): Promise<EscrowDeposit[]> {
  const current = await getEscrowDepositsStore();
  const normalizedEmail = studentEmail?.trim().toLowerCase();
  return current.filter((e) => {
    if (studentUserId && e.studentUserId === studentUserId) return true;
    if (normalizedEmail && e.studentEmail.toLowerCase() === normalizedEmail) return true;
    return false;
  });
}

export async function addEscrowDepositStore(
  deposit: Omit<
    EscrowDeposit,
    "id" | "lookupToken" | "createdAt" | "status" | "releasePin" | "pinAttempts" | "expiresAt"
  > & {
    initialStatus?: "AWAITING_PAYMENT_CONFIRMATION" | "HELD_IN_ESCROW";
  }
): Promise<EscrowDeposit> {
  const releasePin = generateSecurePin();
  const lookupToken = generateSecureToken(24);
  const holdHours = deposit.holdDurationHours || 48;
  const expiresAt = new Date(Date.now() + holdHours * 3600 * 1000).toISOString();

  const initialStatus =
    deposit.initialStatus ||
    (deposit.paymentVerified === false ? "AWAITING_PAYMENT_CONFIRMATION" : "HELD_IN_ESCROW");

  const newEscrow: EscrowDeposit = {
    ...deposit,
    id: `escrow-${crypto.randomUUID()}`,
    lookupToken,
    releasePin,
    pinAttempts: 0,
    pinLocked: false,
    status: initialStatus,
    payoutStatus: "LOCKED",
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  await upsertRecordInDb("escrows", newEscrow);
  activeEscrows = [newEscrow, ...activeEscrows.filter((e) => e.id !== newEscrow.id)];
  return newEscrow;
}

export async function confirmEscrowPayment(id: string): Promise<EscrowDeposit | undefined> {
  const existing = await getEscrowById(id);
  if (!existing) return undefined;
  if (existing.status === "RELEASED_TO_AGENT" || existing.status === "REFUNDED_TO_STUDENT") {
    return existing;
  }

  const holdHours = existing.holdDurationHours || 48;
  const updated: EscrowDeposit = {
    ...existing,
    paymentVerified: true,
    status: existing.status === "AWAITING_PAYMENT_CONFIRMATION" ? "HELD_IN_ESCROW" : existing.status,
    // Start 48h countdown when payment is actually confirmed
    expiresAt:
      existing.status === "AWAITING_PAYMENT_CONFIRMATION"
        ? new Date(Date.now() + holdHours * 3600 * 1000).toISOString()
        : existing.expiresAt,
  };
  await upsertRecordInDb("escrows", updated);
  activeEscrows = activeEscrows.map((e) => (e.id === id ? updated : e));
  return updated;
}

export async function updateEscrowStatus(
  id: string,
  status:
    | "AWAITING_PAYMENT_CONFIRMATION"
    | "HELD_IN_ESCROW"
    | "RELEASED_TO_AGENT"
    | "REFUNDED_TO_STUDENT"
    | "DISPUTED",
  pin?: string,
  reason?: string
): Promise<{ success: boolean; error?: string; escrow?: EscrowDeposit }> {
  const escrow = await getEscrowById(id);
  if (!escrow) {
    return { success: false, error: "Escrow record not found." };
  }

  // Prevent transitions out of terminal states
  if (escrow.status === "RELEASED_TO_AGENT" || escrow.status === "REFUNDED_TO_STUDENT") {
    return {
      success: false,
      error: `This escrow deposit is already finalized (${escrow.status}).`,
    };
  }

  if (status === "RELEASED_TO_AGENT") {
    if (escrow.status !== "HELD_IN_ESCROW" || escrow.paymentVerified === false) {
      return {
        success: false,
        error:
          "Cannot release funds yet: payment must be confirmed and held in Escrow before PIN release.",
      };
    }

    if (Date.now() > new Date(escrow.expiresAt).getTime()) {
      return {
        success: false,
        error:
          "This 48-hour escrow holding window has expired. Please request a refund or contact support.",
      };
    }

    if (escrow.pinLocked || (escrow.pinAttempts || 0) >= MAX_ESCROW_PIN_ATTEMPTS) {
      return {
        success: false,
        error:
          "Too many incorrect PIN attempts. This escrow has been locked for security review.",
      };
    }

    const cleanedPin = typeof pin === "string" ? pin.trim() : "";
    if (!cleanedPin || !timingSafeStringEqual(cleanedPin, escrow.releasePin)) {
      const nextAttempts = (escrow.pinAttempts || 0) + 1;
      const locked = nextAttempts >= MAX_ESCROW_PIN_ATTEMPTS;
      const failedUpdate: EscrowDeposit = {
        ...escrow,
        pinAttempts: nextAttempts,
        pinLocked: locked,
      };
      await upsertRecordInDb("escrows", failedUpdate);
      activeEscrows = activeEscrows.map((e) => (e.id === id ? failedUpdate : e));
      return {
        success: false,
        error: locked
          ? "Maximum PIN attempts exceeded. Escrow locked for security review."
          : `Invalid Inspection Release PIN. ${
              MAX_ESCROW_PIN_ATTEMPTS - nextAttempts
            } attempt(s) remaining.`,
      };
    }
  }

  const updated: EscrowDeposit = {
    ...escrow,
    status,
    payoutStatus:
      status === "RELEASED_TO_AGENT"
        ? "APPROVED_FOR_PAYOUT"
        : status === "REFUNDED_TO_STUDENT"
        ? "REFUNDED"
        : escrow.payoutStatus,
    disputeReason: reason || escrow.disputeReason,
  };

  await upsertRecordInDb("escrows", updated);
  activeEscrows = activeEscrows.map((e) => (e.id === id ? updated : e));
  return { success: true, escrow: updated };
}

export async function markEscrowDisbursed(
  id: string
): Promise<{ success: boolean; error?: string; escrow?: EscrowDeposit }> {
  const escrow = await getEscrowById(id);
  if (!escrow) {
    return { success: false, error: "Escrow record not found." };
  }
  if (escrow.status !== "RELEASED_TO_AGENT") {
    return {
      success: false,
      error: "Only escrows released by student PIN can be marked as paid to bank.",
    };
  }
  const updated: EscrowDeposit = {
    ...escrow,
    payoutStatus: "PAID_TO_BANK",
    paidOutAt: new Date().toISOString(),
  };
  await upsertRecordInDb("escrows", updated);
  activeEscrows = activeEscrows.map((e) => (e.id === id ? updated : e));
  return { success: true, escrow: updated };
}

// --- User Authentication Store ---

export async function getUsersStore(): Promise<StoredUser[]> {
  activeUsers = await loadFromDb<StoredUser>("users", activeUsers);
  return activeUsers;
}

export async function getUserByEmail(email: string): Promise<StoredUser | undefined> {
  const current = await getUsersStore();
  const normalized = email.trim().toLowerCase();
  return current.find((u) => u.email.toLowerCase() === normalized);
}

export async function getUserById(id: string): Promise<StoredUser | undefined> {
  return getRecordById<StoredUser>("users", id, getUsersStore);
}

export async function createUser(
  user: Omit<StoredUser, "id" | "createdAt" | "tenantsHousedCount" | "rentalsHistory"> & {
    id?: string;
  }
): Promise<StoredUser> {
  const newUser: StoredUser = {
    ...user,
    id: user.id || `user-${crypto.randomUUID()}`,
    isVerified: Boolean(user.isVerified),
    verificationStatus: user.verificationStatus || (user.isVerified ? "VERIFIED" : "UNVERIFIED"),
    tier: user.tier || "FREE",
    featuredListingCredits: user.featuredListingCredits || 0,
    badges: user.badges || [],
    tenantsHousedCount: 0,
    rentalsHistory: [],
    createdAt: new Date().toISOString(),
  };
  await upsertRecordInDb("users", newUser);
  activeUsers = [newUser, ...activeUsers.filter((u) => u.id !== newUser.id)];
  return newUser;
}

export async function updateUser(
  id: string,
  updates: Partial<StoredUser>
): Promise<StoredUser | undefined> {
  const existing = await getUserById(id);
  if (!existing) return undefined;

  const updated: StoredUser = { ...existing, ...updates, id: existing.id };
  await upsertRecordInDb("users", updated);
  activeUsers = activeUsers.map((u) => (u.id === id ? updated : u));
  return updated;
}

export async function recordRentalSuccess(
  userId: string,
  record: Omit<TenantRentalRecord, "id">
): Promise<StoredUser | undefined> {
  const existing = await getUserById(userId);
  if (!existing) return undefined;

  const cleanAmount = Math.max(0, Math.round(Number(record.amount) || 0));
  const agencyFeeTotal = Math.round(cleanAmount * 0.1);
  const platformCommission = Math.round(agencyFeeTotal * 0.2); // 20% platform cut of 10% agency fee
  const agentNetCommission = agencyFeeTotal - platformCommission; // 80% net commission to Agent/Owner

  const newRecord: TenantRentalRecord = {
    ...record,
    amount: cleanAmount,
    id: `rent-${crypto.randomUUID()}`,
    agencyFeeTotal,
    platformCommission,
    agentNetCommission,
    // Requires admin review before payout approval
    payoutStatus: "PENDING_VERIFICATION",
  };

  const updated: StoredUser = {
    ...existing,
    tenantsHousedCount: (existing.tenantsHousedCount || 0) + 1,
    rentalsHistory: [newRecord, ...(existing.rentalsHistory || [])],
  };

  await upsertRecordInDb("users", updated);
  activeUsers = activeUsers.map((u) => (u.id === userId ? updated : u));
  return updated;
}

export async function markRentalDisbursed(
  userId: string,
  rentalId: string
): Promise<boolean> {
  const existing = await getUserById(userId);
  if (!existing || !existing.rentalsHistory) return false;
  const idx = existing.rentalsHistory.findIndex((r) => r.id === rentalId);
  if (idx === -1) return false;

  const nextHistory = [...existing.rentalsHistory];
  nextHistory[idx] = { ...nextHistory[idx], payoutStatus: "PAID_TO_BANK" };
  const updated: StoredUser = { ...existing, rentalsHistory: nextHistory };

  await upsertRecordInDb("users", updated);
  activeUsers = activeUsers.map((u) => (u.id === userId ? updated : u));
  return true;
}
