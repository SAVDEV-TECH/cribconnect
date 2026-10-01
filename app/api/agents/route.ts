import { NextRequest, NextResponse } from "next/server";
import { MOCK_USERS, MOCK_AGENT_PROFILES, MOCK_LISTINGS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const verifiedOnly = searchParams.get("verified");

    try {
      const { prisma } = await import("@/lib/prisma");
      const where: any = {};
      if (verifiedOnly === "true") where.verificationStatus = "VERIFIED";
      const agents = await prisma.agentProfile.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, avatar: true, phone: true, whatsapp: true, city: true, listings: { where: { isAvailable: true }, select: { id: true } } },
          },
        },
        orderBy: { rating: "desc" },
      });
      return NextResponse.json({ agents });
    } catch {
      // Fallback
      let profiles = MOCK_AGENT_PROFILES;
      if (verifiedOnly === "true") profiles = profiles.filter(p => p.verificationStatus === "VERIFIED");
      const agents = profiles.map(profile => {
        const user = MOCK_USERS.find(u => u.id === profile.userId)!;
        const listings = MOCK_LISTINGS.filter(l => l.agentId === user.id && l.isAvailable).map(l => ({ id: l.id }));
        return { ...profile, user: { ...user, listings } };
      });
      return NextResponse.json({ agents });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}
