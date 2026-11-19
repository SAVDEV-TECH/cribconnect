import { NextRequest, NextResponse } from "next/server";
import { getReportsStore, addReportStore, updateReportStore } from "@/lib/data-store";
import { requireAdmin, requireAuth } from "@/lib/session";
import { sanitizeText, checkRateLimit, getClientIp } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

const ALLOWED_TARGET_TYPES = new Set(["LISTING", "AGENT"]);
const ALLOWED_STATUSES = new Set(["PENDING", "RESOLVED", "DISMISSED"]);

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const reports = await getReportsStore();
    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const clientIp = getClientIp(req);
    const { allowed } = checkRateLimit(`report:${clientIp}:${auth.context.user.id}`, 10, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many reports submitted recently. Please wait before trying again." },
        { status: 429 }
      );
    }

    const data = await req.json();
    const targetType = String(data.targetType || "").toUpperCase();
    const targetId = sanitizeText(data.targetId, 120);
    const reason = sanitizeText(data.reason, 200);
    const details = data.details ? sanitizeText(data.details, 1500) : null;

    if (!ALLOWED_TARGET_TYPES.has(targetType) || !targetId || !reason) {
      return NextResponse.json(
        { error: "Valid targetType (LISTING or AGENT), targetId, and reason are required." },
        { status: 400 }
      );
    }

    const report = await addReportStore({
      reporterId: auth.context.user.id,
      reporterName: auth.context.user.name,
      reporterEmail: auth.context.user.email,
      targetType: targetType as "LISTING" | "AGENT",
      targetId,
      reason,
      details,
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Failed to submit report:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { reportId, status, adminNotes } = await req.json();
    if (typeof reportId !== "string" || !reportId || !ALLOWED_STATUSES.has(String(status))) {
      return NextResponse.json(
        { error: "Valid reportId and status (PENDING, RESOLVED, or DISMISSED) are required." },
        { status: 400 }
      );
    }

    const updated = await updateReportStore(reportId, {
      status,
      adminNotes: adminNotes ? sanitizeText(adminNotes, 500) : null,
    });

    if (!updated) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, report: updated });
  } catch (error) {
    console.error("Failed to update report:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
