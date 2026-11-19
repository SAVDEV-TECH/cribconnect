import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { sanitizeText } from "@/lib/auth-security";
import {
  getListingById,
  recordRentalSuccess,
  updateListingStore,
} from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { user, isAdmin } = auth.context;
    if (!isAdmin && user.role !== "AGENT" && user.role !== "LANDLORD") {
      return NextResponse.json(
        { error: "Only agents or landlords can record rentals." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const tenantName = sanitizeText(body.tenantName || "Student Tenant", 120);
    const propertyTitle = sanitizeText(body.propertyTitle || "Student Accommodation", 160);
    const neighborhood = sanitizeText(body.neighborhood || "Choba", 80);
    const amount = Number(body.amount);
    const date = sanitizeText(body.date || new Date().toISOString().split("T")[0], 40);

    if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) {
      return NextResponse.json(
        { error: "Please provide a valid positive rental amount." },
        { status: 400 }
      );
    }

    // Verify ownership BEFORE marking any listing as unavailable
    const listingId = body.listingId ? sanitizeText(body.listingId, 100) : "";
    if (listingId) {
      const listing = await getListingById(listingId);
      if (!listing) {
        return NextResponse.json({ error: "Listing not found." }, { status: 404 });
      }
      if (!isAdmin && listing.agentId !== user.id) {
        return NextResponse.json(
          { error: "Forbidden: You do not own this listing." },
          { status: 403 }
        );
      }
      await updateListingStore(listing.id, { isAvailable: false });
    }

    const updatedUser = await recordRentalSuccess(user.id, {
      tenantName,
      propertyTitle,
      neighborhood,
      date,
      amount: Math.round(amount),
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      tenantsHousedCount: updatedUser.tenantsHousedCount,
      rentalsHistory: updatedUser.rentalsHistory,
    });
  } catch (error) {
    console.error("Rentals record error:", error);
    return NextResponse.json({ error: "Failed to record rental" }, { status: 500 });
  }
}
