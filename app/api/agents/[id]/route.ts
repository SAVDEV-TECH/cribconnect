import { NextRequest, NextResponse } from "next/server";
import { getUsersStore, getListingsStore } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const [users, listings] = await Promise.all([getUsersStore(), getListingsStore()]);

    const user = users.find((u) => u.id === id || `profile-${u.id}` === id);
    const matchingListings = listings.filter(
      (l) =>
        l.agentId === id ||
        `profile-${l.agentId}` === id ||
        (user && (l.agentId === user.id || l.agentName.toLowerCase() === user.name.toLowerCase()))
    );

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

    const profile = {
      id: `profile-${resolvedUser.id}`,
      userId: resolvedUser.id,
      agencyName: user?.agencyName || firstListing?.agencyName || "Independent Verified Realtor",
      verificationStatus: "VERIFIED",
      tier: "PRO",
      badges: JSON.stringify(["Verified Agent", "UNIPORT Specialist"]),
      rating: 5.0,
      reviewCount: user?.tenantsHousedCount || matchingListings.length || 1,
      bio:
        user?.bio ||
        `Verified student housing provider around UNIPORT Port Harcourt.`,
      yearsExperience: 3,
      campusSpecialization: user?.specializations || "University of Port Harcourt (UNIPORT)",
      coverageAreas: JSON.stringify(["Choba", "Aluu", "Ozuoba", "Rumuola"]),
      user: resolvedUser,
      reviewsReceived: [],
    };

    return NextResponse.json({ profile, agent: resolvedUser });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch agent" }, { status: 500 });
  }
}
