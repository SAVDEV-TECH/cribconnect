import { NextRequest, NextResponse } from "next/server";
import { getListingsStore, addListingStore, Listing } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();
    const neighborhood = searchParams.get("neighborhood");
    const propertyType = searchParams.get("propertyType");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const featured = searchParams.get("featured");

    let listings = getListingsStore();

    if (featured === "true") {
      listings = listings.filter((l) => l.isFeatured);
    }

    if (neighborhood && neighborhood !== "ALL") {
      listings = listings.filter((l) =>
        l.neighborhood.toLowerCase().includes(neighborhood.toLowerCase())
      );
    }

    if (propertyType && propertyType !== "ALL") {
      listings = listings.filter((l) => l.propertyType === propertyType);
    }

    if (minPrice) {
      listings = listings.filter((l) => l.price >= parseFloat(minPrice));
    }

    if (maxPrice) {
      listings = listings.filter((l) => l.price <= parseFloat(maxPrice));
    }

    if (search) {
      listings = listings.filter(
        (l) =>
          l.title.toLowerCase().includes(search) ||
          l.description.toLowerCase().includes(search) ||
          l.address.toLowerCase().includes(search) ||
          l.neighborhood.toLowerCase().includes(search) ||
          l.universityNearby.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("Failed to fetch listings:", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title || !body.price || !body.neighborhood) {
      return NextResponse.json(
        { error: "Please provide title, price, and neighborhood" },
        { status: 400 }
      );
    }

    const price = parseFloat(body.price);
    const cautionFee = body.cautionFee ? parseFloat(body.cautionFee) : Math.round(price * 0.1);
    const agencyFee = body.agencyFee ? parseFloat(body.agencyFee) : Math.round(price * 0.1);

    const newListing = addListingStore({
      agentId: body.agentId || "agent-user",
      agentName: body.agentName || "Verified Partner Agent",
      agentPhone: body.agentPhone || "+234 800 000 0000",
      agentWhatsapp: body.agentWhatsapp?.replace(/\D/g, "") || "2348000000000",
      agentAvatar: body.agentAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400",
      agentVerified: true,
      agencyName: body.agencyName || "Independent Verified Realtor",
      title: body.title,
      description: body.description || "Spacious and clean accommodation in a secure area.",
      price: price,
      period: body.period || "per year",
      propertyType: body.propertyType || "SELF_CONTAIN",
      bedrooms: parseInt(body.bedrooms) || 1,
      bathrooms: parseInt(body.bathrooms) || 1,
      address: body.address || body.neighborhood + ", Lagos",
      neighborhood: body.neighborhood,
      city: "Lagos",
      universityNearby: body.universityNearby || "University of Lagos (UNILAG)",
      distanceToCampusMinutes: parseInt(body.distanceToCampusMinutes) || 8,
      distanceDescription: body.distanceDescription || `${body.distanceToCampusMinutes || 8} mins to campus gate`,
      latitude: parseFloat(body.latitude) || 6.5186,
      longitude: parseFloat(body.longitude) || 3.3881,
      photos: body.photos && body.photos.length > 0
        ? body.photos
        : [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
          ],
      videoTourUrl: body.videoTourUrl || null,
      amenities: body.amenities || ["Borehole Water", "Prepaid Meter", "Fenced Gate"],
      isFeatured: body.isFeatured || false,
      cautionFee,
      agencyFee,
    });

    return NextResponse.json({ success: true, listing: newListing });
  } catch (error) {
    console.error("Failed to create listing:", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
