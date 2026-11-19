import { NextRequest, NextResponse } from "next/server";
import {
  addBookingStore,
  getBookingsStore,
  getBookingsByAgent,
  getBookingById,
  updateBookingStatus,
  getListingById,
} from "@/lib/data-store";
import { requireAuth } from "@/lib/session";
import {
  checkRateLimit,
  getClientIp,
  isValidEmail,
  isValidPhone,
  sanitizeText,
} from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { user, isAdmin } = auth.context;
    const { searchParams } = new URL(req.url);
    const queryAgentId = searchParams.get("agentId")?.trim();

    if (isAdmin) {
      if (queryAgentId) {
        const filtered = await getBookingsByAgent(queryAgentId);
        return NextResponse.json({ bookings: filtered });
      }
      const bookings = await getBookingsStore();
      return NextResponse.json({ bookings });
    }

    if (user.role === "AGENT" || user.role === "LANDLORD") {
      const agentBookings = await getBookingsByAgent(user.id);
      return NextResponse.json({ bookings: agentBookings });
    }

    // Students/tenants see only their own bookings
    const allBookings = await getBookingsStore();
    const myEmail = user.email.toLowerCase();
    const studentBookings = allBookings.filter(
      (b) => (b.tenantEmail || "").toLowerCase() === myEmail
    );
    return NextResponse.json({ bookings: studentBookings });
  } catch (error) {
    console.error("GET bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const { allowed } = checkRateLimit(`booking-create:${clientIp}`, 15, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many booking requests. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }

    const body = await req.json();

    const listingId = sanitizeText(body.listingId, 100);
    const tenantName = sanitizeText(body.tenantName, 120);
    const tenantPhone = sanitizeText(body.tenantPhone, 30);
    const tenantEmail = sanitizeText(body.tenantEmail || "", 150);
    const preferredDate = sanitizeText(
      body.preferredDate || new Date().toISOString().split("T")[0],
      40
    );
    const preferredTime = sanitizeText(body.preferredTime || "11:00 AM - 1:00 PM", 60);
    const message = sanitizeText(
      body.message || "I would like to schedule a physical inspection.",
      1000
    );

    if (!tenantName || !tenantPhone || !listingId) {
      return NextResponse.json(
        { error: "Please provide your name, phone number, and listing." },
        { status: 400 }
      );
    }

    if (!isValidPhone(tenantPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid phone number." },
        { status: 400 }
      );
    }

    if (tenantEmail && !isValidEmail(tenantEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const listing = await getListingById(listingId);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    const booking = await addBookingStore({
      listingId: listing.id,
      listingTitle: listing.title,
      agentId: listing.agentId,
      agentName: listing.agentName,
      tenantName,
      tenantPhone,
      tenantEmail,
      preferredDate,
      preferredTime,
      message,
    });

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error) {
    console.error("Failed to book inspection:", error);
    return NextResponse.json({ error: "Failed to book inspection" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { user, isAdmin } = auth.context;
    const body = await req.json();
    const id = sanitizeText(body.id, 100);
    const status = body.status as "PENDING" | "CONFIRMED" | "DECLINED" | "COMPLETED";

    if (!id || !["PENDING", "CONFIRMED", "DECLINED", "COMPLETED"].includes(status)) {
      return NextResponse.json(
        { error: "Valid booking ID and status are required." },
        { status: 400 }
      );
    }

    const booking = await getBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const listing = await getListingById(booking.listingId);
    const isOwner = booking.agentId === user.id || listing?.agentId === user.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden: You can only update inspection bookings for your own listings." },
        { status: 403 }
      );
    }

    const updated = await updateBookingStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("PATCH booking error:", error);
    return NextResponse.json({ error: "Failed to update booking status." }, { status: 500 });
  }
}
