import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth-security";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking CribConnect UNIPORT StoreRecord collections...");

  const existingCount = await prisma.storeRecord.count({
    where: { collection: "listings" },
  });
  if (existingCount > 0) {
    console.log("StoreRecord already has listings data — skipping seed to preserve live data.");
    return;
  }

  const now = new Date().toISOString();
  const { salt, hash } = hashPassword(
    process.env.SEED_DEMO_PASSWORD || "CribConnectDemo!2026"
  );

  const sampleUser = {
    id: "agent-uniport-choba-1",
    name: "Chinedu Okafor",
    email: "chinedu.realtor@cribconnect.ng",
    passwordSalt: salt,
    passwordHash: hash,
    phone: "08031234567",
    whatsapp: "2348031234567",
    role: "AGENT",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ChineduOkafor",
    agencyName: "Choba Campus Homes",
    bio: "Verified student housing agent covering UNIPORT Main Gate, Choba Extension, and Ozuoba.",
    specializations: "University of Port Harcourt (UNIPORT)",
    coverageAreas: ["Choba", "Ozuoba", "Aluu"],
    isVerified: true,
    verificationStatus: "VERIFIED",
    tier: "FREE",
    badges: ["Verified Agent", "UNIPORT Specialist"],
    tenantsHousedCount: 12,
    rentalsHistory: [],
    createdAt: now,
  };

  const sampleListing = {
    id: "listing-choba-selfcon-1",
    title: "Tiled Self-Contain Near UNIPORT Choba Main Gate",
    description:
      "Clean, well-ventilated self-contain within walking distance of UNIPORT Choba Main Gate. Features borehole water, personal prepaid meter, tiled floor, and gated compound.",
    price: 350000,
    agencyFee: 35000,
    cautionFee: 20000,
    period: "per year",
    propertyType: "SELF_CONTAIN",
    bedrooms: 1,
    bathrooms: 1,
    neighborhood: "Choba",
    city: "Port Harcourt",
    universityNearby: "University of Port Harcourt (UNIPORT)",
    distanceToCampusMinutes: 5,
    address: "Choba Extension, off East-West Road, Port Harcourt",
    distanceDescription: "5 mins walk to UNIPORT Choba Main Gate",
    latitude: 4.8984,
    longitude: 6.9315,
    photos: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80",
    ],
    videoTourUrl: null,
    amenities: ["Borehole Water", "Prepaid Meter", "Security / Gated", "Tiled Floor"],
    agentId: sampleUser.id,
    agentName: sampleUser.name,
    agentPhone: sampleUser.phone,
    agentWhatsapp: sampleUser.whatsapp,
    agentAvatar: sampleUser.avatar,
    agencyName: sampleUser.agencyName,
    agentVerified: true,
    isFeatured: false,
    isAvailable: true,
    viewsCount: 0,
    whatsappClicks: 0,
    createdAt: now,
  };

  await prisma.storeRecord.upsert({
    where: { collection_id: { collection: "users", id: sampleUser.id } },
    update: { data: sampleUser },
    create: { collection: "users", id: sampleUser.id, data: sampleUser },
  });

  await prisma.storeRecord.upsert({
    where: { collection_id: { collection: "listings", id: sampleListing.id } },
    update: { data: sampleListing },
    create: { collection: "listings", id: sampleListing.id, data: sampleListing },
  });

  console.log("Seeded initial UNIPORT/Port Harcourt StoreRecord data successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
