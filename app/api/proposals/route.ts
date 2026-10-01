import { NextRequest, NextResponse } from "next/server";
import { MOCK_PROPOSALS, MOCK_USERS, MOCK_AGENT_PROFILES, MOCK_LISTINGS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");
    const agentId = searchParams.get("agentId");

    try {
      const { prisma } = await import("@/lib/prisma");
      const where: any = {};
      if (requestId) where.requestId = requestId;
      if (agentId) where.agentId = agentId;
      const proposals = await prisma.proposal.findMany({
        where,
        include: {
          agent: { select: { id: true, name: true, avatar: true, phone: true, whatsapp: true, agentProfile: true } },
          listing: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ proposals });
    } catch {
      let results = MOCK_PROPOSALS;
      if (requestId) results = results.filter(p => p.requestId === requestId);
      if (agentId) results = results.filter(p => p.agentId === agentId);
      const enriched = results.map(p => {
        const agent = MOCK_USERS.find(u => u.id === p.agentId)!;
        const agentProfile = MOCK_AGENT_PROFILES.find(ap => ap.userId === p.agentId) || null;
        const listing = p.listingId ? MOCK_LISTINGS.find(l => l.id === p.listingId) || null : null;
        return { ...p, agent: { ...agent, agentProfile }, listing };
      });
      return NextResponse.json({ proposals: enriched });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ success: true, demo: true, message: "Proposal submitted! (Demo mode)" });
}

export async function PATCH(req: NextRequest) {
  return NextResponse.json({ success: true, demo: true });
}
