import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Cleaning database...");
  await prisma.report.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.housingRequest.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.agentProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log("👤 Creating Users & Personas...");

  // 1. Chidi (Student Fresher)
  const chidi = await prisma.user.create({
    data: {
      id: "student-chidi",
      email: "chidi.student@unilag.edu.ng",
      name: "Chidi Nwosu",
      role: "STUDENT",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
      phone: "+234 802 334 8812",
      whatsapp: "+2348023348812",
      city: "Lagos (Relocating from Enugu)",
      currentSchool: "University of Lagos (UNILAG)",
    },
  });

  // 2. Amina (Student Postgraduate)
  const amina = await prisma.user.create({
    data: {
      id: "student-amina",
      email: "amina.bello@unilag.edu.ng",
      name: "Amina Bello",
      role: "STUDENT",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      phone: "+234 814 555 9011",
      whatsapp: "+2348145559011",
      city: "Lagos (Relocating from Abuja)",
      currentSchool: "UNILAG Faculty of Pharmacy",
    },
  });

  // 3. Kolawole Adebayo (Top Verified Agent)
  const kolawole = await prisma.user.create({
    data: {
      id: "agent-kolawole",
      email: "kolawole@campusnest.ng",
      name: "Kolawole Adebayo",
      role: "AGENT",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      phone: "+234 803 445 2299",
      whatsapp: "+2348034452299",
      city: "Yaba / Akoka, Lagos",
      currentSchool: "UNILAG Alum & Certified Realtor",
    },
  });

  const kolawoleProfile = await prisma.agentProfile.create({
    data: {
      id: "profile-kolawole",
      userId: kolawole.id,
      agencyName: "CampusNest Realty & Housing Services",
      ninNumber: "NIN-89304821093",
      idDocumentUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
      verificationStatus: "VERIFIED",
      verificationNotes: "NIN verified with NIMC database, LASRETR registered broker, UNILAG Student Affairs accredited.",
      tier: "PRO",
      badges: JSON.stringify(["Verified Agent", "UNILAG Specialist", "Top Rated 2026", "Zero Scam Guarantee"]),
      rating: 4.95,
      reviewCount: 28,
      bio: "Licensed rental specialist with 8 years dedicated exclusively to student and faculty housing in Akoka, Yaba, Onike, and Bariga. We prioritize student security, uninterrupted water, and verified landlady agreements.",
      yearsExperience: 8,
      campusSpecialization: "University of Lagos (UNILAG) & Yaba College of Technology",
      coverageAreas: JSON.stringify(["Akoka", "Onike", "Abule-Oja", "Yaba Tech Axis", "St. Finbarr's"]),
      featuredListingCredits: 5,
    },
  });

  // 4. Emeka Okafor (Verified Agent)
  const emeka = await prisma.user.create({
    data: {
      id: "agent-emeka",
      email: "emeka@apexstudios.ng",
      name: "Emeka Okafor",
      role: "AGENT",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
      phone: "+234 705 998 1234",
      whatsapp: "+2347059981234",
      city: "Akoka, Lagos",
      currentSchool: "Accredited Student Relocation Specialist",
    },
  });

  await prisma.agentProfile.create({
    data: {
      id: "profile-emeka",
      userId: emeka.id,
      agencyName: "Apex Student Accommodations",
      ninNumber: "NIN-44320987112",
      idDocumentUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
      verificationStatus: "VERIFIED",
      verificationNotes: "Identity confirmed via National Identity Card. Physical office at Commercial Avenue, Yaba.",
      tier: "PRO",
      badges: JSON.stringify(["Verified Agent", "Fast Responder", "Hostel Coordinator"]),
      rating: 4.8,
      reviewCount: 15,
      bio: "Helping students settle comfortably without landlord stress. We specialize in newly built self-contains and serviced student flats with generator backup.",
      yearsExperience: 5,
      campusSpecialization: "UNILAG Main Campus & College of Medicine (CMUL)",
      coverageAreas: JSON.stringify(["Abule-Oja", "Akoka", "Bariga High School Axis"]),
      featuredListingCredits: 2,
    },
  });

  // 5. Bisi Adeleke (Pending Verification Agent)
  const bisi = await prisma.user.create({
    data: {
      id: "agent-bisi",
      email: "bisi.yaba@gmail.com",
      name: "Bisi Adeleke",
      role: "AGENT",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
      phone: "+234 812 770 4545",
      whatsapp: "+2348127704545",
      city: "Yaba, Lagos",
      currentSchool: "Independent Housing Coordinator",
    },
  });

  await prisma.agentProfile.create({
    data: {
      id: "profile-bisi",
      userId: bisi.id,
      agencyName: "Adeleke & Sons Properties",
      ninNumber: "NIN-99128374655",
      idDocumentUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
      verificationStatus: "PENDING",
      verificationNotes: "Submitted government-issued ID card and utility bill on Sep 5, 2026. Awaiting Admin review.",
      tier: "FREE",
      badges: JSON.stringify([]),
      rating: 5.0,
      reviewCount: 0,
      bio: "Local housing finder around Yaba Tech and UNILAG environs. Dedicated to finding clean, affordable rooms for students.",
      yearsExperience: 2,
      campusSpecialization: "Yaba College of Technology & UNILAG",
      coverageAreas: JSON.stringify(["Yaba", "Tejuosho", "Onike"]),
      featuredListingCredits: 0,
    },
  });

  // 6. Tola Balogun (Platform Admin)
  await prisma.user.create({
    data: {
      id: "admin-tola",
      email: "admin@cribconnect.ng",
      name: "Tola Balogun",
      role: "ADMIN",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
      phone: "+234 809 112 3344",
      whatsapp: "+2348091123344",
      city: "Lagos",
      currentSchool: "CribConnect Trust & Safety Lead",
    },
  });

  console.log("🏠 Creating UNILAG / Yaba Student Rental Listings...");

  // Listing 1: Kolawole - Akoka Self-Con
  const listing1 = await prisma.listing.create({
    data: {
      id: "listing-akoka-selfcon",
      agentId: kolawole.id,
      title: "Executive Tiled Self-Contain Studio (5 Mins to UNILAG New Hall Gate)",
      description: "Modern self-contain apartment located on St. Finbarr's College Road, Akoka. Features personal prepaid meter, pop ceiling, clean kitchen with modern cabinets, dedicated water borehole with overhead tank, and 24/7 security guard at the gate. Perfect for serious UNILAG students wanting privacy and peace of mind.",
      price: 480000,
      currency: "NGN",
      period: "per year",
      propertyType: "SELF_CONTAIN",
      bedrooms: 1,
      bathrooms: 1,
      address: "14 St. Finbarr's College Road, Akoka",
      neighborhood: "Akoka",
      city: "Lagos",
      universityNearby: "University of Lagos (UNILAG)",
      distanceToCampusMinutes: 5,
      distanceDescription: "5 mins walk to UNILAG New Hall Gate",
      latitude: 6.5192,
      longitude: 3.3879,
      photos: JSON.stringify([
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&auto=format&fit=crop&q=80",
      ]),
      videoTourUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Embeddable video tour walkthrough
      amenities: JSON.stringify([
        "Borehole Water (24/7 Running)",
        "Generator Backup Hookup",
        "Gated Compound & Security Guard",
        "Personal Prepaid Meter",
        "POP Ceiling & Tiled Floors",
        "Wardrobe & Kitchen Shelf",
      ]),
      isFeatured: true,
      viewsCount: 342,
      inquiriesCount: 29,
      isAvailable: true,
    },
  });

  // Listing 2: Kolawole - Onike 1-Bedroom
  const listing2 = await prisma.listing.create({
    data: {
      id: "listing-onike-onebed",
      agentId: kolawole.id,
      title: "Spacious 1-Bedroom Flat with Balcony in Quiet Onike Enclave",
      description: "Well-ventilated 1-bedroom flat in a tranquil residential close off University Road, Onike. Features large living room, master bedroom with en-suite shower, guest toilet, and fully fitted kitchen. Comes with constant treated borehole water and private compound car park.",
      price: 750000,
      currency: "NGN",
      period: "per year",
      propertyType: "ONE_BED",
      bedrooms: 1,
      bathrooms: 2,
      address: "8 Alara Street, Onike, Yaba",
      neighborhood: "Onike",
      city: "Lagos",
      universityNearby: "University of Lagos (UNILAG)",
      distanceToCampusMinutes: 8,
      distanceDescription: "8 mins drive / 15 mins walk to UNILAG Main Gate",
      latitude: 6.5115,
      longitude: 3.3792,
      photos: JSON.stringify([
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&auto=format&fit=crop&q=80",
      ]),
      videoTourUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      amenities: JSON.stringify([
        "Borehole Water (24/7 Running)",
        "Prepaid Meter",
        "Balcony View",
        "Security Guard (Night & Day)",
        "Parking Space",
        "Tiled Bathroom",
      ]),
      isFeatured: true,
      viewsCount: 215,
      inquiriesCount: 18,
      isAvailable: true,
    },
  });

  // Listing 3: Emeka - Abule-Oja Student Room
  const listing3 = await prisma.listing.create({
    data: {
      id: "listing-abule-oja-room",
      agentId: emeka.id,
      title: "Modern En-Suite Room in Student Hostel Flat (High-Speed Solar & Water)",
      description: "Brand newly renovated student apartment complex in Abule-Oja. Individual en-suite bathroom, shared spacious dining hall and study lounge. Central solar inverter powers study lights and phone charging during general power outages.",
      price: 350000,
      currency: "NGN",
      period: "per year",
      propertyType: "SELF_CONTAIN",
      bedrooms: 1,
      bathrooms: 1,
      address: "3 University Road, Abule-Oja, Yaba",
      neighborhood: "Abule-Oja",
      city: "Lagos",
      universityNearby: "University of Lagos (UNILAG)",
      distanceToCampusMinutes: 6,
      distanceDescription: "6 mins walk to UNILAG 2nd Gate / DLI Gate",
      latitude: 6.5218,
      longitude: 3.3812,
      photos: JSON.stringify([
        "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&auto=format&fit=crop&q=80",
      ]),
      videoTourUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      amenities: JSON.stringify([
        "Solar Inverter Backup (24/7 Lights)",
        "Constant Running Water",
        "Study Desk & Chair Included",
        "Gated Estate Security",
      ]),
      isFeatured: false,
      viewsCount: 410,
      inquiriesCount: 37,
      isAvailable: true,
    },
  });

  // Listing 4: Emeka - Akoka 2-Bedroom Shared Flat
  const listing4 = await prisma.listing.create({
    data: {
      id: "listing-akoka-twobed",
      agentId: emeka.id,
      title: "Prime 2-Bedroom Apartment for 2 to 4 Student Flatmates (Akoka Gate)",
      description: "Great flat for two or three students splitting costs. Located in a high-security gated street along Akoka. Two spacious en-suite rooms, wide living room with balcony, cross ventilation, perimeter electric fencing, and treated running water.",
      price: 900000,
      currency: "NGN",
      period: "per year",
      propertyType: "TWO_BED",
      bedrooms: 2,
      bathrooms: 2,
      address: "22 Pawa Street, Akoka",
      neighborhood: "Akoka",
      city: "Lagos",
      universityNearby: "University of Lagos (UNILAG)",
      distanceToCampusMinutes: 4,
      distanceDescription: "4 mins brisk walk to UNILAG Education Gate",
      latitude: 6.5165,
      longitude: 3.3905,
      photos: JSON.stringify([
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80",
      ]),
      videoTourUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      amenities: JSON.stringify([
        "Ideal for Roommate Cost-Splitting",
        "Electric Wire Fence & Guard",
        "Constant Water Borehole",
        "Prepaid Meter",
        "Kitchen Cabinets & Store",
      ]),
      isFeatured: true,
      viewsCount: 188,
      inquiriesCount: 14,
      isAvailable: true,
    },
  });

  // Listing 5: Kolawole - Commercial Avenue Serviced Studio
  const listing5 = await prisma.listing.create({
    data: {
      id: "listing-yaba-serviced-studio",
      agentId: kolawole.id,
      title: "Premium Serviced Studio with AC & Central Generator (Yaba Tech Axis)",
      description: "High-end student and young professional studio in the tech corridor of Yaba. Central diesel generator running every evening from 7 PM to 7 AM during grid outages. Fully air-conditioned, private kitchen nook, and biometric gate access.",
      price: 650000,
      currency: "NGN",
      period: "per year",
      propertyType: "STUDIO",
      bedrooms: 1,
      bathrooms: 1,
      address: "45 Commercial Avenue, Sabo-Yaba",
      neighborhood: "Yaba",
      city: "Lagos",
      universityNearby: "Yaba College of Technology",
      distanceToCampusMinutes: 7,
      distanceDescription: "7 mins to YabaTech & 12 mins to UNILAG",
      latitude: 6.5101,
      longitude: 3.3754,
      photos: JSON.stringify([
        "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80",
      ]),
      videoTourUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      amenities: JSON.stringify([
        "Central Generator (7PM - 7AM)",
        "Air Conditioner Pre-Installed",
        "Biometric Security Gate",
        "CCTV Surveillance",
        "Clean Borehole & Water Treatment",
      ]),
      isFeatured: false,
      viewsCount: 310,
      inquiriesCount: 22,
      isAvailable: true,
    },
  });

  // Listing 6: Bisi (Pending Agent) - Budget Bariga Self-con
  const listing6 = await prisma.listing.create({
    data: {
      id: "listing-bariga-budget",
      agentId: bisi.id,
      title: "Budget-Friendly Self-Contain with Kitchenette (Bariga / Akoka Border)",
      description: "Affordable accommodation for students on a tight budget. Located along Bariga road near UNILAG back gate. Functional running water, separate bathroom and toilet, personal meter.",
      price: 380000,
      currency: "NGN",
      period: "per year",
      propertyType: "SELF_CONTAIN",
      bedrooms: 1,
      bathrooms: 1,
      address: "9 Pedro Road, Bariga",
      neighborhood: "Bariga",
      city: "Lagos",
      universityNearby: "University of Lagos (UNILAG)",
      distanceToCampusMinutes: 12,
      distanceDescription: "12 mins to UNILAG via Keke / Shuttle",
      latitude: 6.5312,
      longitude: 3.3912,
      photos: JSON.stringify([
        "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&auto=format&fit=crop&q=80",
      ]),
      videoTourUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      amenities: JSON.stringify([
        "Personal Prepaid Meter",
        "Running Water",
        "Affordable Annual Rent",
      ]),
      isFeatured: false,
      viewsCount: 88,
      inquiriesCount: 5,
      isAvailable: true,
    },
  });

  console.log("📋 Creating Housing Requests (Reverse Marketplace)...");

  // Request 1: Chidi (Fresher)
  const req1 = await prisma.housingRequest.create({
    data: {
      id: "request-chidi-fresher",
      studentId: chidi.id,
      title: "Urgent: Safe Self-Contain near UNILAG Akoka Gate (Max ₦500k/year)",
      description: "I am an incoming 100-level Computer Science student relocating from Enugu. I don't know anyone in Lagos yet and need a quiet, verified room with constant running water and good security so I can focus on my studies. Move-in before October resumption.",
      targetUniversity: "University of Lagos (UNILAG)",
      preferredAreas: JSON.stringify(["Akoka", "Onike", "St. Finbarr's"]),
      maxBudget: 500000,
      currency: "NGN",
      propertyType: "SELF_CONTAIN",
      moveInDate: "2026-10-01",
      duration: "1 Year",
      needsRoommate: false,
      status: "OPEN",
    },
  });

  // Request 2: Amina (Postgrad)
  const req2 = await prisma.housingRequest.create({
    data: {
      id: "request-amina-postgrad",
      studentId: amina.id,
      title: "Looking for 1-Bedroom Flat in Onike / Yaba for Postgrad Student",
      description: "Relocating from Abuja for my Masters in Pharmacy at UNILAG. Looking for a neat 1-bedroom flat with reliable power or generator provision, clean treated water, and car parking space.",
      targetUniversity: "University of Lagos (UNILAG)",
      preferredAreas: JSON.stringify(["Onike", "Sabo-Yaba", "Akoka"]),
      maxBudget: 800000,
      currency: "NGN",
      propertyType: "ONE_BED",
      moveInDate: "2026-09-25",
      duration: "1 Year",
      needsRoommate: false,
      status: "OPEN",
    },
  });

  console.log("💼 Submitting Agent Proposals for Housing Requests...");

  // Proposal 1: Kolawole pitches Listing 1 to Chidi
  await prisma.proposal.create({
    data: {
      id: "prop-kolawole-to-chidi",
      requestId: req1.id,
      agentId: kolawole.id,
      listingId: listing1.id,
      pitchMessage: "Hello Chidi! Welcome to UNILAG. I have the ideal self-contain right on St. Finbarr's Road, just a 5-minute walk from New Hall Gate. The compound has a 24/7 security guard, clean borehole water, and you get your own prepaid meter. I have arranged housing for over 20 freshers from Eastern Nigeria in this same compound with 0 complaints.",
      proposedPrice: 480000,
      currency: "NGN",
      period: "per year",
      agencyFee: 48000, // 10%
      cautionFee: 40000,
      totalUpfront: 568000,
      status: "SUBMITTED",
    },
  });

  // Proposal 2: Emeka pitches Listing 3 to Chidi
  await prisma.proposal.create({
    data: {
      id: "prop-emeka-to-chidi",
      requestId: req1.id,
      agentId: emeka.id,
      listingId: listing3.id,
      pitchMessage: "Hi Chidi, check out our solar-inverter student room in Abule-Oja. Rent is only ₦350,000/year leaving you with ₦150k in savings from your budget! Solar light means your desk lamp and laptop stay charged even when NEPA takes light.",
      proposedPrice: 350000,
      currency: "NGN",
      period: "per year",
      agencyFee: 35000,
      cautionFee: 30000,
      totalUpfront: 415000,
      status: "SHORTLISTED",
    },
  });

  // Proposal 3: Kolawole pitches Listing 2 to Amina
  await prisma.proposal.create({
    data: {
      id: "prop-kolawole-to-amina",
      requestId: req2.id,
      agentId: kolawole.id,
      listingId: listing2.id,
      pitchMessage: "Dear Amina, congratulations on your UNILAG postgraduate admission. Our Alara Street flat in Onike is specifically tailored for postgrads: quiet environment, dedicated parking, and only 8 minutes to campus. The landlady is a retired professor who only accepts mature students.",
      proposedPrice: 750000,
      currency: "NGN",
      period: "per year",
      agencyFee: 75000,
      cautionFee: 50000,
      totalUpfront: 875000,
      status: "SUBMITTED",
    },
  });

  console.log("⭐ Creating Agent Reviews...");

  await prisma.review.create({
    data: {
      agentProfileId: kolawoleProfile.id,
      studentId: chidi.id,
      rating: 5,
      comment: "Mr. Kolawole made my relocation from the East completely seamless. He sent me live video walkthroughs, picked me up at the park upon arrival, and the room was exactly as advertised. Best agent in Akoka!",
    },
  });

  await prisma.review.create({
    data: {
      agentProfileId: kolawoleProfile.id,
      studentId: amina.id,
      rating: 5,
      comment: "Professional and transparent. No hidden charges, and he gave a full receipt immediately. Highly recommend for any female student relocating alone.",
    },
  });

  console.log("🚨 Creating a sample Community Trust & Safety Report...");

  await prisma.report.create({
    data: {
      reporterId: chidi.id,
      targetType: "LISTING",
      targetId: listing6.id,
      reason: "Suspiciously low price / Unverified agent badge warning",
      details: "Saw this listing on Bariga border; wanted to ensure the agent's identity credentials have been physically validated before sending inspection fee.",
      status: "PENDING",
      adminNotes: "Investigating agent Bisi Adeleke's pending NIN submission.",
    },
  });

  console.log("💬 Creating sample In-App Conversation...");

  await prisma.message.create({
    data: {
      senderId: kolawole.id,
      recipientId: chidi.id,
      requestId: req1.id,
      listingId: listing1.id,
      content: "Hello Chidi! I noticed your request for UNILAG. I submitted a formal proposal with our verified St. Finbarr's self-contain. Let me know if you would like me to conduct a live WhatsApp video tour this afternoon!",
      isRead: false,
    },
  });

  console.log("✅ Seed completed successfully with realistic student housing data!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
