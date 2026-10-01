import { NextRequest, NextResponse } from "next/server";
import { MOCK_HOUSING_REQUESTS, MOCK_USERS, MOCK_PROPOSALS, getRequestWithDetails } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "OPEN";
    const studentId = searchParams.get("studentId");

    try {
      const { prisma } = await import("@/lib/prisma");
      const where: any = {};
      if (status && status !== "ALL") where.status = status;
      if (studentId) where.studentId = studentId;
      const requests = await prisma.housingRequest.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, avatar: true, city: true, currentSchool: true } },
          proposals: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ requests });
    } catch {
      // Fallback to mock data
      let results = MOCK_HOUSING_REQUESTS.map(getRequestWithDetails);
      if (status && status !== "ALL") results = results.filter(r => r.status === status);
      if (studentId) results = results.filter(r => r.studentId === studentId);
      return NextResponse.json({ requests: results });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ success: true, demo: true, message: "Request posted! Agents will be notified. (Demo mode)" });
}
