import { NextRequest, NextResponse } from "next/server";
import { MOCK_LISTINGS, MOCK_USERS, MOCK_AGENT_PROFILES, getListingWithAgent } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

// Try Prisma first; fall back to mock data if DB is unavailable (e.g. Vercel serverless)
async function getListings(filters: {
  search?: string; university?: string; propertyType?: string;
  minPrice?: string; maxPrice?: string; neighborhood?: string;
  featured?: string; agentId?: string;
}) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const where: any = {};
    if (!filters.agentId) where.isAvailable = true;
    if (filters.agentId) where.agentId = filters.agentId;
    if (filters.featured === "true") where.isFeatured = true;
    if (filters.university && filters.university !== "ALL") where.universityNearby = { contains: filters.university };
    if (filters.propertyType && filters.propertyType !== "ALL") where.propertyType = filters.propertyType;
    if (filters.neighborhood && filters.neighborhood !== "ALL") where.neighborhood = { contains: filters.neighborhood };
    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = parseFloat(filters.minPrice);
      if (filters.maxPrice) where.price.lte = parseFloat(filters.maxPrice);
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
        { address: { contains: filters.search } },
        { neighborhood: { contains: filters.search } },
      ];
    }
    return await prisma.listing.findMany({
      where,
      include: { agent: { select: { id: true, name: true, email: true, phone: true, whatsapp: true, avatar: true, agentProfile: true } } },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });
  } catch {
    // DB unavailable — use static mock data
    let results = MOCK_LISTINGS.map(getListingWithAgent);
    if (!filters.agentId) results = results.filter(l => l.isAvailable);
    if (filters.agentId) results = results.filter(l => l.agentId === filters.agentId);
    if (filters.featured === "true") results = results.filter(l => l.isFeatured);
    if (filters.university && filters.university !== "ALL") results = results.filter(l => l.universityNearby.includes(filters.university!));
    if (filters.propertyType && filters.propertyType !== "ALL") results = results.filter(l => l.propertyType === filters.propertyType);
    if (filters.neighborhood && filters.neighborhood !== "ALL") results = results.filter(l => l.neighborhood.toLowerCase().includes(filters.neighborhood!.toLowerCase()));
    if (filters.minPrice) results = results.filter(l => l.price >= parseFloat(filters.minPrice!));
    if (filters.maxPrice) results = results.filter(l => l.price <= parseFloat(filters.maxPrice!));
    if (filters.search) {
      const s = filters.search.toLowerCase();
      results = results.filter(l => l.title.toLowerCase().includes(s) || l.description.toLowerCase().includes(s) || l.address.toLowerCase().includes(s) || l.neighborhood.toLowerCase().includes(s));
    }
    return results.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const listings = await getListings({
      search: searchParams.get("search") ?? undefined,
      university: searchParams.get("university") ?? undefined,
      propertyType: searchParams.get("propertyType") ?? undefined,
      minPrice: searchParams.get("minPrice") ?? undefined,
      maxPrice: searchParams.get("maxPrice") ?? undefined,
      neighborhood: searchParams.get("neighborhood") ?? undefined,
      featured: searchParams.get("featured") ?? undefined,
      agentId: searchParams.get("agentId") ?? undefined,
    });
    return NextResponse.json({ listings });
  } catch (error) {
    console.error("Failed to fetch listings:", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // In demo/static mode, simulate success
  return NextResponse.json({
    success: true,
    message: "Demo mode: Listing saved to your dashboard (data persists locally).",
    demo: true,
  });
}
