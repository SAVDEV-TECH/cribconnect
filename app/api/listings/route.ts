import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const university = searchParams.get("university");
    const propertyType = searchParams.get("propertyType");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const neighborhood = searchParams.get("neighborhood");
    const featured = searchParams.get("featured");
    const agentId = searchParams.get("agentId");

    const where: any = {
      isAvailable: true,
    };

    if (agentId) {
      where.agentId = agentId;
      delete where.isAvailable; // Agent sees all their listings
    }

    if (featured === "true") {
      where.isFeatured = true;
    }

    if (university && university !== "ALL") {
      where.universityNearby = {
        contains: university,
      };
    }

    if (propertyType && propertyType !== "ALL") {
      where.propertyType = propertyType;
    }

    if (neighborhood && neighborhood !== "ALL") {
      where.neighborhood = {
        contains: neighborhood,
      };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { address: { contains: search } },
        { neighborhood: { contains: search } },
      ];
    }

    const listings = await prisma.listing.findMany({
      where,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            whatsapp: true,
            avatar: true,
            agentProfile: true,
          },
        },
      },
      orderBy: [
        { isFeatured: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("Failed to fetch listings:", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "AGENT" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Only registered agents can post property listings." },
        { status: 403 }
      );
    }

    const agentProfile = user.agentProfile;
    const isPro = agentProfile?.tier === "PRO";

    // Enforce Freemium tier limit for FREE agents (max 2 listings)
    if (!isPro && user.role !== "ADMIN") {
      const activeCount = await prisma.listing.count({
        where: { agentId: user.id },
      });
      if (activeCount >= 2) {
        return NextResponse.json(
          {
            error: "Free Tier limit reached (maximum 2 listings). Please upgrade to CribConnect Pro for unlimited listings, featured badge placement, and lead analytics.",
            limitReached: true,
          },
          { status: 403 }
        );
      }
    }

    const data = await req.json();

    const newListing = await prisma.listing.create({
      data: {
        agentId: user.id,
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        currency: data.currency || "NGN",
        period: data.period || "per year",
        propertyType: data.propertyType || "SELF_CONTAIN",
        bedrooms: parseInt(data.bedrooms) || 1,
        bathrooms: parseInt(data.bathrooms) || 1,
        address: data.address,
        neighborhood: data.neighborhood || "Akoka",
        city: data.city || "Lagos",
        universityNearby: data.universityNearby || "University of Lagos (UNILAG)",
        distanceToCampusMinutes: parseInt(data.distanceToCampusMinutes) || 10,
        distanceDescription: data.distanceDescription || `${data.distanceToCampusMinutes || 10} mins to campus gate`,
        latitude: parseFloat(data.latitude) || 6.5186,
        longitude: parseFloat(data.longitude) || 3.3881,
        photos: JSON.stringify(data.photos || []),
        videoTourUrl: data.videoTourUrl || null,
        amenities: JSON.stringify(data.amenities || []),
        isFeatured: data.isFeatured || false,
      },
    });

    return NextResponse.json({ success: true, listing: newListing });
  } catch (error) {
    console.error("Failed to create listing:", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
