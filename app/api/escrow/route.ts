import { NextResponse } from "next/server";
import {
  getEscrowDepositsStore,
  getEscrowsByAgent,
  getEscrowsByStudent,
} from "@/lib/data-store";
import { requireAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { user, isAdmin } = auth.context;

    // Admins see all escrows (without exposing student's secret releasePin or lookupToken)
    if (isAdmin) {
      const escrows = await getEscrowDepositsStore();
      return NextResponse.json({
        success: true,
        escrows: escrows.map(({ releasePin: _pin, lookupToken: _tok, ...safe }) => safe),
      });
    }

    // Agents / Landlords see ONLY escrows for their own properties — NEVER the student's releasePin
    if (user.role === "AGENT" || user.role === "LANDLORD") {
      const escrows = await getEscrowsByAgent(user.id);
      return NextResponse.json({
        success: true,
        escrows: escrows.map(({ releasePin: _pin, lookupToken: _tok, ...safe }) => safe),
      });
    }

    // Students / Tenants see ONLY their own escrows (PIN shown only after payment is verified)
    const studentEscrows = await getEscrowsByStudent(user.email, user.id);
    const safeStudentEscrows = studentEscrows.map((e) => {
      const { lookupToken: _tok, ...rest } = e;
      if (e.status === "AWAITING_PAYMENT_CONFIRMATION" || e.paymentVerified === false) {
        return { ...rest, releasePin: "•••• (Awaiting Bank Alert)" };
      }
      return rest;
    });

    return NextResponse.json({
      success: true,
      escrows: safeStudentEscrows,
    });
  } catch (error) {
    console.error("Fetch escrows error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve escrow records." },
      { status: 500 }
    );
  }
}
