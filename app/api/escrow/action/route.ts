import { NextRequest, NextResponse } from "next/server";
import { updateEscrowStatus, getEscrowById } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, pin, reason } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: "Escrow ID and action are required." },
        { status: 400 }
      );
    }

    const escrow = getEscrowById(id);
    if (!escrow) {
      return NextResponse.json({ error: "Escrow record not found." }, { status: 404 });
    }

    if (action === "RELEASE") {
      const res = updateEscrowStatus(id, "RELEASED_TO_AGENT", pin);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: `₦${escrow.agentPayout.toLocaleString()} successfully released to ${escrow.agentName}!`,
        escrow: res.escrow,
      });
    }

    if (action === "REFUND") {
      const res = updateEscrowStatus(
        id,
        "REFUNDED_TO_STUDENT",
        undefined,
        reason || "Student rejected property during physical inspection."
      );

      return NextResponse.json({
        success: true,
        message: `₦${escrow.amount.toLocaleString()} 100% full refund approved and returned to ${escrow.studentName}.`,
        escrow: res.escrow,
      });
    }

    return NextResponse.json({ error: "Invalid escrow action." }, { status: 400 });
  } catch (error: any) {
    console.error("Escrow action error:", error);
    return NextResponse.json(
      { error: "Failed to process escrow action." },
      { status: 500 }
    );
  }
}
