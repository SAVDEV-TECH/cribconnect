import { NextRequest, NextResponse } from "next/server";
import { updateEscrowStatus, getEscrowById } from "@/lib/data-store";
import {
  checkRateLimit,
  getClientIp,
  sanitizeText,
  timingSafeStringEqual,
} from "@/lib/auth-security";
import { getSessionContext } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const action = typeof body.action === "string" ? body.action.trim().toUpperCase() : "";
    const pin = typeof body.pin === "string" ? body.pin.trim() : undefined;
    const reason = body.reason ? sanitizeText(body.reason, 500) : undefined;
    const lookupToken =
      (typeof body.lookupToken === "string" ? body.lookupToken.trim() : "") ||
      req.headers.get("x-escrow-token")?.trim() ||
      "";

    if (!id || !action) {
      return NextResponse.json(
        { error: "Escrow ID and action are required." },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(req);
    const { allowed } = checkRateLimit(`escrow-action:${clientIp}:${id}`, 8, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many escrow attempts. Please wait 15 minutes before trying again." },
        { status: 429 }
      );
    }

    const escrow = await getEscrowById(id);
    if (!escrow) {
      return NextResponse.json({ error: "Escrow record not found." }, { status: 404 });
    }

    const session = await getSessionContext();
    const hasValidLookupToken = Boolean(
      lookupToken && escrow.lookupToken && timingSafeStringEqual(lookupToken, escrow.lookupToken)
    );
    const isStudentOwner = Boolean(
      session &&
        (session.user.id === escrow.studentUserId ||
          session.user.email.toLowerCase() === escrow.studentEmail.toLowerCase())
    );
    const isAssignedAgent = Boolean(session && escrow.agentId && session.user.id === escrow.agentId);
    const isAdmin = Boolean(session?.isAdmin);

    if (action === "RELEASE") {
      // Allow the student (session or lookupToken), the assigned agent (entering student's PIN), or an admin
      if (!hasValidLookupToken && !isStudentOwner && !isAssignedAgent && !isAdmin) {
        return NextResponse.json(
          { error: "Unauthorized. You must be the student, assigned agent, or an admin to release escrow." },
          { status: 401 }
        );
      }

      const res = await updateEscrowStatus(id, "RELEASED_TO_AGENT", pin);
      if (!res.success || !res.escrow) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }

      const { releasePin: _pin, lookupToken: _tok, ...safeEscrow } = res.escrow;
      return NextResponse.json({
        success: true,
        message: `₦${escrow.agentPayout.toLocaleString()} successfully released to ${escrow.agentName}!`,
        escrow: safeEscrow,
      });
    }

    if (action === "REFUND") {
      // ONLY the student who created the escrow (via session or lookupToken) or an admin can request/approve refund
      if (!hasValidLookupToken && !isStudentOwner && !isAdmin) {
        return NextResponse.json(
          { error: "Unauthorized. Only the student or an administrator can cancel/refund this escrow." },
          { status: 403 }
        );
      }

      const res = await updateEscrowStatus(
        id,
        "REFUNDED_TO_STUDENT",
        undefined,
        reason || "Student rejected property during physical inspection."
      );
      if (!res.success || !res.escrow) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }

      const { releasePin: _pin, lookupToken: _tok, ...safeEscrow } = res.escrow;
      return NextResponse.json({
        success: true,
        message: `₦${escrow.amount.toLocaleString()} refund request logged for ${escrow.studentName}. Our Escrow team will complete your return.`,
        escrow: safeEscrow,
      });
    }

    if (action === "DISPUTE") {
      if (!hasValidLookupToken && !isStudentOwner && !isAssignedAgent && !isAdmin) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }

      const res = await updateEscrowStatus(
        id,
        "DISPUTED",
        undefined,
        reason || "Dispute opened for CribConnect Trust & Safety review."
      );
      if (!res.success || !res.escrow) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }

      const { releasePin: _pin, lookupToken: _tok, ...safeEscrow } = res.escrow;
      return NextResponse.json({
        success: true,
        message: "Dispute submitted. Escrow funds remain locked pending review.",
        escrow: safeEscrow,
      });
    }

    return NextResponse.json({ error: "Invalid escrow action." }, { status: 400 });
  } catch (error) {
    console.error("Escrow action error:", error);
    return NextResponse.json(
      { error: "Failed to process escrow action." },
      { status: 500 }
    );
  }
}
