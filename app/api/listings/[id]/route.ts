import { NextRequest, NextResponse } from "next/server";
import { MOCK_LISTINGS, MOCK_USERS, MOCK_AGENT_PROFILES, MOCK_REVIEWS, getListingWithAgent } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    try {
      const { prisma } = await import("@/lib/prisma");
      const listing = await prisma.listing.findUnique({
        where: { id },
        include: {
          agent: {
            select: {
              id: true, name: true, email: true, phone: true, whatsapp: true, avatar: true,
              agentProfile: { include: { reviewsReceived: { include: { student: { select: { name: true, avatar: true, currentSchool: true } } }, orderBy: { createdAt: "desc" } } } },
            },
          },
        },
      });
      if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
      // Best-effort view count increment
      prisma.listing.update({ where: { id }, data: { viewsCount: { increment: 1 } } }).catch(() => {});
      return NextResponse.json({ listing });
    } catch {
      // Fallback to mock data
      const mockListing = MOCK_LISTINGS.find(l => l.id === id);
      if (!mockListing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
      const agent = MOCK_USERS.find(u => u.id === mockListing.agentId)!;
      const agentProfile = MOCK_AGENT_PROFILES.find(p => p.userId === mockListing.agentId) || null;
      const reviews = MOCK_REVIEWS.filter(r => r.agentProfileId === agentProfile?.id).map(r => {
        const student = MOCK_USERS.find(u => u.id === r.studentId)!;
        return { ...r, student: { name: student.name, avatar: student.avatar, currentSchool: student.currentSchool } };
      });
      const listing = {
        ...mockListing,
        agent: { ...agent, agentProfile: agentProfile ? { ...agentProfile, reviewsReceived: reviews } : null },
      };
      return NextResponse.json({ listing });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ success: true, demo: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ success: true, demo: true });
}
