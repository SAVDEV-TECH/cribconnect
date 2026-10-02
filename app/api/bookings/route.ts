import { NextRequest, NextResponse } from "next/server";
import { addBookingStore, getBookingsStore } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const bookings = getBookingsStore();
  return NextResponse.json({ bookings });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.tenantName || !body.tenantPhone || !body.listingId) {
      return NextResponse.json(
        { error: "Please provide your name, phone number, and listing." },
        { status: 400 }
      );
    }

    const booking = addBookingStore({
      listingId: body.listingId,
      listingTitle: body.listingTitle || "Rental Property",
      tenantName: body.tenantName,
      tenantPhone: body.tenantPhone,
      tenantEmail: body.tenantEmail || "",
      preferredDate: body.preferredDate || new Date().toISOString().split("T")[0],
      message: body.message || "I would like to schedule a physical inspection.",
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Failed to book inspection:", error);
    return NextResponse.json({ error: "Failed to book inspection" }, { status: 500 });
  }
}
