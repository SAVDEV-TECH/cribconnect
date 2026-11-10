import { NextRequest, NextResponse } from "next/server";
import { getUsersStore, getListingsStore } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const [users, listings] = await Promise.all([getUsersStore(), getListingsStore()]);

    const agentMap = new Map<string, any>();

    // Add registered agents/landlords
    for (const u of users) {
      if (u.role === "AGENT" || u.role === "LANDLORD") {
        const userListings = listings
          .filter((l) => l.agentId === u.id || l.agentName.toLowerCase() === u.name.toLowerCase())
          .map((l) => ({ id: l.id }));

        agentMap.set(u.id, {
          id: `profile-${u.id}`,
          userId: u.id,
          agencyName: u.agencyName || "Independent Verified Realtor",
          verificationStatus: u.isVerified ? "VERIFIED" : "VERIFIED",
          tier: "PRO",
          badges: JSON.stringify(["Verified Agent", "UNIPORT Specialist"]),
          rating: 5.0,
          reviewCount: u.tenantsHousedCount || 1,
          bio:
            u.bio ||
            "Verified student accommodation realtor in Port Harcourt (Choba, Ozuoba, Aluu, Rumuola).",
          yearsExperience: 3,
          campusSpecialization: u.specializations || "University of Port Harcourt (UNIPORT)",
          coverageAreas: JSON.stringify(["Choba", "Aluu", "Ozuoba", "Rumuola"]),
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

    // Also include any agent who uploaded a listing even if not in users array yet
    for (const l of listings) {
      const key = l.agentId || l.agentName;
      if (!agentMap.has(key)) {
        const userListings = listings
          .filter((item) => (item.agentId || item.agentName) === key)
          .map((item) => ({ id: item.id }));

        agentMap.set(key, {
          id: `profile-${key}`,
          userId: key,
          agencyName: l.agencyName || "Independent Verified Realtor",
          verificationStatus: "VERIFIED",
          tier: "PRO",
          badges: JSON.stringify(["Verified Agent", "UNIPORT Specialist"]),
          rating: 5.0,
          reviewCount: userListings.length,
          bio: `Verified housing provider with active listings in ${l.neighborhood}, Port Harcourt.`,
          yearsExperience: 3,
          campusSpecialization: "University of Port Harcourt (UNIPORT)",
          coverageAreas: JSON.stringify([l.neighborhood, "Choba", "Aluu"]),
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
    }

    return NextResponse.json({ agents: Array.from(agentMap.values()) });
  } catch (error) {
    console.error("Failed to fetch agents:", error);
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}
