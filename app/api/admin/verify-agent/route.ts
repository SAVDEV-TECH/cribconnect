import { NextRequest, NextResponse } from "next/server";
import { getListingsStore, updateListingStore, updateUser } from "@/lib/data-store";
import { requireAdmin } from "@/lib/session";
import { sanitizeText } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { agentProfileId, userId, action, notes, badges } = await req.json();
    const targetUserId = String(userId || agentProfileId || "").replace(/^profile-/, "").trim();

    if (!targetUserId || (action !== "APPROVE" && action !== "REJECT")) {
      return NextResponse.json(
        { error: "Valid userId/agentProfileId and action (APPROVE or REJECT) are required." },
        { status: 400 }
      );
    }

    const isApprove = action === "APPROVE";
    const cleanBadges =
      isApprove && Array.isArray(badges) && badges.length > 0
        ? badges.map((b: unknown) => sanitizeText(b, 60)).filter(Boolean)
        : isApprove
        ? ["Verified Agent", "UNIPORT Specialist", "ID Validated"]
        : [];

    const updated = await updateUser(targetUserId, {
      isVerified: isApprove,
      verificationStatus: isApprove ? "VERIFIED" : "REJECTED",
      verificationNotes: notes
        ? sanitizeText(notes, 500)
        : isApprove
        ? "Official government ID verified by CribConnect trust officer."
        : "Application rejected due to insufficient or unreadable documentation.",
      badges: cleanBadges,
    });

    if (!updated) {
      return NextResponse.json({ error: "Agent user not found." }, { status: 404 });
    }

    // Keep agentVerified flag synced across their listings
    const allListings = await getListingsStore();
    await Promise.all(
      allListings
        .filter((l) => l.agentId === updated.id)
        .map((l) => updateListingStore(l.id, { agentVerified: isApprove }))
    );

    return NextResponse.json({
      success: true,
      profile: {
        id: `profile-${updated.id}`,
        userId: updated.id,
        verificationStatus: updated.verificationStatus,
        verificationNotes: updated.verificationNotes,
        badges: updated.badges,
      },
    });
  } catch (error) {
    console.error("Failed to process agent verification:", error);
    return NextResponse.json({ error: "Failed to process agent verification" }, { status: 500 });
  }
}
