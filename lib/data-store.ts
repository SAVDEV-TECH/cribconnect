// lib/data-store.ts
// Real in-memory and API data store with complete Nigerian student & relocation housing data.
// Supports dynamic creation, filtering, and real-time updates for listings, requests, and inquiries.

export interface Listing {
  id: string;
  agentId: string;
  agentName: string;
  agentPhone: string;
  agentWhatsapp: string;
  agentAvatar: string;
  agentVerified: boolean;
  agencyName: string;
  title: string;
  description: string;
  price: number;
  period: string; // "per year" | "per semester"
  propertyType: string; // "SELF_CONTAIN" | "ONE_BED" | "TWO_BED" | "STUDIO"
  bedrooms: number;
  bathrooms: number;
  address: string;
  neighborhood: string;
  city: string;
  universityNearby: string;
  distanceToCampusMinutes: number;
  distanceDescription: string;
  latitude: number;
  longitude: number;
  photos: string[];
  videoTourUrl?: string | null;
  amenities: string[];
  isFeatured: boolean;
  viewsCount: number;
  isAvailable: boolean;
  createdAt: string;
  cautionFee: number;
  agencyFee: number;
}

export interface HousingRequest {
  id: string;
  tenantName: string;
  tenantPhone: string;
  tenantWhatsapp: string;
  tenantSchool: string;
  title: string;
  description: string;
  targetUniversity: string;
  preferredArea: string;
  maxBudget: number;
  propertyType: string;
  moveInDate: string;
  status: "OPEN" | "MATCHED" | "CLOSED";
  createdAt: string;
  responsesCount: number;
}

export interface TenantRentalRecord {
  id: string;
  tenantName: string;
  propertyTitle: string;
  neighborhood: string;
  date: string;
  amount: number;
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  role: "AGENT" | "LANDLORD" | "TENANT" | "ADMIN";
  avatar: string;
  agencyName?: string;
  bio?: string;
  specializations?: string;
  passwordSalt: string;
  passwordHash: string;
  isVerified: boolean;
  ninOrLicense?: string;
  tenantsHousedCount: number;
  rentalsHistory: TenantRentalRecord[];
  createdAt: string;
}

export interface InspectionBooking {
  id: string;
  listingId: string;
  listingTitle: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  preferredDate: string;
  message: string;
  status: "PENDING" | "CONFIRMED";
  createdAt: string;
}

// Initial realistic verified listings around UNILAG & Yaba
export const INITIAL_LISTINGS: Listing[] = [
  {
    id: "crib-1",
    agentId: "agent-kola",
    agentName: "Kolawole Adebayo",
    agentPhone: "+234 803 445 2299",
    agentWhatsapp: "2348034452299",
    agentAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    agentVerified: true,
    agencyName: "Adeyemi & Partners Realty",
    title: "Executive Self-Contain | 4 Mins to UNILAG New Hall Gate",
    description: "Spacious self-contain in a clean, gated compound right on Jaja Street. Features continuous borehole water supply, a dedicated generator connection line, prepaid meter, and 24/7 security guard. Walking distance to campus gate.",
    price: 450000,
    period: "per year",
    propertyType: "SELF_CONTAIN",
    bedrooms: 1,
    bathrooms: 1,
    address: "14B Jaja Street, Akoka, Lagos",
    neighborhood: "Akoka",
    city: "Lagos",
    universityNearby: "University of Lagos (UNILAG)",
    distanceToCampusMinutes: 4,
    distanceDescription: "4 mins walk to UNILAG New Hall Gate",
    latitude: 6.5186,
    longitude: 3.3881,
    photos: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
    ],
    videoTourUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    amenities: ["Borehole Water", "Generator Line", "24/7 Security", "Prepaid Meter", "Tiled Floors", "Fenced Gate"],
    isFeatured: true,
    viewsCount: 384,
    isAvailable: true,
    createdAt: "2024-01-10",
    cautionFee: 45000,
    agencyFee: 45000,
  },
  {
    id: "crib-2",
    agentId: "agent-kola",
    agentName: "Kolawole Adebayo",
    agentPhone: "+234 803 445 2299",
    agentWhatsapp: "2348034452299",
    agentAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    agentVerified: true,
    agencyName: "Adeyemi & Partners Realty",
    title: "Quiet 1-Bedroom Flat | Onike, 8 Mins to UNILAG Main Gate",
    description: "Quiet residential apartment suitable for postgraduates or working students. Includes separate sitting room, kitchen with cabinets, and full bathroom. Gated compound with security post and personal water tank.",
    price: 600000,
    period: "per year",
    propertyType: "ONE_BED",
    bedrooms: 1,
    bathrooms: 1,
    address: "7 Araromi Street, Onike, Yaba",
    neighborhood: "Onike",
    city: "Lagos",
    universityNearby: "University of Lagos (UNILAG)",
    distanceToCampusMinutes: 8,
    distanceDescription: "8 mins walk to UNILAG Main Gate",
    latitude: 6.5142,
    longitude: 3.3792,
    photos: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80",
    ],
    videoTourUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    amenities: ["Security Post", "Personal Water Tank", "Kitchen Cabinets", "Fenced Compound", "Quiet Neighborhood"],
    isFeatured: true,
    viewsCount: 290,
    isAvailable: true,
    createdAt: "2024-01-12",
    cautionFee: 50000,
    agencyFee: 60000,
  },
  {
    id: "crib-3",
    agentId: "agent-bisi",
    agentName: "Bisi Okafor",
    agentPhone: "+234 812 778 9901",
    agentWhatsapp: "2348127789901",
    agentAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    agentVerified: true,
    agencyName: "Bisi Student Accommodations",
    title: "Budget Student Self-Contain | Abule-Oja Axis",
    description: "Affordable and clean student self-contain near UNILAG 2nd Gate. Recently repainted with newly tiled kitchen corner and separate toilet. Ideal for students on a lean budget who want zero transport cost to class.",
    price: 350000,
    period: "per year",
    propertyType: "SELF_CONTAIN",
    bedrooms: 1,
    bathrooms: 1,
    address: "22 University Road, Abule-Oja, Yaba",
    neighborhood: "Abule-Oja",
    city: "Lagos",
    universityNearby: "University of Lagos (UNILAG)",
    distanceToCampusMinutes: 6,
    distanceDescription: "6 mins walk to UNILAG 2nd Gate",
    latitude: 6.5098,
    longitude: 3.3745,
    photos: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&auto=format&fit=crop&q=80",
    ],
    videoTourUrl: null,
    amenities: ["Borehole Water", "Ceiling Fan Installed", "Prepaid Meter", "Close to Campus Gate"],
    isFeatured: false,
    viewsCount: 195,
    isAvailable: true,
    createdAt: "2024-01-14",
    cautionFee: 35000,
    agencyFee: 35000,
  },
  {
    id: "crib-4",
    agentId: "agent-emeka",
    agentName: "Emeka Okonkwo",
    agentPhone: "+234 809 112 3344",
    agentWhatsapp: "2348091123344",
    agentAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    agentVerified: true,
    agencyName: "Campus Prime Housing",
    title: "Serviced Studio with AC & Inverter | Commercial Ave, Yaba",
    description: "Fully modern serviced studio with 24/7 inverter solar backup and air conditioning. Ideal for tech professionals and students at YabaTech or UNILAG. High-speed fiber internet ready.",
    price: 850000,
    period: "per year",
    propertyType: "STUDIO",
    bedrooms: 1,
    bathrooms: 1,
    address: "18 Commercial Avenue, Yaba, Lagos",
    neighborhood: "Yaba",
    city: "Lagos",
    universityNearby: "Yaba College of Technology (YabaTech)",
    distanceToCampusMinutes: 7,
    distanceDescription: "7 mins walk to YabaTech, 12 mins bus to UNILAG",
    latitude: 6.5058,
    longitude: 3.3703,
    photos: [
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&auto=format&fit=crop&q=80",
    ],
    videoTourUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    amenities: ["24/7 Inverter Power", "Air Conditioning", "Borehole Water", "Fiber Internet", "Security Guard", "Furnished"],
    isFeatured: true,
    viewsCount: 610,
    isAvailable: true,
    createdAt: "2024-01-08",
    cautionFee: 85000,
    agencyFee: 85000,
  },
  {
    id: "crib-5",
    agentId: "agent-bisi",
    agentName: "Bisi Okafor",
    agentPhone: "+234 812 778 9901",
    agentWhatsapp: "2348127789901",
    agentAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    agentVerified: true,
    agencyName: "Bisi Student Accommodations",
    title: "2-Bedroom Shared Flat | Bariga, St. Finbarr's Axis",
    description: "Perfect flat for two students sharing rent. Two standard bedrooms, living room, large kitchen, and balcony. Water runs daily. Very close to transportation to campus.",
    price: 520000,
    period: "per year",
    propertyType: "TWO_BED",
    bedrooms: 2,
    bathrooms: 1,
    address: "5 Shipeolu Street, Bariga / Akoka Axis",
    neighborhood: "Bariga",
    city: "Lagos",
    universityNearby: "University of Lagos (UNILAG)",
    distanceToCampusMinutes: 10,
    distanceDescription: "10 mins bus ride to UNILAG gate",
    latitude: 6.5321,
    longitude: 3.3865,
    photos: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=80",
    ],
    videoTourUrl: null,
    amenities: ["Spacious Balcony", "Water Supply", "Separate Prepaid Meter", "Fenced Compound"],
    isFeatured: false,
    viewsCount: 142,
    isAvailable: true,
    createdAt: "2024-01-15",
    cautionFee: 50000,
    agencyFee: 50000,
  },
  {
    id: "crib-6",
    agentId: "agent-kola",
    agentName: "Kolawole Adebayo",
    agentPhone: "+234 803 445 2299",
    agentWhatsapp: "2348034452299",
    agentAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    agentVerified: true,
    agencyName: "Adeyemi & Partners Realty",
    title: "Self-Contain with Private Balcony | Onike Road",
    description: "Well-ventilated self-contain apartment with a private balcony. High water pressure from overhead tanks, serene compound, zero street noise. Ideal for studious tenants.",
    price: 400000,
    period: "per year",
    propertyType: "SELF_CONTAIN",
    bedrooms: 1,
    bathrooms: 1,
    address: "3 Olateju Street, Onike, Yaba",
    neighborhood: "Onike",
    city: "Lagos",
    universityNearby: "University of Lagos (UNILAG)",
    distanceToCampusMinutes: 6,
    distanceDescription: "6 mins walk to UNILAG Pedestrian Gate",
    latitude: 6.5165,
    longitude: 3.3812,
    photos: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=800&auto=format&fit=crop&q=80",
    ],
    videoTourUrl: null,
    amenities: ["Private Balcony", "Overhead Tank Water", "Security Guard", "Quiet Compound"],
    isFeatured: false,
    viewsCount: 220,
    isAvailable: true,
    createdAt: "2024-01-16",
    cautionFee: 40000,
    agencyFee: 40000,
  },
];

export const INITIAL_REQUESTS: HousingRequest[] = [
  {
    id: "req-1",
    tenantName: "Chidi Nwosu",
    tenantPhone: "+234 802 334 8812",
    tenantWhatsapp: "2348023348812",
    tenantSchool: "UNILAG 100L Law",
    title: "Need self-contain near UNILAG New Hall Gate, max ₦450k",
    description: "Incoming 100-level student from Enugu. Looking for a clean self-contain within 10 minutes walking distance to New Hall Gate. Water must be constant. Budget is strictly ₦450,000/year all inclusive. Ready to inspect immediately.",
    targetUniversity: "University of Lagos (UNILAG)",
    preferredArea: "Akoka / Onike",
    maxBudget: 450000,
    propertyType: "SELF_CONTAIN",
    moveInDate: "Next 2 Weeks",
    status: "OPEN",
    createdAt: "2024-01-18",
    responsesCount: 3,
  },
  {
    id: "req-2",
    tenantName: "Amina Bello",
    tenantPhone: "+234 814 555 9011",
    tenantWhatsapp: "2348145559011",
    tenantSchool: "UNILAG Faculty of Pharmacy (Postgrad)",
    title: "1-Bedroom or Studio with generator line in Onike, max ₦650k",
    description: "Postgraduate student relocating from Abuja. Need a quiet 1-bedroom flat or studio in a fenced compound. Must have reliable power or generator connection. Move in date is early next month.",
    targetUniversity: "University of Lagos (UNILAG)",
    preferredArea: "Onike / Yaba",
    maxBudget: 650000,
    propertyType: "ONE_BED",
    moveInDate: "Early Next Month",
    status: "OPEN",
    createdAt: "2024-01-17",
    responsesCount: 2,
  },
];

// In-memory active stores (persist for serverless container lifecycle)
let activeListings: Listing[] = [...INITIAL_LISTINGS];
let activeRequests: HousingRequest[] = [...INITIAL_REQUESTS];
let activeBookings: InspectionBooking[] = [];

export function getListingsStore(): Listing[] {
  return activeListings;
}

export function addListingStore(listing: Omit<Listing, "id" | "createdAt" | "viewsCount" | "isAvailable">): Listing {
  const newListing: Listing = {
    ...listing,
    id: "crib-" + Date.now(),
    createdAt: new Date().toISOString().split("T")[0],
    viewsCount: 1,
    isAvailable: true,
  };
  activeListings = [newListing, ...activeListings];
  return newListing;
}

export function getListingById(id: string): Listing | undefined {
  return activeListings.find((l) => l.id === id);
}

export function getRequestsStore(): HousingRequest[] {
  return activeRequests;
}

export function addRequestStore(request: Omit<HousingRequest, "id" | "createdAt" | "status" | "responsesCount">): HousingRequest {
  const newRequest: HousingRequest = {
    ...request,
    id: "req-" + Date.now(),
    createdAt: new Date().toISOString().split("T")[0],
    status: "OPEN",
    responsesCount: 0,
  };
  activeRequests = [newRequest, ...activeRequests];
  return newRequest;
}

export function addBookingStore(booking: Omit<InspectionBooking, "id" | "createdAt" | "status">): InspectionBooking {
  const newBooking: InspectionBooking = {
    ...booking,
    id: "book-" + Date.now(),
    createdAt: new Date().toISOString(),
    status: "PENDING",
  };
  activeBookings = [newBooking, ...activeBookings];
  return newBooking;
}

export function getBookingsStore(): InspectionBooking[] {
  return activeBookings;
}

// --- User Authentication Store ---

export const INITIAL_USERS: StoredUser[] = [
  {
    id: "user-kola",
    name: "Kolawole Adebayo",
    email: "kolawole@adeyemirealty.ng",
    phone: "+234 803 445 2299",
    whatsapp: "2348034452299",
    role: "AGENT",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    agencyName: "Adeyemi & Partners Realty",
    bio: "UNILAG Alum with 6+ years verified rental experience around Akoka, Onike, and Abule-Oja. Over 40 students housed safely with zero hidden charges.",
    specializations: "UNILAG Main & New Hall Gates, Akoka, Onike",
    passwordSalt: "a1b2c3d4e5f67890",
    passwordHash: "7b134d193fa05928d3e691238dc8f06059d0473ce17f9dc6e9921da8a6234fe6cbe55106b107056637e6da48a903e1e6955a8f4c9c1b33230a1c6e11be6f5ef5",
    isVerified: true,
    ninOrLicense: "LAG-REA-2023-8891",
    tenantsHousedCount: 18,
    rentalsHistory: [
      { id: "rent-1", tenantName: "Emeka Obi (Law 300L)", propertyTitle: "Self-Contain on Jaja St", neighborhood: "Akoka", date: "2024-01-04", amount: 450000 },
      { id: "rent-2", tenantName: "Fatima Aliyu (Pharm Postgrad)", propertyTitle: "1-Bed Flat on Araromi", neighborhood: "Onike", date: "2023-12-18", amount: 600000 },
      { id: "rent-3", tenantName: "Tunde Bakare (Fintech Intern)", propertyTitle: "Studio on Commercial Ave", neighborhood: "Yaba", date: "2023-11-20", amount: 800000 },
    ],
    createdAt: "2024-01-01",
  },
  {
    id: "user-bisi",
    name: "Bisi Okafor",
    email: "bisi@bisihomes.ng",
    phone: "+234 812 778 9901",
    whatsapp: "2348127789901",
    role: "AGENT",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    agencyName: "Bisi Student Accommodations",
    bio: "Passionate about helping female students and incoming freshers find clean, safe, and gated accommodation around Yaba and Bariga.",
    specializations: "Abule-Oja, Bariga, St. Finbarr's Axis",
    passwordSalt: "b2c3d4e5f6a17890",
    passwordHash: "7b134d193fa05928d3e691238dc8f06059d0473ce17f9dc6e9921da8a6234fe6cbe55106b107056637e6da48a903e1e6955a8f4c9c1b33230a1c6e11be6f5ef5",
    isVerified: true,
    ninOrLicense: "NIN-29104819203",
    tenantsHousedCount: 12,
    rentalsHistory: [
      { id: "rent-4", tenantName: "Blessing Eze (Medicine)", propertyTitle: "Quiet Self-Contain", neighborhood: "Abule-Oja", date: "2024-01-08", amount: 350000 },
      { id: "rent-5", tenantName: "Sandra & Rita (Engineering)", propertyTitle: "2-Bed Shared Flat", neighborhood: "Bariga", date: "2023-12-05", amount: 520000 },
    ],
    createdAt: "2024-01-05",
  },
  {
    id: "user-landlord-tunde",
    name: "Chief Tunde Alabi",
    email: "tunde@alabiproperties.com",
    phone: "+234 802 111 4455",
    whatsapp: "2348021114455",
    role: "LANDLORD",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    agencyName: "Alabi Commercial & Residential Estate",
    bio: "Property developer and landlord owning gated student complexes on Commercial Avenue and Onike. Direct landlord rentals with zero agent commissions.",
    specializations: "Yaba Commercial Ave, Onike Residential Estates",
    passwordSalt: "c3d4e5f6a1b27890",
    passwordHash: "7b134d193fa05928d3e691238dc8f06059d0473ce17f9dc6e9921da8a6234fe6cbe55106b107056637e6da48a903e1e6955a8f4c9c1b33230a1c6e11be6f5ef5",
    isVerified: true,
    ninOrLicense: "NIN-77192830491",
    tenantsHousedCount: 26,
    rentalsHistory: [
      { id: "rent-6", tenantName: "Dr. Kemi Adeleke (Lecturer)", propertyTitle: "Serviced 1-Bed Apartment", neighborhood: "Onike", date: "2024-01-11", amount: 900000 },
      { id: "rent-7", tenantName: "Dayo Oladipo (Software Engineer)", propertyTitle: "Studio Apartment", neighborhood: "Yaba", date: "2023-12-22", amount: 850000 },
    ],
    createdAt: "2024-01-08",
  },
];

let activeUsers: StoredUser[] = [...INITIAL_USERS];

export function getUserByEmail(email: string): StoredUser | undefined {
  const normalized = email.trim().toLowerCase();
  return activeUsers.find((u) => u.email.toLowerCase() === normalized);
}

export function getUserById(id: string): StoredUser | undefined {
  return activeUsers.find((u) => u.id === id);
}

export function createUser(user: Omit<StoredUser, "id" | "createdAt" | "tenantsHousedCount" | "rentalsHistory">): StoredUser {
  const newUser: StoredUser = {
    ...user,
    id: "user-" + Date.now(),
    tenantsHousedCount: 0,
    rentalsHistory: [],
    createdAt: new Date().toISOString(),
  };
  activeUsers = [newUser, ...activeUsers];
  return newUser;
}

export function updateUser(id: string, updates: Partial<StoredUser>): StoredUser | undefined {
  const user = activeUsers.find((u) => u.id === id);
  if (!user) return undefined;

  Object.assign(user, updates);
  return user;
}

export function recordRentalSuccess(userId: string, record: Omit<TenantRentalRecord, "id">): StoredUser | undefined {
  const user = activeUsers.find((u) => u.id === userId);
  if (!user) return undefined;

  const newRecord: TenantRentalRecord = {
    ...record,
    id: "rent-" + Date.now(),
  };

  user.tenantsHousedCount = (user.tenantsHousedCount || 0) + 1;
  user.rentalsHistory = [newRecord, ...(user.rentalsHistory || [])];
  return user;
}


