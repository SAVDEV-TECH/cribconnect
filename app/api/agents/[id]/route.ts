import { NextRequest, NextResponse } from "next/server";
import { MOCK_USERS, MOCK_AGENT_PROFILES, MOCK_LISTINGS, MOCK_REVIEWS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params; // This is the user ID
    try {
      const { prisma } = await import("@/lib/prisma");
      const agent = await prisma.user.findUnique({
        where: { id },
        include: {
          agentProfile: { include: { reviewsReceived: { include: { student: { select: { name: true, avatar: true, currentSchool: true } } }, orderBy: { createdAt: "desc" } } } },
          listings: { where: { isAvailable: true }, orderBy: { isFeatured: "desc" } },
        },
      });
      if (!agent || agent.role !== "AGENT") return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      return NextResponse.json({ agent });
    } catch {
      const user = MOCK_USERS.find(u => u.id === id && u.role === "AGENT");
      if (!user) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      const profile = MOCK_AGENT_PROFILES.find(p => p.userId === id) || null;
      const reviews = MOCK_REVIEWS.filter(r => r.agentProfileId === profile?.id).map(r => {
        const student = MOCK_USERS.find(u => u.id === r.studentId)!;
        return { ...r, student: { name: student.name, avatar: student.avatar, currentSchool: student.currentSchool } };
      });
      const listings = MOCK_LISTINGS.filter(l => l.agentId === id && l.isAvailable);
      return NextResponse.json({
        agent: { ...user, agentProfile: profile ? { ...profile, reviewsReceived: reviews } : null, listings },
      });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch agent" }, { status: 500 });
  }
}
