import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { agencyName, ninNumber, idDocumentUrl, bio, campusSpecialization, coverageAreas } = data;

    const profile = await prisma.agentProfile.upsert({
      where: { userId: user.id },
      update: {
        agencyName,
        ninNumber,
        idDocumentUrl,
        bio,
        campusSpecialization,
        coverageAreas: JSON.stringify(coverageAreas || ["Akoka", "Yaba"]),
        verificationStatus: "PENDING",
        verificationNotes: "Identity documents submitted for manual administrator verification.",
      },
      create: {
        userId: user.id,
        agencyName,
        ninNumber,
        idDocumentUrl,
        bio,
        campusSpecialization,
        coverageAreas: JSON.stringify(coverageAreas || ["Akoka", "Yaba"]),
        verificationStatus: "PENDING",
        verificationNotes: "Identity documents submitted for manual administrator verification.",
        tier: "FREE",
        badges: JSON.stringify([]),
      },
    });

    // Make sure user role is AGENT
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "AGENT" },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Failed to submit verification:", error);
    return NextResponse.json({ error: "Failed to submit verification" }, { status: 500 });
  }
}
