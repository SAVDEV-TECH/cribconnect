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
