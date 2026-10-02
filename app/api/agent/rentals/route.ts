import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, sanitizeText } from "@/lib/auth-security";
import { recordRentalSuccess, getListingsStore } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("cribconnect_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const tenantName = sanitizeText(body.tenantName || "Student Tenant");
    const propertyTitle = sanitizeText(body.propertyTitle || "Student Accommodation");
    const neighborhood = sanitizeText(body.neighborhood || "Akoka");
    const amount = parseFloat(body.amount) || 450000;
    const date = body.date || new Date().toISOString().split("T")[0];

    const updatedUser = recordRentalSuccess(payload.userId, {
      tenantName,
      propertyTitle,
      neighborhood,
      date,
      amount,
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If listingId was passed, mark that listing as not available / rented
    if (body.listingId) {
      const allListings = getListingsStore();
      const listing = allListings.find((l) => l.id === body.listingId);
      if (listing) {
        listing.isAvailable = false;
      }
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
