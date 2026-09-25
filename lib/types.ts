export type Role = "STUDENT" | "AGENT" | "ADMIN";

export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export type AgentTier = "FREE" | "PRO";

export type PropertyType =
  | "SELF_CONTAIN"
  | "ONE_BED"
  | "TWO_BED"
  | "THREE_BED"
  | "HOSTEL_BED"
  | "STUDIO";

export interface DemoPersona {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  avatar: string;
  badge?: string;
  description: string;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: "student-chidi",
    name: "Chidi Nwosu",
    email: "chidi.student@unilag.edu.ng",
    role: "STUDENT",
    title: "Incoming UNILAG Fresher (Computer Science)",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
    badge: "Student Renter",
    description: "Looking for a secure self-contain near UNILAG Akoka gate.",
  },
  {
    id: "agent-kolawole",
    name: "Kolawole Adebayo",
    email: "kolawole@campusnest.ng",
    role: "AGENT",
    title: "Campus Nest Properties • Top Rated UNILAG Specialist",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    badge: "Verified Pro Agent ★ 5.0",
    description: "10+ years helping UNILAG students relocate safely.",
  },
  {
    id: "agent-bisi",
    name: "Bisi Adeleke",
    email: "bisi.yaba@gmail.com",
    role: "AGENT",
    title: "Independent Manager (Verification Pending)",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    badge: "Pending Admin Approval",
    description: "Awaiting ID check approval by CribConnect admins.",
  },
  {
    id: "admin-tola",
    name: "Tola Balogun",
    email: "admin@cribconnect.ng",
    role: "ADMIN",
    title: "Platform Trust & Safety Officer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    badge: "System Administrator",
    description: "Reviews agent credentials, oversees safety & disputes.",
  },
];

export type Currency = "NGN" | "USD" | "GBP";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
};

export const EXCHANGE_RATES: Record<Currency, number> = {
  NGN: 1,
  USD: 1 / 1550, // Approx Naira to USD
  GBP: 1 / 1950, // Approx Naira to GBP
};

export function formatMoney(amountInNgn: number, currency: Currency = "NGN"): string {
  const rate = EXCHANGE_RATES[currency] || 1;
  const converted = amountInNgn * rate;
  const symbol = CURRENCY_SYMBOLS[currency] || "₦";

  if (currency === "NGN") {
    return `${symbol}${converted.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
  }
  return `${symbol}${converted.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
