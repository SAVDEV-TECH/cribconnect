import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const { agentProfileId, action, notes, badges } = await req.json();

    if (!agentProfileId || !action) {
      return NextResponse.json(
        { error: "agentProfileId and action (APPROVE or REJECT) are required." },
        { status: 400 }
      );
    }

    let verificationStatus = "UNVERIFIED";
    let defaultBadges: string[] = [];

    if (action === "APPROVE") {
      verificationStatus = "VERIFIED";
      defaultBadges = badges || ["Verified Agent", "UNILAG Specialist", "ID Validated"];
    } else if (action === "REJECT") {
      verificationStatus = "REJECTED";
      defaultBadges = [];
    }

    const updated = await prisma.agentProfile.update({
      where: { id: agentProfileId },
      data: {
        verificationStatus,
        verificationNotes: notes || (action === "APPROVE" ? "Official government ID verified by platform trust officer." : "Application rejected due to insufficient or unreadable documentation."),
        badges: JSON.stringify(defaultBadges),
      },
      include: { user: true },
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    console.error("Failed to process agent verification:", error);
    return NextResponse.json({ error: "Failed to process agent verification" }, { status: 500 });
  }
}
