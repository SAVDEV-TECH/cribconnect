import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { confirmEscrowPayment, getEscrowByReference } from "@/lib/data-store";
import { timingSafeStringEqual } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const paystackSecret = (process.env.PAYSTACK_SECRET_KEY || "").trim();
    if (!paystackSecret) {
      return NextResponse.json({ error: "Paystack webhook secret not configured." }, { status: 503 });
    }

    const signature = req.headers.get("x-paystack-signature")?.trim() || "";
    const rawBody = await req.text();

    const expectedSignature = crypto
      .createHmac("sha512", paystackSecret)
      .update(rawBody)
      .digest("hex");

    if (!signature || !timingSafeStringEqual(signature, expectedSignature)) {
      return NextResponse.json({ error: "Invalid Paystack webhook signature." }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    if (event?.event === "charge.success") {
      const reference = String(event.data?.reference || "").trim();
      const currency = String(event.data?.currency || "").toUpperCase();
      const amountKobo = Number(event.data?.amount || 0);

      if (reference && currency === "NGN") {
        const escrow = await getEscrowByReference(reference);
        if (escrow && amountKobo >= escrow.amount * 100) {
          await confirmEscrowPayment(escrow.id);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
