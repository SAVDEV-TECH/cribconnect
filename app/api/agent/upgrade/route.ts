import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, paymentReference } = await req.json();

    const currentProfile = await prisma.agentProfile.findUnique({
      where: { userId: user.id },
    });

    const currentBadges = currentProfile ? JSON.parse(currentProfile.badges || "[]") : [];
    if (!currentBadges.includes("Pro Agent")) {
      currentBadges.push("Pro Agent");
    }

    const profile = await prisma.agentProfile.upsert({
      where: { userId: user.id },
      update: {
        tier: "PRO",
        featuredListingCredits: { increment: 3 },
        badges: JSON.stringify(currentBadges),
      },
      create: {
        userId: user.id,
        tier: "PRO",
        featuredListingCredits: 3,
        badges: JSON.stringify(["Pro Agent"]),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to CribConnect Pro! Reference: ${paymentReference || "PAY-MOCK-OK"}`,
      profile,
    });
  } catch (error) {
    console.error("Failed to upgrade tier:", error);
    return NextResponse.json({ error: "Failed to upgrade tier" }, { status: 500 });
  }
}
