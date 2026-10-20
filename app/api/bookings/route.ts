import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  addBookingStore,
  getBookingsStore,
  getBookingsByAgent,
  updateBookingStatus,
  getListingById,
  getUserById,
} from "@/lib/data-store";
import { verifySessionToken, sanitizeText } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryAgentId = searchParams.get("agentId");

    // Check if session token exists
    const cookieStore = cookies();
    const token = cookieStore.get("cribconnect_session")?.value;
    let sessionUser: any = null;

    if (token) {
      const payload = verifySessionToken(token);
      if (payload) {
        sessionUser = getUserById(payload.userId);
      }
    }

    const targetAgentId = queryAgentId || sessionUser?.id;
    const targetAgentName = sessionUser?.name;

    if (targetAgentId || targetAgentName) {
      const agentBookings = getBookingsByAgent(targetAgentId || "", targetAgentName);
      return NextResponse.json({ bookings: agentBookings });
    }

    const bookings = getBookingsStore();
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("GET bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const listingId = sanitizeText(body.listingId);
    const tenantName = sanitizeText(body.tenantName);
    const tenantPhone = sanitizeText(body.tenantPhone);
    const tenantEmail = sanitizeText(body.tenantEmail || "");
    const preferredDate = sanitizeText(body.preferredDate || new Date().toISOString().split("T")[0]);
    const preferredTime = sanitizeText(body.preferredTime || "11:00 AM - 1:00 PM");
    const message = sanitizeText(body.message || "I would like to schedule a physical inspection.");

    if (!tenantName || !tenantPhone || !listingId) {
      return NextResponse.json(
        { error: "Please provide your name, phone number, and listing." },
        { status: 400 }
      );
    }

    // Lookup listing to attach agent
    const listing = getListingById(listingId);
    const listingTitle = listing?.title || sanitizeText(body.listingTitle) || "Rental Property";
    const agentId = listing?.agentId || body.agentId || "";
    const agentName = listing?.agentName || body.agentName || "";

    const booking = addBookingStore({
      listingId,
      listingTitle,
      agentId,
      agentName,
      tenantName,
      tenantPhone,
      tenantEmail,
      preferredDate,
      preferredTime,
      message,
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Failed to book inspection:", error);
    return NextResponse.json({ error: "Failed to book inspection" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = sanitizeText(body.id);
    const status = body.status as "PENDING" | "CONFIRMED" | "DECLINED" | "COMPLETED";

    if (!id || !["PENDING", "CONFIRMED", "DECLINED", "COMPLETED"].includes(status)) {
      return NextResponse.json(
        { error: "Valid booking ID and status are required." },
        { status: 400 }
      );
    }

    const updated = updateBookingStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("PATCH booking error:", error);
    return NextResponse.json({ error: "Failed to update booking status." }, { status: 500 });
  }
}
