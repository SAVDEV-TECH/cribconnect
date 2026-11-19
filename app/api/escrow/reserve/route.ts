import { NextRequest, NextResponse } from "next/server";
import {
  addEscrowDepositStore,
  getActiveEscrowForListing,
  getEscrowById,
  getEscrowByReference,
  getListingById,
} from "@/lib/data-store";
import {
  checkRateLimit,
  getClientIp,
  isValidEmail,
  isValidPhone,
  sanitizeText,
  timingSafeStringEqual,
} from "@/lib/auth-security";
import { getSessionContext } from "@/lib/session";
import { buildWhatsAppUrl, ESCROW_DEPOSIT_AMOUNT } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/escrow/reserve?id=escrow-...&token=<lookupToken>
// Requires either the matching unguessable lookupToken or an authenticated owner/admin session.
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")?.trim();
    const token =
      req.nextUrl.searchParams.get("token")?.trim() ||
      req.headers.get("x-escrow-token")?.trim() ||
      "";

    if (!id) {
      return NextResponse.json({ error: "Escrow ID is required." }, { status: 400 });
    }

    const escrow = await getEscrowById(id);
    if (!escrow) {
      return NextResponse.json({ error: "Escrow reservation not found." }, { status: 404 });
    }

    const session = await getSessionContext();
    const hasValidLookupToken = Boolean(
      token && escrow.lookupToken && timingSafeStringEqual(token, escrow.lookupToken)
    );
    const isStudentOwner = Boolean(
      session &&
        (session.user.id === escrow.studentUserId ||
          session.user.email.toLowerCase() === escrow.studentEmail.toLowerCase())
    );
    const isAdmin = Boolean(session?.isAdmin);

    if (!hasValidLookupToken && !isStudentOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. A valid escrow receipt token or student session is required." },
        { status: 401 }
      );
    }

    const { lookupToken: _tok, ...escrowPublic } = escrow;

    // Mask the 4-digit Release PIN if bank transfer has not yet been confirmed,
    // or if accessed by an admin (only the student should see the plaintext PIN).
    const shouldMaskPin =
      escrow.status === "AWAITING_PAYMENT_CONFIRMATION" ||
      escrow.paymentVerified === false ||
      (isAdmin && !hasValidLookupToken && !isStudentOwner);

    const safeEscrow = shouldMaskPin
      ? { ...escrowPublic, releasePin: "•••• (Awaiting Bank Alert)" }
      : escrowPublic;

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
    const clientIp = getClientIp(req);
    const { allowed } = checkRateLimit(`escrow-reserve:${clientIp}`, 10, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many reservation attempts. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }

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

    if (!isValidPhone(studentPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid phone / WhatsApp number." },
        { status: 400 }
      );
    }

    const listing = await getListingById(String(listingId));
    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    if (!listing.isAvailable) {
      return NextResponse.json(
        { error: "This property is no longer available for reservation." },
        { status: 409 }
      );
    }

    // Prevent concurrent double-booking while another student holds a valid 48h lock
    const activeHold = await getActiveEscrowForListing(listing.id);
    if (activeHold) {
      return NextResponse.json(
        {
          error:
            "This property is currently locked under an active 48-hour Escrow inspection hold. Please check back later or explore similar rooms.",
        },
        { status: 409 }
      );
    }

    // Server-enforced fixed holding deposit (never trust client-supplied amount)
    const cleanAmount = ESCROW_DEPOSIT_AMOUNT;
    const platformFee = Math.round(cleanAmount * 0.1); // 10% platform fee (₦1,000)
    const agentPayout = cleanAmount - platformFee; // 90% to agent/landlord (₦9,000)

    let verifiedByGateway = false;
    let reference = paystackReference ? sanitizeText(paystackReference, 120) : "";

    if (paymentMethod === "PAYSTACK") {
      if (!reference) {
        return NextResponse.json(
          { error: "Missing Paystack transaction reference. Payment was not completed." },
          { status: 400 }
        );
      }

      const duplicateRef = await getEscrowByReference(reference);
      if (duplicateRef) {
        return NextResponse.json(
          { error: "This payment reference has already been used for an escrow reservation." },
          { status: 409 }
        );
      }

      const paystackSecret = (process.env.PAYSTACK_SECRET_KEY || "").trim();
      if (!paystackSecret) {
        // FAIL CLOSED: never trust unverified client-side Paystack references
        return NextResponse.json(
          {
            error:
              "Online Paystack verification is not configured on the server yet. Please use Direct Bank Transfer instead.",
          },
          { status: 503 }
        );
      }

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

      let verifyJson: any = null;
      try {
        verifyJson = await verifyRes.json();
      } catch {
        return NextResponse.json(
          { error: "Unexpected response from Paystack verification service." },
          { status: 502 }
        );
      }

      if (!verifyRes.ok || !verifyJson?.status || verifyJson.data?.status !== "success") {
        return NextResponse.json(
          {
            error:
              verifyJson?.message ||
              "Paystack could not verify this payment reference. Please ensure payment was completed.",
          },
          { status: 400 }
        );
      }

      if (String(verifyJson.data?.currency || "").toUpperCase() !== "NGN") {
        return NextResponse.json(
          { error: "Paystack transaction currency must be NGN." },
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

      const cleanSessionId = sanitizeText(transferSessionId, 100);
      if (cleanSessionId.length < 6) {
        return NextResponse.json(
          {
            error:
              "Please enter a valid bank Transfer Reference or NIP Session ID (at least 6 characters/digits).",
          },
          { status: 400 }
        );
      }

      reference = `NIP_${cleanSessionId.toUpperCase()}`;
      const duplicateRef = await getEscrowByReference(reference);
      if (duplicateRef) {
        return NextResponse.json(
          { error: "This bank transfer reference has already been submitted." },
          { status: 409 }
        );
      }

      verifiedByGateway = false; // Requires CribConnect Admin Bank Alert Confirmation before PIN unlock
    } else {
      return NextResponse.json({ error: "Invalid payment method selected." }, { status: 400 });
    }

    const session = await getSessionContext();

    const escrow = await addEscrowDepositStore({
      listingId: listing.id,
      listingTitle: listing.title,
      neighborhood: listing.neighborhood,
      agentId: listing.agentId,
      agentName: listing.agentName,
      agentPhone: listing.agentPhone,
      agentWhatsapp: listing.agentWhatsapp,
      studentUserId: session?.user.id,
      studentName: sanitizeText(studentName, 120),
      studentEmail: sanitizeText(studentEmail, 254).toLowerCase(),
      studentPhone: sanitizeText(studentPhone, 30),
      amount: cleanAmount,
      platformFee,
      agentPayout,
      paystackReference: reference,
      paymentMethod: paymentMethod === "PAYSTACK" ? "PAYSTACK" : "BANK_TRANSFER",
      paymentVerified: verifiedByGateway,
      senderBankName: senderBankName ? sanitizeText(senderBankName, 80) : undefined,
      senderAccountName: senderAccountName ? sanitizeText(senderAccountName, 120) : undefined,
      transferSessionId: transferSessionId ? sanitizeText(transferSessionId, 100) : undefined,
      initialStatus: verifiedByGateway ? "HELD_IN_ESCROW" : "AWAITING_PAYMENT_CONFIRMATION",
      holdDurationHours: 48,
      inspectionDate: sanitizeText(inspectionDate, 30),
      inspectionTime: sanitizeText(inspectionTime || "11:00 AM - 1:00 PM", 60),
    });

    const whatsappText =
      `Hello ${listing.agentName}! I have initiated a ₦${cleanAmount.toLocaleString()} Holding Escrow Reservation for "${listing.title}" on CribConnect (Ref: ${reference}).\n\n` +
      `Inspection Date: ${escrow.inspectionDate} (${escrow.inspectionTime})\n` +
      `Tenant Name: ${escrow.studentName}\n` +
      `Phone: ${escrow.studentPhone}\n` +
      `Payment Channel: ${
        paymentMethod === "PAYSTACK"
          ? "Paystack Verified Gateway"
          : `Bank Transfer (${escrow.senderBankName} - Ref: ${escrow.transferSessionId})`
      }\n\n` +
      `Please confirm my inspection schedule.`;

    const whatsappUrl = buildWhatsAppUrl(
      listing.agentWhatsapp || listing.agentPhone,
      whatsappText
    );

    const { lookupToken, ...escrowPublic } = escrow;
    const safeEscrow =
      escrow.status === "AWAITING_PAYMENT_CONFIRMATION"
        ? { ...escrowPublic, releasePin: "•••• (Awaiting Bank Alert)" }
        : escrowPublic;

    return NextResponse.json({
      success: true,
      escrow: safeEscrow,
      lookupToken,
      whatsappUrl,
      message: verifiedByGateway
        ? "Paystack payment verified! Room locked in Escrow for 48 hours."
        : "Bank transfer submitted! CribConnect Escrow Vault is verifying your ₦10,000 transfer to unlock your 4-digit Release PIN.",
    });
  } catch (error) {
    console.error("Escrow reserve error:", error);
    return NextResponse.json(
      { error: "Failed to create escrow reservation. Please try again." },
      { status: 500 }
    );
  }
}
