import { NextRequest, NextResponse } from "next/server";
import { getListingsStore, addListingStore } from "@/lib/data-store";
import { requireAuth } from "@/lib/session";
import {
  checkRateLimit,
  isValidPhone,
  sanitizeText,
  sanitizeUrl,
} from "@/lib/auth-security";
import {
  PH_NEIGHBORHOOD_COORDS,
  formatNigerianWhatsApp,
  normalizeVideoTourUrl,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED_PROPERTY_TYPES = new Set([
  "SELF_CONTAIN",
  "ONE_BED",
  "TWO_BED",
  "THREE_BED",
  "HOSTEL_BED",
  "STUDIO",
]);

const ALLOWED_PERIODS = new Set(["per year", "per semester", "per month"]);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase();
    const neighborhood = searchParams.get("neighborhood")?.trim();
    const propertyType = searchParams.get("propertyType")?.trim();
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const featured = searchParams.get("featured");

    let listings = await getListingsStore();

    if (featured === "true") {
      listings = listings.filter((l) => l.isFeatured);
    }

    if (neighborhood && neighborhood !== "ALL") {
      const target = neighborhood.toLowerCase();
      listings = listings.filter((l) => (l.neighborhood || "").toLowerCase().includes(target));
    }

    if (propertyType && propertyType !== "ALL") {
      listings = listings.filter((l) => l.propertyType === propertyType);
    }

    if (minPriceParam !== null && minPriceParam !== "") {
      const minPrice = Number(minPriceParam);
      if (Number.isFinite(minPrice) && minPrice >= 0) {
        listings = listings.filter((l) => l.price >= minPrice);
      }
    }

    if (maxPriceParam !== null && maxPriceParam !== "") {
      const maxPrice = Number(maxPriceParam);
      if (Number.isFinite(maxPrice) && maxPrice >= 0) {
        listings = listings.filter((l) => l.price <= maxPrice);
      }
    }

    if (search) {
      listings = listings.filter(
        (l) =>
          (l.title || "").toLowerCase().includes(search) ||
          (l.description || "").toLowerCase().includes(search) ||
          (l.address || "").toLowerCase().includes(search) ||
          (l.neighborhood || "").toLowerCase().includes(search) ||
          (l.universityNearby || "").toLowerCase().includes(search)
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
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { user, isAdmin } = auth.context;
    const canList = isAdmin || user.role === "AGENT" || user.role === "LANDLORD";
    if (!canList) {
      return NextResponse.json(
        { error: "Only registered Agents or Landlords can publish property listings." },
        { status: 403 }
      );
    }

    const { allowed } = checkRateLimit(`listing-create:${user.id}`, 20, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Listing creation rate limit reached. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const title = sanitizeText(body.title, 160);
    const neighborhood = sanitizeText(body.neighborhood, 80);
    const price = Number(body.price);

    if (!title || !neighborhood || !Number.isFinite(price) || price <= 0 || price > 100_000_000) {
      return NextResponse.json(
        { error: "Please provide a valid title, neighborhood, and positive rent price." },
        { status: 400 }
      );
    }

    const parsedCaution =
      body.cautionFee !== undefined && body.cautionFee !== "" && body.cautionFee !== null
        ? Number(body.cautionFee)
        : Math.round(price * 0.1);
    const parsedAgency =
      body.agencyFee !== undefined && body.agencyFee !== "" && body.agencyFee !== null
        ? Number(body.agencyFee)
        : Math.round(price * 0.1);

    if (
      !Number.isFinite(parsedCaution) ||
      parsedCaution < 0 ||
      !Number.isFinite(parsedAgency) ||
      parsedAgency < 0
    ) {
      return NextResponse.json(
        { error: "Caution fee and agency fee must be valid non-negative numbers." },
        { status: 400 }
      );
    }

    const rawType = sanitizeText(body.propertyType || "SELF_CONTAIN", 30);
    const propertyType = ALLOWED_PROPERTY_TYPES.has(rawType) ? rawType : "SELF_CONTAIN";

    const rawPeriod = sanitizeText(body.period || "per year", 30).toLowerCase();
    const period = ALLOWED_PERIODS.has(rawPeriod) ? rawPeriod : "per year";

    const parsedBedrooms = Number(body.bedrooms);
    const bedrooms =
      Number.isFinite(parsedBedrooms) && parsedBedrooms >= 0
        ? Math.min(20, Math.floor(parsedBedrooms))
        : 1;

    const parsedBathrooms = Number(body.bathrooms);
    const bathrooms =
      Number.isFinite(parsedBathrooms) && parsedBathrooms >= 0
        ? Math.min(20, Math.floor(parsedBathrooms))
        : 1;

    const parsedDistance =
      body.distanceToCampusMinutes !== undefined && body.distanceToCampusMinutes !== ""
        ? Number(body.distanceToCampusMinutes)
        : 8;
    const distanceToCampusMinutes =
      Number.isFinite(parsedDistance) && parsedDistance >= 0
        ? Math.min(180, Math.floor(parsedDistance))
        : 8;

    // Validate optional video tour URL
    let validatedVideoUrl: string | null = null;
    if (typeof body.videoTourUrl === "string" && body.videoTourUrl.trim()) {
      const normalizedVideo = normalizeVideoTourUrl(body.videoTourUrl);
      if (!normalizedVideo) {
        return NextResponse.json(
          {
            error:
              "Invalid video tour URL. Upload a video file or provide a valid YouTube/Vimeo link.",
          },
          { status: 400 }
        );
      }
      validatedVideoUrl = normalizedVideo.src;
    }

    // Validate photos array (allow /api/media/*, https://, or data:image/* which addListingStore validates & offloads)
    const rawPhotos = Array.isArray(body.photos) ? body.photos : [];
    const safePhotos: string[] = [];
    for (const item of rawPhotos.slice(0, 12)) {
      if (typeof item !== "string" || !item.trim()) continue;
      const trimmed = item.trim();
      if (trimmed.startsWith("data:image/")) {
        safePhotos.push(trimmed);
      } else {
        const cleanUrl = sanitizeUrl(trimmed);
        if (cleanUrl) safePhotos.push(cleanUrl);
      }
    }

    const safeAmenities = Array.isArray(body.amenities)
      ? body.amenities
          .map((a: unknown) => sanitizeText(a, 60))
          .filter(Boolean)
          .slice(0, 20)
      : ["Borehole Water", "24/7 Security", "Prepaid Meter", "Tiled Floors"];

    const coords = PH_NEIGHBORHOOD_COORDS[neighborhood] || { lat: 4.8984, lng: 6.9315 };
    const jitterLat = (Math.random() - 0.5) * 0.004;
    const jitterLng = (Math.random() - 0.5) * 0.004;

    const parsedLat = Number(body.latitude);
    const parsedLng = Number(body.longitude);
    const latitude =
      Number.isFinite(parsedLat) && parsedLat >= -90 && parsedLat <= 90
        ? parsedLat
        : coords.lat + jitterLat;
    const longitude =
      Number.isFinite(parsedLng) && parsedLng >= -180 && parsedLng <= 180
        ? parsedLng
        : coords.lng + jitterLng;

    const contactPhone =
      body.agentPhone && isValidPhone(body.agentPhone)
        ? sanitizeText(body.agentPhone, 25)
        : user.phone;
    const contactWhatsapp =
      formatNigerianWhatsApp(body.agentWhatsapp || contactPhone || user.whatsapp || user.phone) ||
      formatNigerianWhatsApp(user.whatsapp || user.phone) ||
      "";

    const newListing = await addListingStore({
      agentId: user.id,
      agentName: user.name,
      agentPhone: contactPhone,
      agentWhatsapp: contactWhatsapp,
      agentAvatar:
        user.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
      agentVerified: Boolean(user.isVerified),
      agencyName:
        sanitizeText(body.agencyName, 100) || user.agencyName || "Independent Realtor",
      title,
      description:
        sanitizeText(body.description, 2000) ||
        "Spacious and clean accommodation in a secure area.",
      price: Math.round(price),
      period,
      propertyType,
      bedrooms,
      bathrooms,
      address: sanitizeText(body.address, 200) || `${neighborhood}, Port Harcourt`,
      neighborhood,
      city: "Port Harcourt",
      universityNearby:
        sanitizeText(body.universityNearby, 120) || "University of Port Harcourt (UNIPORT)",
      distanceToCampusMinutes,
      distanceDescription:
        sanitizeText(body.distanceDescription, 120) ||
        `${distanceToCampusMinutes} mins to UNIPORT gate`,
      latitude,
      longitude,
      photos: safePhotos,
      videoTourUrl: validatedVideoUrl,
      amenities: safeAmenities.length > 0 ? safeAmenities : ["Borehole Water", "24/7 Security"],
      isFeatured: Boolean(isAdmin || user.tier === "PRO"),
      cautionFee: Math.round(parsedCaution),
      agencyFee: Math.round(parsedAgency),
    });

    return NextResponse.json({ success: true, listing: newListing }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create listing:", error);
    const message =
      error?.message && typeof error.message === "string" && error.message.includes("Media")
        ? error.message
        : "Failed to create listing";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
