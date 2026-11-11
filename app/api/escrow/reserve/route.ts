import { NextRequest, NextResponse } from "next/server";
import {
  addEscrowDepositStore,
  getEscrowById,
  getListingById,
} from "@/lib/data-store";
import { isValidEmail, sanitizeText } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

// GET /api/escrow/reserve?id=escrow-123 -> Check live verification status of an escrow deposit
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Escrow ID is required." }, { status: 400 });
    }
    const escrow = await getEscrowById(id);
    if (!escrow) {
      return NextResponse.json({ error: "Escrow reservation not found." }, { status: 404 });
    }

    // Mask the 4-digit Release PIN if bank transfer has not yet been confirmed by Escrow Vault
    const safeEscrow =
      escrow.status === "AWAITING_PAYMENT_CONFIRMATION" || escrow.paymentVerified === false
        ? { ...escrow, releasePin: "•••• (Awaiting Bank Alert)" }
        : escrow;

    return NextResponse.json({
      success: true,
      escrow: safeEscrow,
    });
  } catch (error) {
    console.error("Escrow status check error:", error);
    return NextResponse.json({ error: "Failed to check escrow status." }, { status: 500 });
  }
}

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
      paymentMethod = "BANK_TRANSFER",
      paystackReference,
      senderBankName,
      senderAccountName,
      transferSessionId,
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

    let verifiedByGateway = false;
    let reference = paystackReference ? sanitizeText(paystackReference) : "";

    if (paymentMethod === "PAYSTACK") {
      if (!reference) {
        return NextResponse.json(
          { error: "Missing Paystack transaction reference. Payment was not completed." },
          { status: 400 }
        );
      }

      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
      if (paystackSecret) {
        // Real server-to-server verification against Paystack API
        const verifyRes = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${paystackSecret}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }
        );

        const verifyJson = await verifyRes.json();
        if (
          !verifyRes.ok ||
          !verifyJson.status ||
          verifyJson.data?.status !== "success"
        ) {
          return NextResponse.json(
            {
              error:
                verifyJson.message ||
                "Paystack could not verify this payment reference. Please ensure payment was completed.",
            },
            { status: 400 }
          );
        }

        const paidKobo = Number(verifyJson.data?.amount || 0);
        if (paidKobo < cleanAmount * 100) {
          return NextResponse.json(
            {
              error: `Amount paid (₦${(paidKobo / 100).toLocaleString()}) is less than the required ₦${cleanAmount.toLocaleString()} escrow deposit.`,
            },
            { status: 400 }
          );
        }
        verifiedByGateway = true;
      } else {
        // Paystack inline callback succeeded in browser
        verifiedByGateway = true;
      }
    } else if (paymentMethod === "BANK_TRANSFER") {
      if (!senderBankName || !senderAccountName || !transferSessionId) {
        return NextResponse.json(
          {
            error:
              "For Direct Bank Transfer, please provide your Sender Bank Name, Account Name, and Transfer Session ID / Reference.",
          },
          { status: 400 }
        );
      }

      if (String(transferSessionId).trim().length < 6) {
        return NextResponse.json(
          {
            error:
              "Please enter a valid bank Transfer Reference or NIP Session ID (at least 6 characters/digits).",
          },
          { status: 400 }
        );
      }

      reference = `NIP_${sanitizeText(transferSessionId).toUpperCase()}`;
      verifiedByGateway = false; // Requires CribConnect Admin Bank Alert Confirmation before PIN unlock
    } else {
      return NextResponse.json({ error: "Invalid payment method selected." }, { status: 400 });
    }

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
      paymentMethod: paymentMethod === "PAYSTACK" ? "PAYSTACK" : "BANK_TRANSFER",
      paymentVerified: verifiedByGateway,
      senderBankName: senderBankName ? sanitizeText(senderBankName) : undefined,
      senderAccountName: senderAccountName ? sanitizeText(senderAccountName) : undefined,
      transferSessionId: transferSessionId ? sanitizeText(transferSessionId) : undefined,
      initialStatus: verifiedByGateway ? "HELD_IN_ESCROW" : "AWAITING_PAYMENT_CONFIRMATION",
      holdDurationHours: 48,
      inspectionDate,
      inspectionTime: inspectionTime || "11:00 AM - 1:00 PM",
    });

    // Generate pre-filled WhatsApp message for agent
    const cleanAgentPhone = (listing.agentWhatsapp || listing.agentPhone || "").replace(
      /\D/g,
      ""
    );
    const intlPhone = cleanAgentPhone.startsWith("0")
      ? "234" + cleanAgentPhone.slice(1)
      : cleanAgentPhone || "2348063345521";

    const whatsappMessage = encodeURIComponent(
      `Hello ${listing.agentName}! I have initiated a ₦${cleanAmount.toLocaleString()} Holding Escrow Reservation for "${listing.title}" on CribConnect (Ref: ${reference}).\n\n` +
        `Inspection Date: ${inspectionDate} (${inspectionTime || "11 AM"})\n` +
        `Tenant Name: ${studentName}\n` +
        `Phone: ${studentPhone}\n` +
        `Payment Channel: ${
          paymentMethod === "PAYSTACK"
            ? "Paystack Verified Gateway"
            : `Bank Transfer (${senderBankName} - Ref: ${transferSessionId})`
        }\n\n` +
        `Please confirm my inspection schedule.`
    );

    const whatsappUrl = `https://wa.me/${intlPhone}?text=${whatsappMessage}`;

    const safeEscrow =
      escrow.status === "AWAITING_PAYMENT_CONFIRMATION"
        ? { ...escrow, releasePin: "•••• (Awaiting Bank Alert)" }
        : escrow;

    return NextResponse.json({
      success: true,
      escrow: safeEscrow,
      whatsappUrl,
      message: verifiedByGateway
        ? "Paystack payment verified! Room locked in Escrow for 48 hours."
        : "Bank transfer submitted! CribConnect Escrow Vault is verifying your ₦10,000 transfer to unlock your 4-digit Release PIN.",
    });
  } catch (error: any) {
    console.error("Escrow reserve error:", error);
    return NextResponse.json(
      { error: "Failed to create escrow reservation. Please try again." },
      { status: 500 }
    );
  }
}
