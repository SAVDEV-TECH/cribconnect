import { NextRequest, NextResponse } from "next/server";
import { MOCK_HOUSING_REQUESTS, MOCK_USERS, MOCK_PROPOSALS, MOCK_AGENT_PROFILES, MOCK_LISTINGS, getRequestWithDetails } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    try {
      const { prisma } = await import("@/lib/prisma");
      const request = await prisma.housingRequest.findUnique({
        where: { id },
        include: {
          student: { select: { id: true, name: true, avatar: true, city: true, currentSchool: true } },
          proposals: {
            include: {
              agent: { select: { id: true, name: true, avatar: true, phone: true, whatsapp: true, agentProfile: true } },
              listing: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
      return NextResponse.json({ request });
    } catch {
      const mockRequest = MOCK_HOUSING_REQUESTS.find(r => r.id === id);
      if (!mockRequest) return NextResponse.json({ error: "Request not found" }, { status: 404 });
      return NextResponse.json({ request: getRequestWithDetails(mockRequest) });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch request" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ success: true, demo: true });
}
