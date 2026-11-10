import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getListingsStore, addListingStore, getUserById } from "@/lib/data-store";
import { verifySessionToken } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

const PH_NEIGHBORHOOD_COORDS: Record<string, { lat: number; lng: number }> = {
  Choba: { lat: 4.8984, lng: 6.9315 },
  Ozuoba: { lat: 4.9245, lng: 6.9078 },
  Aluu: { lat: 4.9112, lng: 6.9187 },
  Rumuola: { lat: 4.8143, lng: 7.0135 },
  Rumuokoro: { lat: 4.8631, lng: 7.0219 },
  "GRA Port Harcourt": { lat: 4.8156, lng: 7.0497 },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();
    const neighborhood = searchParams.get("neighborhood");
    const propertyType = searchParams.get("propertyType");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const featured = searchParams.get("featured");

    let listings = await getListingsStore();

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

    // Check logged-in session user so we link the listing to their account
    let sessionUser: any = null;
    try {
      const cookieStore = cookies();
      const token = cookieStore.get("cribconnect_session")?.value;
      if (token) {
        const payload = verifySessionToken(token);
        if (payload) {
          sessionUser = (await getUserById(payload.userId)) || payload;
        }
      }
    } catch {}

    const price = parseFloat(body.price);
    const cautionFee = body.cautionFee ? parseFloat(body.cautionFee) : Math.round(price * 0.1);
    const agencyFee = body.agencyFee ? parseFloat(body.agencyFee) : Math.round(price * 0.1);

    const coords = PH_NEIGHBORHOOD_COORDS[body.neighborhood] || { lat: 4.8984, lng: 6.9315 };
    const jitterLat = (Math.random() - 0.5) * 0.004;
    const jitterLng = (Math.random() - 0.5) * 0.004;

    const newListing = await addListingStore({
      agentId: body.agentId || sessionUser?.id || sessionUser?.userId || "agent-user",
      agentName: body.agentName || sessionUser?.name || "Verified Partner Agent",
      agentPhone: body.agentPhone || sessionUser?.phone || "+234 800 000 0000",
      agentWhatsapp:
        (body.agentWhatsapp || body.agentPhone || sessionUser?.whatsapp || sessionUser?.phone || "")
          .replace(/\D/g, "") || "2348000000000",
      agentAvatar:
        body.agentAvatar ||
        sessionUser?.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
          body.agentName || sessionUser?.name || "Agent"
        )}`,
      agentVerified: true,
      agencyName: body.agencyName || sessionUser?.agencyName || "Independent Verified Realtor",
      title: body.title,
      description: body.description || "Spacious and clean accommodation in a secure area.",
      price: price,
      period: body.period || "per year",
      propertyType: body.propertyType || "SELF_CONTAIN",
      bedrooms: parseInt(body.bedrooms) || 1,
      bathrooms: parseInt(body.bathrooms) || 1,
      address: body.address || `${body.neighborhood}, Port Harcourt`,
      neighborhood: body.neighborhood,
      city: "Port Harcourt",
      universityNearby: body.universityNearby || "University of Port Harcourt (UNIPORT)",
      distanceToCampusMinutes: parseInt(body.distanceToCampusMinutes) || 8,
      distanceDescription:
        body.distanceDescription || `${body.distanceToCampusMinutes || 8} mins to UNIPORT gate`,
      latitude: parseFloat(body.latitude) || coords.lat + jitterLat,
      longitude: parseFloat(body.longitude) || coords.lng + jitterLng,
      photos:
        body.photos && body.photos.length > 0
          ? body.photos
          : [
              "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
            ],
      videoTourUrl: body.videoTourUrl || null,
      amenities:
        body.amenities && body.amenities.length > 0
          ? body.amenities
          : ["Borehole Water", "24/7 Security", "Prepaid Meter", "Tiled Floors"],
      isFeatured: true,
      cautionFee,
      agencyFee,
    });

    return NextResponse.json({ success: true, listing: newListing });
  } catch (error) {
    console.error("Failed to create listing:", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
