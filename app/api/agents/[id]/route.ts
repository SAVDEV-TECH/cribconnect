import { NextRequest, NextResponse } from "next/server";
import { getUsersStore, getListingsStore } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const [users, listings] = await Promise.all([getUsersStore(), getListingsStore()]);

    const user = users.find((u) => u.id === id || `profile-${u.id}` === id);
    const targetId = user?.id || id.replace(/^profile-/, "");
    const matchingListings = listings.filter((l) => l.agentId === targetId);

    if (!user && matchingListings.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const firstListing = matchingListings[0];
    const resolvedUser = {
      id: user?.id || firstListing.agentId,
      name: user?.name || firstListing.agentName,
      avatar: user?.avatar || firstListing.agentAvatar,
      phone: user?.phone || firstListing.agentPhone,
      whatsapp: user?.whatsapp || firstListing.agentWhatsapp,
      city: "Port Harcourt",
      listings: matchingListings,
    };

    const isVerified = user ? Boolean(user.isVerified) : Boolean(firstListing?.agentVerified);
    const verificationStatus = isVerified
      ? "VERIFIED"
      : user?.verificationStatus || "UNVERIFIED";
    const badges =
      user && Array.isArray(user.badges) && user.badges.length > 0
        ? user.badges
        : isVerified
        ? ["Verified Agent", "UNIPORT Specialist"]
        : [];
    const coverageAreas =
      user && Array.isArray(user.coverageAreas) && user.coverageAreas.length > 0
        ? user.coverageAreas
        : Array.from(new Set(matchingListings.map((l) => l.neighborhood).filter(Boolean)));

    const profile = {
      id: `profile-${resolvedUser.id}`,
      userId: resolvedUser.id,
      agencyName: user?.agencyName || firstListing?.agencyName || "Independent Realtor",
      verificationStatus,
      tier: user?.tier || (firstListing?.isFeatured ? "PRO" : "FREE"),
      badges: JSON.stringify(badges),
      rating: null,
      reviewCount: 0,
      tenantsHousedCount: user?.tenantsHousedCount || 0,
      bio:
        user?.bio ||
        `Student housing provider around UNIPORT, Port Harcourt.`,
      campusSpecialization: user?.specializations || "University of Port Harcourt (UNIPORT)",
      coverageAreas: JSON.stringify(
        coverageAreas.length > 0 ? coverageAreas : ["Choba", "Aluu", "Ozuoba"]
      ),
      user: resolvedUser,
      reviewsReceived: [],
    };

    return NextResponse.json({ profile, agent: resolvedUser });
  } catch (error) {
    console.error("Failed to fetch agent:", error);
    return NextResponse.json({ error: "Failed to fetch agent" }, { status: 500 });
  }
}
