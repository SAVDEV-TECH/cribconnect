import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const reports = await prisma.report.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { targetType, targetId, reason, details } = data;

    if (!targetType || !targetId || !reason) {
      return NextResponse.json(
        { error: "Target type, target ID, and reason are required" },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        targetType,
        targetId,
        reason,
        details: details || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Failed to submit report:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { reportId, status, adminNotes } = await req.json();

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        adminNotes: adminNotes || null,
      },
    });

    return NextResponse.json({ success: true, report: updated });
  } catch (error) {
    console.error("Failed to update report:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
