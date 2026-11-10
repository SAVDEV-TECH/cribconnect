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

export interface EscrowDeposit {
  id: string;
  listingId: string;
  listingTitle: string;
  neighborhood: string;
  agentId?: string;
  agentName: string;
  agentPhone?: string;
  agentWhatsapp?: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  amount: number;
  platformFee: number;
  agentPayout: number;
  releasePin: string;
  paystackReference: string;
  status: "HELD_IN_ESCROW" | "RELEASED_TO_AGENT" | "REFUNDED_TO_STUDENT" | "DISPUTED";
  holdDurationHours: number;
  inspectionDate: string;
  inspectionTime?: string;
  expiresAt: string;
  createdAt: string;
  disputeReason?: string;
}
export interface InspectionBooking {
  id: string;
  listingId: string;
  listingTitle: string;
  agentId?: string;
  agentName?: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  preferredDate: string;
  preferredTime?: string;
  message: string;
  status: "PENDING" | "CONFIRMED" | "DECLINED" | "COMPLETED";
  createdAt: string;
}

// Initial realistic verified listings around UNIPORT (University of Port Harcourt), Choba, Rivers State
export const INITIAL_LISTINGS: Listing[] = [
  {
    id: "crib-1",
    agentId: "agent-emeka",
    agentName: "Emeka Chukwudi",
    agentPhone: "+234 806 334 5521",
    agentWhatsapp: "2348063345521",
    agentAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    agentVerified: true,
    agencyName: "Chukwudi & Associates Realty PH",
    title: "Clean Self-Contain | 5 Mins Walk to UNIPORT Choba Main Gate",
    description: "Spacious self-contain in a secure, gated compound on Choba Road. Features borehole water supply running 24/7, dedicated generator connection point, prepaid electricity meter, and round-the-clock security. Zero transport cost to campus gate — just a 5-minute walk.",
    price: 220000,
    period: "per year",
    propertyType: "SELF_CONTAIN",
    bedrooms: 1,
    bathrooms: 1,
    address: "12A Choba Road, Choba, Port Harcourt",
    neighborhood: "Choba",
    city: "Port Harcourt",
    universityNearby: "University of Port Harcourt (UNIPORT)",
    distanceToCampusMinutes: 5,
    distanceDescription: "5 mins walk to UNIPORT Choba Main Gate",
    latitude: 4.8984,
    longitude: 6.9315,
    photos: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
    ],
    videoTourUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    amenities: ["Borehole Water", "Generator Line", "24/7 Security", "Prepaid Meter", "Tiled Floors", "Fenced Gate"],
    isFeatured: true,
    viewsCount: 412,
    isAvailable: true,
    createdAt: "2024-01-10",
    cautionFee: 22000,
    agencyFee: 22000,
  },
  {
    id: "crib-2",
    agentId: "agent-emeka",
    agentName: "Emeka Chukwudi",
    agentPhone: "+234 806 334 5521",
    agentWhatsapp: "2348063345521",
    agentAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    agentVerified: true,
    agencyName: "Chukwudi & Associates Realty PH",
    title: "1-Bedroom Flat | Rumuola, Quiet & Residential, 8 Mins to UNIPORT",
    description: "Well-finished 1-bedroom apartment perfect for postgraduate students or working professionals. Separate sitting room, modern kitchen with shelving, full bathroom, and reliable overhead water tank. Gated compound with security presence.",
    price: 300000,
    period: "per year",
    propertyType: "ONE_BED",
    bedrooms: 1,
    bathrooms: 1,
    address: "5 Rumuola Drive, Rumuola, Port Harcourt",
    neighborhood: "Rumuola",
    city: "Port Harcourt",
    universityNearby: "University of Port Harcourt (UNIPORT)",
    distanceToCampusMinutes: 8,
    distanceDescription: "8 mins keke ride to UNIPORT Main Gate",
    latitude: 4.8143,
    longitude: 7.0135,
    photos: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80",
    ],
    videoTourUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    amenities: ["Security Post", "Personal Water Tank", "Kitchen Shelving", "Fenced Compound", "Quiet Neighborhood"],
    isFeatured: true,
    viewsCount: 278,
    isAvailable: true,
    createdAt: "2024-01-12",
    cautionFee: 30000,
    agencyFee: 30000,
  },
  {
    id: "crib-3",
    agentId: "agent-chidi",
    agentName: "Chidi Nwofor",
    agentPhone: "+234 813 221 8870",
    agentWhatsapp: "2348132218870",
    agentAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    agentVerified: true,
    agencyName: "Nwofor Student Homes PH",
    title: "Affordable Self-Contain | Back Gate Area (Aluu Road), Budget-Friendly",
    description: "Ideal budget room for UNIPORT students near the Back Gate on Aluu Road. Recently whitewashed with tiled floor, separate toilet, and running water. Zero transport to campus Back Gate — just a short stroll.",
    price: 180000,
    period: "per year",
    propertyType: "SELF_CONTAIN",
    bedrooms: 1,
    bathrooms: 1,
    address: "8 Aluu Road, Aluu, Port Harcourt",
    neighborhood: "Aluu",
    city: "Port Harcourt",
    universityNearby: "University of Port Harcourt (UNIPORT)",
    distanceToCampusMinutes: 6,
    distanceDescription: "6 mins walk to UNIPORT Back Gate (Aluu Road)",
    latitude: 4.9112,
    longitude: 6.9187,
    photos: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&auto=format&fit=crop&q=80",
    ],
    videoTourUrl: null,
    amenities: ["Borehole Water", "Ceiling Fan Installed", "Prepaid Meter", "Close to Back Gate"],
    isFeatured: false,
    viewsCount: 231,
    isAvailable: true,
    createdAt: "2024-01-14",
    cautionFee: 18000,
    agencyFee: 18000,
  },
  {
    id: "crib-4",
    agentId: "agent-biodun",
    agentName: "Biodun Adeleke",
    agentPhone: "+234 809 112 3344",
    agentWhatsapp: "2348091123344",
    agentAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    agentVerified: true,
    agencyName: "Adeleke Premium Homes PH",
    title: "Serviced Studio with AC & Inverter | GRA Port Harcourt — Premium",
    description: "Modern fully-furnished studio apartment in Government Residential Area (GRA) PH. Features 24/7 inverter power backup, split-unit air conditioning, borehole water, and high-speed fiber internet. Ideal for graduate students, lecturers, or remote professionals.",
    price: 480000,
    period: "per year",
    propertyType: "STUDIO",
    bedrooms: 1,
    bathrooms: 1,
    address: "31 Birabi Street, GRA Phase 2, Port Harcourt",
    neighborhood: "GRA Port Harcourt",
    city: "Port Harcourt",
    universityNearby: "University of Port Harcourt (UNIPORT)",
    distanceToCampusMinutes: 20,
    distanceDescription: "20 mins Uber/Bolt to UNIPORT Main Gate",
    latitude: 4.8156,
    longitude: 7.0497,
    photos: [
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&auto=format&fit=crop&q=80",
    ],
    videoTourUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    amenities: ["24/7 Inverter Power", "Air Conditioning", "Borehole Water", "Fiber Internet", "Security Guard", "Furnished"],
    isFeatured: true,
    viewsCount: 594,
    isAvailable: true,
    createdAt: "2024-01-08",
    cautionFee: 48000,
    agencyFee: 48000,
  },
  {
    id: "crib-5",
    agentId: "agent-chidi",
    agentName: "Chidi Nwofor",
    agentPhone: "+234 813 221 8870",
    agentWhatsapp: "2348132218870",
    agentAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    agentVerified: true,
    agencyName: "Nwofor Student Homes PH",
    title: "2-Bedroom Shared Flat | Rumuokoro, Commercial Axis",
    description: "Great value 2-bedroom flat for students sharing rent. Two comfortable bedrooms, a living room, full kitchen, and courtyard. Water supply is daily. Rumuokoro is well-connected by keke and bus to UNIPORT.",
    price: 280000,
    period: "per year",
    propertyType: "TWO_BED",
    bedrooms: 2,
    bathrooms: 1,
    address: "17 Ada-George Road, Rumuokoro, Port Harcourt",
    neighborhood: "Rumuokoro",
    city: "Port Harcourt",
    universityNearby: "University of Port Harcourt (UNIPORT)",
    distanceToCampusMinutes: 15,
    distanceDescription: "15 mins keke/bus ride to UNIPORT gate",
    latitude: 4.8631,
    longitude: 7.0219,
    photos: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=80",
    ],
    videoTourUrl: null,
    amenities: ["Spacious Courtyard", "Water Supply", "Separate Prepaid Meter", "Fenced Compound"],
    isFeatured: false,
    viewsCount: 167,
    isAvailable: true,
    createdAt: "2024-01-15",
    cautionFee: 28000,
    agencyFee: 28000,
  },
  {
    id: "crib-6",
    agentId: "agent-emeka",
    agentName: "Emeka Chukwudi",
    agentPhone: "+234 806 334 5521",
    agentWhatsapp: "2348063345521",
    agentAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    agentVerified: true,
    agencyName: "Chukwudi & Associates Realty PH",
    title: "Self-Contain with Private Balcony | Ozuoba — Budget Zone",
    description: "Well-ventilated self-contain with a private balcony overlooking a serene compound in Ozuoba. Overhead water tanks ensure consistent supply. Zero street noise. Perfect for students who need a quiet environment for studying. Within keke reach of UNIPORT.",
    price: 200000,
    period: "per year",
    propertyType: "SELF_CONTAIN",
    bedrooms: 1,
    bathrooms: 1,
    address: "9 Ozuoba Road, Ozuoba, Port Harcourt",
    neighborhood: "Ozuoba",
    city: "Port Harcourt",
    universityNearby: "University of Port Harcourt (UNIPORT)",
    distanceToCampusMinutes: 10,
    distanceDescription: "10 mins keke to UNIPORT Choba Gate",
    latitude: 4.9245,
    longitude: 6.9078,
    photos: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=800&auto=format&fit=crop&q=80",
    ],
    videoTourUrl: null,
    amenities: ["Private Balcony", "Overhead Tank Water", "Security Guard", "Quiet Compound"],
    isFeatured: false,
    viewsCount: 198,
    isAvailable: true,
    createdAt: "2024-01-16",
    cautionFee: 20000,
    agencyFee: 20000,
  },
];

export const INITIAL_REQUESTS: HousingRequest[] = [
  {
    id: "req-1",
    tenantName: "Chisom Okereke",
    tenantPhone: "+234 806 441 7723",
    tenantWhatsapp: "2348064417723",
    tenantSchool: "UNIPORT 100L Engineering",
    title: "Need self-contain near UNIPORT Choba Main Gate, max ₦230k",
    description: "Incoming 100-level Engineering student from Owerri. Looking for a clean self-contain within 10 minutes walking distance to UNIPORT Choba Main Gate. Water must be constant. Budget is strictly ₦230,000/year all inclusive. Ready to inspect this weekend.",
    targetUniversity: "University of Port Harcourt (UNIPORT)",
    preferredArea: "Choba / Ozuoba",
    maxBudget: 230000,
    propertyType: "SELF_CONTAIN",
    moveInDate: "Next 2 Weeks",
    status: "OPEN",
    createdAt: "2024-01-18",
    responsesCount: 4,
  },
  {
    id: "req-2",
    tenantName: "Adaeze Ike",
    tenantPhone: "+234 815 334 2200",
    tenantWhatsapp: "2348153342200",
    tenantSchool: "UNIPORT College of Medicine (Postgrad)",
    title: "1-Bedroom with generator line in Rumuola, max ₦320k",
    description: "Postgraduate Medical Sciences student relocating from Enugu. Need a quiet 1-bedroom flat in a fenced compound near UNIPORT. Must have reliable power source or generator connection line. Move-in date is early next month. No landlord hassle please.",
    targetUniversity: "University of Port Harcourt (UNIPORT)",
    preferredArea: "Rumuola / Rumuigbo",
    maxBudget: 320000,
    propertyType: "ONE_BED",
    moveInDate: "Early Next Month",
    status: "OPEN",
    createdAt: "2024-01-17",
    responsesCount: 2,
  },
];

export const INITIAL_BOOKINGS: InspectionBooking[] = [
  {
    id: "book-1",
    listingId: "crib-1",
    listingTitle: "Clean Self-Contain | 5 Mins Walk to UNIPORT Choba Main Gate",
    agentId: "agent-emeka",
    agentName: "Emeka Chukwudi",
    tenantName: "Kelechi Obi",
    tenantPhone: "08063345599",
    tenantEmail: "kelechi.obi@uniport.edu.ng",
    preferredDate: "2026-10-22",
    preferredTime: "11:00 AM - 1:00 PM",
    message: "Hi Emeka, I resume my 200L next week. I want to see the compound and check if the borehole runs all day before making any payment.",
    status: "PENDING",
    createdAt: "2026-10-18T10:30:00Z",
  },
  {
    id: "book-2",
    listingId: "crib-4",
    listingTitle: "Serviced Studio with AC & Inverter | GRA Port Harcourt — Premium",
    agentId: "user-landlord-nkem",
    agentName: "Chief Nkem Duru",
    tenantName: "Dr. Ifeanyi Eze",
    tenantPhone: "08091123344",
    tenantEmail: "ifeanyi.eze.phd@gmail.com",
    preferredDate: "2026-10-23",
    preferredTime: "2:00 PM - 4:00 PM",
    message: "I work remotely as a lecturer at UNIPORT. Need to verify the inverter runtime and internet speed before committing.",
    status: "CONFIRMED",
    createdAt: "2026-10-19T14:15:00Z",
  },
];

// In-memory active stores (persist for serverless container lifecycle)
let activeListings: Listing[] = [...INITIAL_LISTINGS];
let activeRequests: HousingRequest[] = [...INITIAL_REQUESTS];
let activeBookings: InspectionBooking[] = [...INITIAL_BOOKINGS];
export const INITIAL_ESCROWS: EscrowDeposit[] = [
  {
    id: "escrow-1",
    listingId: "crib-1",
    listingTitle: "Clean Self-Contain | 5 Mins Walk to UNIPORT Choba Main Gate",
    neighborhood: "Choba",
    agentId: "agent-emeka",
    agentName: "Emeka Chukwudi",
    agentPhone: "+234 806 334 5521",
    agentWhatsapp: "2348063345521",
    studentName: "Kelechi Obi",
    studentEmail: "kelechi.obi@uniport.edu.ng",
    studentPhone: "08063345599",
    amount: 10000,
    platformFee: 1000,
    agentPayout: 9000,
    releasePin: "7821",
    paystackReference: "CRIB_ESCROW_179093821",
    status: "HELD_IN_ESCROW",
    holdDurationHours: 48,
    inspectionDate: "2026-11-12",
    inspectionTime: "11:00 AM - 1:00 PM",
    expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

let activeEscrows: EscrowDeposit[] = [...INITIAL_ESCROWS];


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

export function getBookingsByAgent(agentId: string, agentName?: string): InspectionBooking[] {
  return activeBookings.filter((b) => {
    if (b.agentId && b.agentId === agentId) return true;
    if (agentName && b.agentName?.toLowerCase() === agentName.toLowerCase()) return true;
    const listing = getListingById(b.listingId);
    if (listing && (listing.agentId === agentId || (agentName && listing.agentName.toLowerCase() === agentName.toLowerCase()))) {
      return true;
    }
    return false;
  });
}

export function updateBookingStatus(id: string, status: "PENDING" | "CONFIRMED" | "DECLINED" | "COMPLETED"): InspectionBooking | undefined {
  const booking = activeBookings.find((b) => b.id === id);
  if (!booking) return undefined;
  booking.status = status;
  return booking;
}

export function getEscrowDepositsStore(): EscrowDeposit[] {
  return activeEscrows;
}

export function getEscrowById(id: string): EscrowDeposit | undefined {
  return activeEscrows.find((e) => e.id === id);
}

export function getEscrowsByListingId(listingId: string): EscrowDeposit[] {
  return activeEscrows.filter((e) => e.listingId === listingId);
}

export function getEscrowsByAgent(agentId: string, agentName?: string): EscrowDeposit[] {
  return activeEscrows.filter((e) => {
    if (e.agentId && e.agentId === agentId) return true;
    if (agentName && e.agentName.toLowerCase() === agentName.toLowerCase()) return true;
    return false;
  });
}

export function addEscrowDepositStore(deposit: Omit<EscrowDeposit, "id" | "createdAt" | "status" | "releasePin" | "expiresAt">): EscrowDeposit {
  // Generate random 4-digit release PIN
  const releasePin = Math.floor(1000 + Math.random() * 9000).toString();
  const holdHours = deposit.holdDurationHours || 48;
  const expiresAt = new Date(Date.now() + holdHours * 3600 * 1000).toISOString();

  const newEscrow: EscrowDeposit = {
    ...deposit,
    id: "escrow-" + Date.now(),
    releasePin,
    status: "HELD_IN_ESCROW",
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  activeEscrows = [newEscrow, ...activeEscrows];
  return newEscrow;
}

export function updateEscrowStatus(
  id: string,
  status: "HELD_IN_ESCROW" | "RELEASED_TO_AGENT" | "REFUNDED_TO_STUDENT" | "DISPUTED",
  pin?: string,
  reason?: string
): { success: boolean; error?: string; escrow?: EscrowDeposit } {
  const escrow = activeEscrows.find((e) => e.id === id);
  if (!escrow) {
    return { success: false, error: "Escrow record not found." };
  }

  // If releasing to agent, verify PIN if provided
  if (status === "RELEASED_TO_AGENT" && pin) {
    if (pin.trim() !== escrow.releasePin) {
      return { success: false, error: "Invalid Inspection Release PIN. Please ask the tenant for their 4-digit code." };
    }
  }

  escrow.status = status;
  if (reason) escrow.disputeReason = reason;

  return { success: true, escrow };
}


// --- User Authentication Store ---

export const INITIAL_USERS: StoredUser[] = [
  {
    id: "agent-emeka",
    name: "Emeka Chukwudi",
    email: "emeka@chukwudirealty.ng",
    phone: "+234 806 334 5521",
    whatsapp: "2348063345521",
    role: "AGENT",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    agencyName: "Chukwudi & Associates Realty PH",
    bio: "UNIPORT Alum with 7+ years of verified rental experience around Choba, Ozuoba, and Rumuola. Over 50 students safely housed with zero hidden charges. Specialising in self-contains and 1-beds near UNIPORT Main Gate.",
    specializations: "UNIPORT Choba Gate, Ozuoba, Rumuola, Aluu Back Gate",
    passwordSalt: "a1b2c3d4e5f67890",
    passwordHash: "7b134d193fa05928d3e691238dc8f06059d0473ce17f9dc6e9921da8a6234fe6cbe55106b107056637e6da48a903e1e6955a8f4c9c1b33230a1c6e11be6f5ef5",
    isVerified: true,
    ninOrLicense: "RIV-REA-2023-4471",
    tenantsHousedCount: 22,
    rentalsHistory: [
      { id: "rent-1", tenantName: "Chinedu Obi (Engineering 300L)", propertyTitle: "Self-Contain on Choba Road", neighborhood: "Choba", date: "2024-01-04", amount: 220000 },
      { id: "rent-2", tenantName: "Nkechi Aliyu (Medicine Postgrad)", propertyTitle: "1-Bed Flat on Rumuola Drive", neighborhood: "Rumuola", date: "2023-12-18", amount: 300000 },
      { id: "rent-3", tenantName: "Tochukwu Bassey (Remote Worker)", propertyTitle: "Studio in GRA PH", neighborhood: "GRA Port Harcourt", date: "2023-11-20", amount: 480000 },
    ],
    createdAt: "2024-01-01",
  },
  {
    id: "agent-chidi",
    name: "Chidi Nwofor",
    email: "chidi@nwoforhomes.ng",
    phone: "+234 813 221 8870",
    whatsapp: "2348132218870",
    role: "AGENT",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    agencyName: "Nwofor Student Homes PH",
    bio: "Passionate about helping female students and incoming freshers find clean, safe, and gated accommodation around Choba, Aluu, and Rumuokoro near UNIPORT.",
    specializations: "Aluu Back Gate, Rumuokoro, Ozuoba Budget Zone",
    passwordSalt: "b2c3d4e5f6a17890",
    passwordHash: "7b134d193fa05928d3e691238dc8f06059d0473ce17f9dc6e9921da8a6234fe6cbe55106b107056637e6da48a903e1e6955a8f4c9c1b33230a1c6e11be6f5ef5",
    isVerified: true,
    ninOrLicense: "NIN-39204819203",
    tenantsHousedCount: 14,
    rentalsHistory: [
      { id: "rent-4", tenantName: "Blessing Nwosu (Law 200L)", propertyTitle: "Budget Self-Contain Aluu Road", neighborhood: "Aluu", date: "2024-01-08", amount: 180000 },
      { id: "rent-5", tenantName: "Sandra & Amaka (Sciences)", propertyTitle: "2-Bed Shared Flat Rumuokoro", neighborhood: "Rumuokoro", date: "2023-12-05", amount: 280000 },
    ],
    createdAt: "2024-01-05",
  },
  {
    id: "user-landlord-nkem",
    name: "Chief Nkem Duru",
    email: "nkem@duruproperties.com",
    phone: "+234 802 441 5566",
    whatsapp: "2348024415566",
    role: "LANDLORD",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    agencyName: "Duru Commercial & Residential Estate PH",
    bio: "Property developer and landlord owning serviced apartments in GRA Port Harcourt and gated student complexes in Choba. Direct landlord rentals with zero agent middlemen.",
    specializations: "GRA Port Harcourt Serviced Apartments, Choba Student Complexes",
    passwordSalt: "c3d4e5f6a1b27890",
    passwordHash: "7b134d193fa05928d3e691238dc8f06059d0473ce17f9dc6e9921da8a6234fe6cbe55106b107056637e6da48a903e1e6955a8f4c9c1b33230a1c6e11be6f5ef5",
    isVerified: true,
    ninOrLicense: "NIN-77192830491",
    tenantsHousedCount: 31,
    rentalsHistory: [
      { id: "rent-6", tenantName: "Dr. Amara Okonkwo (UNIPORT Lecturer)", propertyTitle: "Serviced 1-Bed GRA PH", neighborhood: "GRA Port Harcourt", date: "2024-01-11", amount: 480000 },
      { id: "rent-7", tenantName: "Emeka Onyekachi (Software Engineer)", propertyTitle: "Studio Apartment GRA PH", neighborhood: "GRA Port Harcourt", date: "2023-12-22", amount: 480000 },
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


