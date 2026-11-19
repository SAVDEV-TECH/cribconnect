import { NextResponse } from "next/server";
import { getUsersStore, getListingsStore } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [users, listings] = await Promise.all([getUsersStore(), getListingsStore()]);

    const agentMap = new Map<string, any>();

    // Add registered agents/landlords
    for (const u of users) {
      if (u.role === "AGENT" || u.role === "LANDLORD") {
        const userListings = listings
          .filter((l) => l.agentId === u.id)
          .map((l) => ({ id: l.id }));

        const verificationStatus = u.isVerified
          ? "VERIFIED"
          : u.verificationStatus || "UNVERIFIED";
        const badges =
          Array.isArray(u.badges) && u.badges.length > 0
            ? u.badges
            : u.isVerified
            ? ["Verified Agent", "UNIPORT Specialist"]
            : [];
        const coverageAreas =
          Array.isArray(u.coverageAreas) && u.coverageAreas.length > 0
            ? u.coverageAreas
            : ["Choba", "Aluu", "Ozuoba", "Rumuola"];

        agentMap.set(u.id, {
          id: `profile-${u.id}`,
          userId: u.id,
          agencyName: u.agencyName || "Independent Realtor",
          verificationStatus,
          tier: u.tier || "FREE",
          badges: JSON.stringify(badges),
          rating: null,
          reviewCount: 0,
          tenantsHousedCount: u.tenantsHousedCount || 0,
          bio:
            u.bio ||
            "Port Harcourt housing provider covering Choba, Ozuoba, Aluu, Rumuola, and UNIPORT.",
          campusSpecialization: u.specializations || "University of Port Harcourt (UNIPORT)",
          coverageAreas: JSON.stringify(coverageAreas),
          user: {
            id: u.id,
            name: u.name,
            avatar: u.avatar,
            phone: u.phone,
            whatsapp: u.whatsapp,
            city: "Port Harcourt",
            listings: userListings,
          },
        });
      }
    }

    // Include any agent present on existing listings whose user record hasn't been added yet
    for (const l of listings) {
      const key = l.agentId;
      if (!key || agentMap.has(key)) continue;

      const userListings = listings
        .filter((item) => item.agentId === key)
        .map((item) => ({ id: item.id }));

      agentMap.set(key, {
        id: `profile-${key}`,
        userId: key,
        agencyName: l.agencyName || "Independent Realtor",
        verificationStatus: l.agentVerified ? "VERIFIED" : "UNVERIFIED",
        tier: l.isFeatured ? "PRO" : "FREE",
        badges: JSON.stringify(l.agentVerified ? ["Verified Agent"] : []),
        rating: null,
        reviewCount: 0,
        tenantsHousedCount: 0,
        bio: `Housing provider with active listings in ${l.neighborhood}, Port Harcourt.`,
        campusSpecialization: "University of Port Harcourt (UNIPORT)",
        coverageAreas: JSON.stringify([l.neighborhood]),
        user: {
          id: key,
          name: l.agentName,
          avatar: l.agentAvatar,
          phone: l.agentPhone,
          whatsapp: l.agentWhatsapp,
          city: "Port Harcourt",
          listings: userListings,
        },
      });
    }

    return NextResponse.json({ agents: Array.from(agentMap.values()) });
  } catch (error) {
    console.error("Failed to fetch agents:", error);
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}
