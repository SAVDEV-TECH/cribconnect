import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { sanitizeText } from "@/lib/auth-security";
import { getListingsStore, updateListingStore, updateUser } from "@/lib/data-store";

export const dynamic = "force-dynamic";

const PRO_PLAN_PRICES_NGN: Record<string, { amount: number; credits: number }> = {
  MONTHLY: { amount: 5000, credits: 3 },
  YEARLY: { amount: 48000, credits: 36 },
};

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { user, isAdmin } = auth.context;
    if (!isAdmin && user.role !== "AGENT" && user.role !== "LANDLORD") {
      return NextResponse.json(
        { error: "Only registered Agents or Landlords can upgrade to Pro." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const planKey = String(body.plan || "MONTHLY").toUpperCase();
    const paymentReference = sanitizeText(body.paymentReference || "", 120);

    const planSpec = PRO_PLAN_PRICES_NGN[planKey];
    if (!planSpec) {
      return NextResponse.json(
        { error: "Invalid plan selected. Choose MONTHLY or YEARLY." },
        { status: 400 }
      );
    }

    if (!paymentReference) {
      return NextResponse.json(
        { error: "A valid Paystack payment reference is required." },
        { status: 400 }
      );
    }

    const paystackSecret = (process.env.PAYSTACK_SECRET_KEY || "").trim();
    if (!paystackSecret) {
      return NextResponse.json(
        {
          error:
            "Pro subscription billing is temporarily unavailable (Paystack server key not configured).",
        },
        { status: 503 }
      );
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(paymentReference)}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!verifyRes.ok) {
      return NextResponse.json(
        { error: "Unable to verify payment with Paystack right now." },
        { status: 502 }
      );
    }

    const verifyJson = await verifyRes.json();
    const txData = verifyJson?.data;
    const expectedKobo = planSpec.amount * 100;

    if (
      !verifyJson?.status ||
      txData?.status !== "success" ||
      txData?.currency !== "NGN" ||
      Number(txData?.amount) < expectedKobo
    ) {
      return NextResponse.json(
        {
          error: `Payment verification failed. Expected ₦${planSpec.amount.toLocaleString()} NGN.`,
        },
        { status: 402 }
      );
    }

    const currentBadges = Array.isArray(user.badges) ? [...user.badges] : [];
    if (!currentBadges.includes("Pro Agent")) {
      currentBadges.push("Pro Agent");
    }

    const updated = await updateUser(user.id, {
      tier: "PRO",
      featuredListingCredits: (user.featuredListingCredits || 0) + planSpec.credits,
      badges: currentBadges,
    });

    if (!updated) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Feature the upgraded agent's listings
    const allListings = await getListingsStore();
    await Promise.all(
      allListings
        .filter((l) => l.agentId === updated.id)
        .map((l) => updateListingStore(l.id, { isFeatured: true }))
    );

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to CribConnect Pro (${planKey})! Reference: ${paymentReference}`,
      profile: {
        id: updated.id,
        tier: updated.tier,
        featuredListingCredits: updated.featuredListingCredits,
        badges: updated.badges,
      },
    });
  } catch (error) {
    console.error("Failed to upgrade tier:", error);
    return NextResponse.json({ error: "Failed to upgrade tier" }, { status: 500 });
  }
}
