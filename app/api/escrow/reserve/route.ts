import { NextRequest, NextResponse } from "next/server";
import { addEscrowDepositStore, getListingById } from "@/lib/data-store";
import { isValidEmail, sanitizeText } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      listingId,
      studentName,
      studentEmail,
      studentPhone,
      inspectionDate,
      inspectionTime,
      paystackReference,
      amount = 10000,
    } = body;

    if (!listingId || !studentName || !studentEmail || !studentPhone || !inspectionDate) {
      return NextResponse.json(
        { error: "Please fill in all required inspection and contact details." },
        { status: 400 }
      );
    }

    if (!isValidEmail(studentEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const listing = await getListingById(listingId);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    const cleanAmount = Number(amount) || 10000;
    const platformFee = Math.round(cleanAmount * 0.1); // 10% platform fee (e.g. N1,000)
    const agentPayout = cleanAmount - platformFee; // 90% to agent/landlord (e.g. N9,000)

    const reference =
      paystackReference || "CRIB_ESCROW_" + Date.now().toString(36).toUpperCase();

    const escrow = await addEscrowDepositStore({
      listingId: listing.id,
      listingTitle: listing.title,
      neighborhood: listing.neighborhood,
      agentId: listing.agentId,
      agentName: listing.agentName,
      agentPhone: listing.agentPhone,
      agentWhatsapp: listing.agentWhatsapp,
      studentName: sanitizeText(studentName),
      studentEmail: sanitizeText(studentEmail).toLowerCase().trim(),
      studentPhone: sanitizeText(studentPhone),
      amount: cleanAmount,
      platformFee,
      agentPayout,
      paystackReference: reference,
      holdDurationHours: 48,
      inspectionDate,
      inspectionTime: inspectionTime || "11:00 AM - 1:00 PM",
    });

    // Generate pre-filled WhatsApp message for agent
    const cleanAgentPhone = (listing.agentWhatsapp || listing.agentPhone || "")
      .replace(/\D/g, "");
    const intlPhone = cleanAgentPhone.startsWith("0")
      ? "234" + cleanAgentPhone.slice(1)
      : cleanAgentPhone || "2348063345521";

    const whatsappMessage = encodeURIComponent(
      `Hello ${listing.agentName}! I have reserved "${listing.title}" on CribConnect with a ₦${cleanAmount.toLocaleString()} Holding Escrow Deposit (Ref: ${reference}).\n\n` +
      `📅 Inspection Date: ${inspectionDate} (${inspectionTime || "11 AM"})\n` +
      `👤 Tenant Name: ${studentName}\n` +
      `📱 Phone: ${studentPhone}\n\n` +
      `The apartment is now locked for me for 48 hours. Please confirm you have received this holding alert!`
    );

    const whatsappUrl = `https://wa.me/${intlPhone}?text=${whatsappMessage}`;

    return NextResponse.json({
      success: true,
      escrow,
      whatsappUrl,
      message: "Room successfully locked in Escrow for 48 hours!",
    });
  } catch (error: any) {
    console.error("Escrow reserve error:", error);
    return NextResponse.json(
      { error: "Failed to create escrow reservation. Please try again." },
      { status: 500 }
    );
  }
}
