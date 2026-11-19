import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { checkRateLimit, sanitizeText } from "@/lib/auth-security";
import { PH_NEIGHBORHOODS } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED_PROPERTY_TYPES = new Set([
  "SELF_CONTAIN",
  "ONE_BED",
  "TWO_BED",
  "THREE_BED",
  "STUDIO",
]);

function normalizeGeminiResult(raw: any) {
  const neighborhood = PH_NEIGHBORHOODS.includes(raw?.neighborhood)
    ? raw.neighborhood
    : "Choba";
  const propertyType = ALLOWED_PROPERTY_TYPES.has(raw?.propertyType)
    ? raw.propertyType
    : "SELF_CONTAIN";
  const price =
    Number.isFinite(Number(raw?.price)) && Number(raw.price) > 0
      ? Math.round(Number(raw.price))
      : 250000;
  const cautionFee =
    Number.isFinite(Number(raw?.cautionFee)) && Number(raw.cautionFee) >= 0
      ? Math.round(Number(raw.cautionFee))
      : Math.round(price * 0.1);
  const agencyFee =
    Number.isFinite(Number(raw?.agencyFee)) && Number(raw.agencyFee) >= 0
      ? Math.round(Number(raw.agencyFee))
      : Math.round(price * 0.1);
  const distanceToCampusMinutes =
    Number.isFinite(Number(raw?.distanceToCampusMinutes)) &&
    Number(raw.distanceToCampusMinutes) >= 0
      ? Math.min(180, Math.round(Number(raw.distanceToCampusMinutes)))
      : 8;

  return {
    title: sanitizeText(raw?.title || `Student Lodge in ${neighborhood}`, 160),
    neighborhood,
    propertyType,
    price,
    cautionFee,
    agencyFee,
    distanceToCampusMinutes,
    address: sanitizeText(raw?.address || `Off UNIPORT Road, ${neighborhood}, Port Harcourt`, 200),
    description: sanitizeText(raw?.description || "", 1500),
    amenities: Array.isArray(raw?.amenities)
      ? raw.amenities.map((a: unknown) => sanitizeText(a, 60)).filter(Boolean).slice(0, 15)
      : ["Borehole Water", "Prepaid Meter", "24/7 Security"],
  };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { user } = auth.context;
    const { allowed } = checkRateLimit(`ai-parse:${user.id}`, 20, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "AI parser rate limit reached. Please wait a few minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const rawText = sanitizeText(body.prompt || "", 1000);
    const hasPhoto = Boolean(body.photoUrl);

    if (!rawText && !hasPhoto) {
      return NextResponse.json(
        { error: "Please type or speak a short description, or upload a photo first." },
        { status: 400 }
      );
    }

    // 1. If GEMINI_API_KEY is configured, try Gemini structured extraction via header (not URL query)
    const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (geminiKey && rawText) {
      try {
        const geminiRes = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": geminiKey,
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are an expert Port Harcourt / UNIPORT real estate listing assistant. Extract structured property fields from this landlord/agent note: ${JSON.stringify(
                        rawText
                      )}.
Return ONLY valid JSON with these exact keys:
{
  "title": string,
  "neighborhood": "Choba" | "Ozuoba" | "Aluu" | "Rumuola" | "Rumuokoro" | "Rumuigbo" | "GRA Port Harcourt",
  "propertyType": "SELF_CONTAIN" | "ONE_BED" | "TWO_BED" | "THREE_BED" | "STUDIO",
  "price": number,
  "cautionFee": number,
  "agencyFee": number,
  "distanceToCampusMinutes": number,
  "address": string,
  "description": string,
  "amenities": string[]
}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const textOut = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textOut) {
            const parsed = normalizeGeminiResult(JSON.parse(textOut));
            return NextResponse.json({ success: true, listing: parsed, source: "gemini" });
          }
        }
      } catch (err) {
        console.warn("Gemini parse fallback to built-in NLP engine:", err);
      }
    }

    // 2. Built-in Nigerian Real Estate & UNIPORT NLP Parser (offline fallback)
    const lower = rawText.toLowerCase();

    // Detect neighborhood
    let neighborhood = "Choba";
    if (lower.includes("aluu") || lower.includes("omuoko") || lower.includes("back gate")) {
      neighborhood = "Aluu";
    } else if (lower.includes("ozuoba") || lower.includes("ntaugba")) {
      neighborhood = "Ozuoba";
    } else if (lower.includes("rumuola")) {
      neighborhood = "Rumuola";
    } else if (lower.includes("rumuokoro") || lower.includes("rumuosi")) {
      neighborhood = "Rumuokoro";
    } else if (lower.includes("rumuigbo")) {
      neighborhood = "Rumuigbo";
    } else if (/\bgra\b/.test(lower)) {
      neighborhood = "GRA Port Harcourt";
    }

    // Detect property type (check specific bedroom counts BEFORE generic "flat")
    let propertyType = "SELF_CONTAIN";
    let typeTitle = "Executive Self-Contain";
    if (/\b(3|three)[\s-]*bed/i.test(lower)) {
      propertyType = "THREE_BED";
      typeTitle = "Spacious 3-Bedroom Flat";
    } else if (/\b(2|two)[\s-]*bed/i.test(lower)) {
      propertyType = "TWO_BED";
      typeTitle = "Spacious 2-Bedroom Flat";
    } else if (/\b(1|one)[\s-]*bed|\bchamber\b|\bmini[\s-]*flat\b/i.test(lower)) {
      propertyType = "ONE_BED";
      typeTitle = "Modern 1-Bedroom Apartment";
    } else if (/\bflat\b/i.test(lower)) {
      propertyType = "TWO_BED";
      typeTitle = "Spacious 2-Bedroom Flat";
    } else if (/\bstudio\b|\bserviced\b/i.test(lower)) {
      propertyType = "STUDIO";
      typeTitle = "Serviced Student Studio";
    }

    // Extract price (supports "250k", "300,000", "250000", "1.2m" while ignoring distances like "200m")
    let price = 250000;
    const kMatch = lower.match(/(?:₦|ngn|n)?\s*(\d+(?:\.\d+)?)\s*k\b/);
    const mMatch = lower.match(/(?:₦|ngn|n)?\s*(\d+(?:\.\d+)?)\s*(?:m|million)\b/);
    const rawNumMatch = lower.replace(/,/g, "").match(/\b(\d{5,8})\b/);

    if (kMatch) {
      price = Math.round(parseFloat(kMatch[1]) * 1000);
    } else if (mMatch && parseFloat(mMatch[1]) > 0 && parseFloat(mMatch[1]) <= 20) {
      // Values > 20 with "m" are almost always distances in meters (e.g. "200m from gate")
      price = Math.round(parseFloat(mMatch[1]) * 1_000_000);
    } else if (rawNumMatch) {
      price = parseInt(rawNumMatch[1], 10);
    }

    const agencyFee = Math.round(price * 0.1);
    const cautionFee = price >= 400000 ? 50000 : 30000;

    // Extract distance in minutes
    let distanceToCampusMinutes = neighborhood === "Choba" || neighborhood === "Aluu" ? 5 : 12;
    const minMatch = lower.match(/(\d{1,2})\s*(?:min|mins|minute|minutes)\b/);
    if (minMatch) {
      distanceToCampusMinutes = parseInt(minMatch[1], 10);
    }

    // Extract amenities with word-boundary matching
    const amenities = new Set<string>([
      "Borehole Water",
      "Prepaid Meter",
      "Fenced Gate",
      "24/7 Security",
    ]);
    if (/\bac\b|air\s*condition/i.test(lower)) amenities.add("Air Conditioning");
    if (/\bfurnish|\bwardrobe|\bbed\s*frame/i.test(lower)) amenities.add("Furnished");
    if (/\bcabinet|\bkitchen/i.test(lower)) amenities.add("Kitchen Cabinets");
    if (/\bbalcony|\bupstairs/i.test(lower)) amenities.add("Balcony");
    if (/\bgen(erator)?\b|\bsolar\b|steady\s*light/i.test(lower)) amenities.add("Generator Line");
    if (/\btank\b|\bwater\b/i.test(lower)) amenities.add("Personal Water Tank");

    const address =
      rawText.length > 8 && rawText.length < 70
        ? rawText
        : `Off UNIPORT Road, ${neighborhood}, Port Harcourt`;

    const title = `Newly Built ${typeTitle} at ${neighborhood} (${distanceToCampusMinutes} Mins to UNIPORT)`;

    const description =
      `Clean, student-ready ${typeTitle.toLowerCase()} located in a secure, gated compound at ${neighborhood}, Port Harcourt (${distanceToCampusMinutes} minutes to UNIPORT Gate). ` +
      `Features constant borehole water, prepaid electricity meter, tiled finishing, kitchen cabinets, and 24/7 compound security. ` +
      (rawText ? `Agent Note: ${rawText}. ` : "") +
      `Protected by CribConnect 48-Hour Holding Escrow — inspect physically before releasing your PIN.`;

    return NextResponse.json({
      success: true,
      listing: {
        title,
        neighborhood,
        propertyType,
        price,
        cautionFee,
        agencyFee,
        distanceToCampusMinutes,
        address,
        description,
        amenities: Array.from(amenities),
      },
      source: "ai-nlp",
    });
  } catch (error) {
    console.error("AI listing parse error:", error);
    return NextResponse.json(
      { error: "Failed to auto-extract property details." },
      { status: 500 }
    );
  }
}
