// lib/data-store.ts
// Persistent PostgreSQL + in-memory data store for CribConnect.
// Zero demo products or fake personas — stores only real user-uploaded listings, requests, bookings, escrows, and accounts.

import { prisma } from "@/lib/prisma";

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
  payoutStatus?: "APPROVED_FOR_PAYOUT" | "PAID_TO_BANK";
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  role: "AGENT" | "LANDLORD" | "TENANT" | "ADMIN";
  avatar: string;
  agencyName?: string;
  bio?: string;
  specializations?: string;
  passwordSalt: string;
  passwordHash: string;
  isVerified: boolean;
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
  listingId: string;
  listingTitle: string;
  neighborhood: string;
  agentId?: string;
  agentName: string;
  agentPhone?: string;
  agentWhatsapp?: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  amount: number;
  platformFee: number;
  agentPayout: number;
  releasePin: string;
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

// Empty initial stores — no demo products, no fake requests, no fake accounts
export const INITIAL_LISTINGS: Listing[] = [];
export const INITIAL_REQUESTS: HousingRequest[] = [];
export const INITIAL_BOOKINGS: InspectionBooking[] = [];
export const INITIAL_ESCROWS: EscrowDeposit[] = [];
export const INITIAL_USERS: StoredUser[] = [];

// Local memory cache synced with indexed PostgreSQL StoreRecord + MediaAsset tables
let activeListings: Listing[] = [];
let activeRequests: HousingRequest[] = [];
let activeBookings: InspectionBooking[] = [];
let activeEscrows: EscrowDeposit[] = [];
let activeUsers: StoredUser[] = [];

async function offloadDataUrlToMediaAsset(url?: string | null): Promise<string> {
  if (!url || typeof url !== "string") return "";
  if (!url.startsWith("data:")) return url;

  const match = url.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!match) return url;

  const mimeType = match[1].toLowerCase();
  const base64Payload = match[2];
  const prefix = mimeType.startsWith("video/") ? "vid" : "img";
  const id = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const sizeBytes = Math.round((base64Payload.length * 3) / 4);

  try {
    await (prisma as any).mediaAsset.create({
      data: {
        id,
        mimeType,
        data: base64Payload,
        sizeBytes,
      },
    });
    return `/api/media/${id}`;
  } catch (err) {
    console.warn("[data-store] MediaAsset offload fallback:", err);
    return url;
  }
}

async function normalizeListingMedia<T extends Partial<Listing>>(listing: T): Promise<T> {
  const photos = Array.isArray(listing.photos) ? listing.photos : [];
  const hasInlinePhotos = photos.some((p) => typeof p === "string" && p.startsWith("data:"));
  const hasInlineVideo =
    typeof listing.videoTourUrl === "string" && listing.videoTourUrl.startsWith("data:");

  if (!hasInlinePhotos && !hasInlineVideo) {
    return listing;
  }

  const normalizedPhotos = await Promise.all(
    photos.map((p) => offloadDataUrlToMediaAsset(p))
  );
  const normalizedVideo = hasInlineVideo
    ? await offloadDataUrlToMediaAsset(listing.videoTourUrl)
    : listing.videoTourUrl;

  return {
    ...listing,
    photos: normalizedPhotos.filter(Boolean),
    videoTourUrl: normalizedVideo,
  };
}

async function upsertRecordInDb<T extends { id: string }>(
  collection: string,
  item: T
): Promise<void> {
  try {
    await (prisma as any).storeRecord.upsert({
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
  } catch (err) {
    console.error(`[data-store] Failed to upsert record "${item.id}" in "${collection}":`, err);
  }
}

async function deleteRecordFromDb(collection: string, id: string): Promise<void> {
  try {
    await (prisma as any).storeRecord.deleteMany({
      where: { collection, id },
    });
  } catch (err) {
    console.error(`[data-store] Failed to delete record "${id}" in "${collection}":`, err);
  }
}

async function loadFromDb<T extends { id: string }>(
  key: string,
  memoryFallback: T[]
): Promise<T[]> {
  try {
    // 1. Read from dedicated indexed StoreRecord rows (scales to 50,000+ rows)
    const rows = await (prisma as any).storeRecord.findMany({
      where: { collection: key },
      orderBy: { createdAt: "desc" },
    });

    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map((r: any) => r.data as T);
    }

    // 2. Automatic one-time migration from legacy AppState JSON array if present
    const legacyRow = await prisma.appState.findUnique({ where: { key } });
    if (legacyRow && Array.isArray(legacyRow.data) && legacyRow.data.length > 0) {
      const legacyItems = legacyRow.data as unknown as T[];
      const migratedItems: T[] = [];

      for (const rawItem of legacyItems) {
        if (!rawItem || !rawItem.id) continue;
        const item =
          key === "listings"
            ? ((await normalizeListingMedia(rawItem as any)) as unknown as T)
            : rawItem;
        migratedItems.push(item);
        await upsertRecordInDb(key, item);
      }

      // Clear heavy legacy blob from AppState after migrating to indexed StoreRecord rows
      await prisma.appState.update({
        where: { key },
        data: { data: [] as any },
      });

      return migratedItems;
    }
  } catch (err) {
    console.error(`[data-store] Failed to load collection "${key}" from Postgres:`, err);
  }
  return memoryFallback;
}

async function saveToDb<T extends { id: string }>(key: string, data: T[]): Promise<void> {
  try {
    await Promise.all(data.map((item) => upsertRecordInDb(key, item)));
  } catch (err) {
    console.error(`[data-store] Failed to save collection "${key}" to Postgres:`, err);
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
  const current = await getListingsStore();
  const cleanListing = await normalizeListingMedia(listing);
  const newListing: Listing = {
    ...cleanListing,
    id: "crib-" + Date.now(),
    createdAt: new Date().toISOString().split("T")[0],
    viewsCount: 1,
    isAvailable: true,
  };
  activeListings = [newListing, ...current];
  await upsertRecordInDb("listings", newListing);
  return newListing;
}

export async function getListingById(id: string): Promise<Listing | undefined> {
  try {
    const row = await (prisma as any).storeRecord.findUnique({
      where: { collection_id: { collection: "listings", id } },
    });
    if (row && row.data) {
      return row.data as Listing;
    }
  } catch {
    // Fallback to list lookup
  }
  const current = await getListingsStore();
  return current.find((l) => l.id === id);
}

export async function updateListingStore(
  id: string,
  updates: Partial<Listing>
): Promise<Listing | undefined> {
  const current = await getListingsStore();
  const index = current.findIndex((l) => l.id === id);
  if (index === -1) return undefined;
  const cleanUpdates = await normalizeListingMedia(updates);
  current[index] = { ...current[index], ...cleanUpdates };
  activeListings = [...current];
  await upsertRecordInDb("listings", activeListings[index]);
  return activeListings[index];
}

export async function deleteListingById(id: string): Promise<boolean> {
  const current = await getListingsStore();
  const filtered = current.filter((l) => l.id !== id);
  activeListings = filtered;
  await deleteRecordFromDb("listings", id);
  return true;
}

export async function incrementListingMetric(
  id: string,
  metric: "views" | "whatsapp"
): Promise<Listing | undefined> {
  const current = await getListingsStore();
  const item = current.find((l) => l.id === id);
  if (!item) return undefined;
  if (metric === "views") {
    item.viewsCount = (item.viewsCount || 0) + 1;
  } else if (metric === "whatsapp") {
    item.whatsappClicksCount = (item.whatsappClicksCount || 0) + 1;
  }
  activeListings = [...current];
  await upsertRecordInDb("listings", item);
  return item;
}

// --- Housing Requests Store ---

export async function getRequestsStore(): Promise<HousingRequest[]> {
  activeRequests = await loadFromDb<HousingRequest>("requests", activeRequests);
  return activeRequests;
}

export async function getRequestById(id: string): Promise<HousingRequest | undefined> {
  const current = await getRequestsStore();
  return current.find((r) => r.id === id);
}

export async function addRequestStore(
  request: Omit<HousingRequest, "id" | "createdAt" | "status" | "responsesCount">
): Promise<HousingRequest> {
  const current = await getRequestsStore();
  const newRequest: HousingRequest = {
    ...request,
    id: "req-" + Date.now(),
    createdAt: new Date().toISOString().split("T")[0],
    status: "OPEN",
    responsesCount: 0,
  };
  activeRequests = [newRequest, ...current];
  await upsertRecordInDb("requests", newRequest);
  return newRequest;
}

// --- Inspection Bookings Store ---

export async function getBookingsStore(): Promise<InspectionBooking[]> {
  activeBookings = await loadFromDb<InspectionBooking>("bookings", activeBookings);
  return activeBookings;
}

export async function addBookingStore(
  booking: Omit<InspectionBooking, "id" | "createdAt" | "status">
): Promise<InspectionBooking> {
  const current = await getBookingsStore();
  const newBooking: InspectionBooking = {
    ...booking,
    id: "book-" + Date.now(),
    createdAt: new Date().toISOString(),
    status: "PENDING",
  };
  activeBookings = [newBooking, ...current];
  await upsertRecordInDb("bookings", newBooking);
  return newBooking;
}

export async function getBookingsByAgent(
  agentId: string,
  agentName?: string
): Promise<InspectionBooking[]> {
  const [bookings, listings] = await Promise.all([getBookingsStore(), getListingsStore()]);
  return bookings.filter((b) => {
    if (b.agentId && b.agentId === agentId) return true;
    if (agentName && b.agentName?.toLowerCase() === agentName.toLowerCase()) return true;
    const listing = listings.find((l) => l.id === b.listingId);
    if (
      listing &&
      (listing.agentId === agentId ||
        (agentName && listing.agentName.toLowerCase() === agentName.toLowerCase()))
    ) {
      return true;
    }
    return false;
  });
}

export async function updateBookingStatus(
  id: string,
  status: "PENDING" | "CONFIRMED" | "DECLINED" | "COMPLETED"
): Promise<InspectionBooking | undefined> {
  const current = await getBookingsStore();
  const booking = current.find((b) => b.id === id);
  if (!booking) return undefined;
  booking.status = status;
  activeBookings = [...current];
  await upsertRecordInDb("bookings", booking);
  return booking;
}

// --- Escrow Deposits Store ---

export async function getEscrowDepositsStore(): Promise<EscrowDeposit[]> {
  activeEscrows = await loadFromDb<EscrowDeposit>("escrows", activeEscrows);
  return activeEscrows;
}

export async function getEscrowById(id: string): Promise<EscrowDeposit | undefined> {
  try {
    const row = await (prisma as any).storeRecord.findUnique({
      where: { collection_id: { collection: "escrows", id } },
    });
    if (row && row.data) {
      return row.data as EscrowDeposit;
    }
  } catch {
    // Fallback to list lookup
  }
  const current = await getEscrowDepositsStore();
  return current.find((e) => e.id === id);
}

export async function getEscrowsByListingId(listingId: string): Promise<EscrowDeposit[]> {
  const current = await getEscrowDepositsStore();
  return current.filter((e) => e.listingId === listingId);
}

export async function getEscrowsByAgent(
  agentId: string,
  agentName?: string
): Promise<EscrowDeposit[]> {
  const current = await getEscrowDepositsStore();
  return current.filter((e) => {
    if (e.agentId && e.agentId === agentId) return true;
    if (agentName && e.agentName.toLowerCase() === agentName.toLowerCase()) return true;
    return false;
  });
}

export async function addEscrowDepositStore(
  deposit: Omit<EscrowDeposit, "id" | "createdAt" | "status" | "releasePin" | "expiresAt"> & {
    initialStatus?: "AWAITING_PAYMENT_CONFIRMATION" | "HELD_IN_ESCROW";
  }
): Promise<EscrowDeposit> {
  const current = await getEscrowDepositsStore();
  const releasePin = Math.floor(1000 + Math.random() * 9000).toString();
  const holdHours = deposit.holdDurationHours || 48;
  const expiresAt = new Date(Date.now() + holdHours * 3600 * 1000).toISOString();

  const initialStatus =
    deposit.initialStatus ||
    (deposit.paymentVerified === false ? "AWAITING_PAYMENT_CONFIRMATION" : "HELD_IN_ESCROW");

  const newEscrow: EscrowDeposit = {
    ...deposit,
    id: "escrow-" + Date.now(),
    releasePin,
    status: initialStatus,
    payoutStatus: "LOCKED",
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  activeEscrows = [newEscrow, ...current];
  await upsertRecordInDb("escrows", newEscrow);
  return newEscrow;
}

export async function confirmEscrowPayment(id: string): Promise<EscrowDeposit | undefined> {
  const current = await getEscrowDepositsStore();
  const escrow = current.find((e) => e.id === id);
  if (!escrow) return undefined;
  escrow.paymentVerified = true;
  if (escrow.status === "AWAITING_PAYMENT_CONFIRMATION") {
    escrow.status = "HELD_IN_ESCROW";
  }
  activeEscrows = [...current];
  await upsertRecordInDb("escrows", escrow);
  return escrow;
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
  const current = await getEscrowDepositsStore();
  const escrow = current.find((e) => e.id === id);
  if (!escrow) {
    return { success: false, error: "Escrow record not found." };
  }

  if (status === "RELEASED_TO_AGENT") {
    if (escrow.status === "AWAITING_PAYMENT_CONFIRMATION" || escrow.paymentVerified === false) {
      return {
        success: false,
        error:
          "Cannot release funds yet: bank transfer payment is still awaiting CribConnect Escrow Vault confirmation.",
      };
    }
    if (!pin || pin.trim() !== escrow.releasePin) {
      return {
        success: false,
        error: "Invalid Inspection Release PIN. Please enter the exact 4-digit Release PIN.",
      };
    }
  }

  escrow.status = status;
  if (status === "RELEASED_TO_AGENT") {
    escrow.payoutStatus = "APPROVED_FOR_PAYOUT";
  } else if (status === "REFUNDED_TO_STUDENT") {
    escrow.payoutStatus = "REFUNDED";
  }
  if (reason) escrow.disputeReason = reason;

  activeEscrows = [...current];
  await upsertRecordInDb("escrows", escrow);
  return { success: true, escrow };
}

export async function markEscrowDisbursed(id: string): Promise<EscrowDeposit | undefined> {
  const current = await getEscrowDepositsStore();
  const escrow = current.find((e) => e.id === id);
  if (!escrow) return undefined;
  escrow.payoutStatus = "PAID_TO_BANK";
  escrow.paidOutAt = new Date().toISOString();
  activeEscrows = [...current];
  await upsertRecordInDb("escrows", escrow);
  return escrow;
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
  try {
    const row = await (prisma as any).storeRecord.findUnique({
      where: { collection_id: { collection: "users", id } },
    });
    if (row && row.data) {
      return row.data as StoredUser;
    }
  } catch {
    // Fallback to list lookup
  }
  const current = await getUsersStore();
  return current.find((u) => u.id === id);
}

export async function createUser(
  user: Omit<StoredUser, "id" | "createdAt" | "tenantsHousedCount" | "rentalsHistory"> & {
    id?: string;
  }
): Promise<StoredUser> {
  const current = await getUsersStore();
  const newUser: StoredUser = {
    ...user,
    id: user.id || "user-" + Date.now(),
    tenantsHousedCount: 0,
    rentalsHistory: [],
    createdAt: new Date().toISOString(),
  };
  activeUsers = [newUser, ...current.filter((u) => u.id !== newUser.id)];
  await upsertRecordInDb("users", newUser);
  return newUser;
}

export async function updateUser(
  id: string,
  updates: Partial<StoredUser>
): Promise<StoredUser | undefined> {
  const current = await getUsersStore();
  const user = current.find((u) => u.id === id);
  if (!user) return undefined;

  Object.assign(user, updates);
  activeUsers = [...current];
  await upsertRecordInDb("users", user);
  return user;
}

export async function recordRentalSuccess(
  userId: string,
  record: Omit<TenantRentalRecord, "id">
): Promise<StoredUser | undefined> {
  const current = await getUsersStore();
  const user = current.find((u) => u.id === userId);
  if (!user) return undefined;

  const agencyFeeTotal = Math.round((record.amount || 0) * 0.1);
  const platformCommission = Math.round(agencyFeeTotal * 0.2); // 20% platform cut of 10% agency fee
  const agentNetCommission = agencyFeeTotal - platformCommission; // 80% net commission to Agent/Owner

  const newRecord: TenantRentalRecord = {
    ...record,
    id: "rent-" + Date.now(),
    agencyFeeTotal,
    platformCommission,
    agentNetCommission,
    payoutStatus: "APPROVED_FOR_PAYOUT",
  };

  user.tenantsHousedCount = (user.tenantsHousedCount || 0) + 1;
  user.rentalsHistory = [newRecord, ...(user.rentalsHistory || [])];
  activeUsers = [...current];
  await upsertRecordInDb("users", user);
  return user;
}

export async function markRentalDisbursed(
  userId: string,
  rentalId: string
): Promise<boolean> {
  const current = await getUsersStore();
  const user = current.find((u) => u.id === userId);
  if (!user || !user.rentalsHistory) return false;
  const item = user.rentalsHistory.find((r) => r.id === rentalId);
  if (!item) return false;
  item.payoutStatus = "PAID_TO_BANK";
  activeUsers = [...current];
  await upsertRecordInDb("users", user);
  return true;
}
