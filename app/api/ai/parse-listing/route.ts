import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawText = String(body.prompt || "").trim();
    const hasPhoto = Boolean(body.photoUrl);

    if (!rawText && !hasPhoto) {
      return NextResponse.json(
        { error: "Please type or speak a short description, or upload a photo first." },
        { status: 400 }
      );
    }

    // 1. If GEMINI_API_KEY is configured, try Gemini multimodal/structured extraction first
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && rawText) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are an expert Port Harcourt / UNIPORT real estate listing assistant. Extract structured property fields from this landlord/agent note: "${rawText}".
Return ONLY valid JSON with these exact keys:
{
  "title": string,
  "neighborhood": "Choba" | "Ozuoba" | "Aluu" | "Rumuola" | "Rumuokoro" | "GRA Port Harcourt",
  "propertyType": "SELF_CONTAIN" | "ONE_BED" | "TWO_BED" | "STUDIO",
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
            const parsed = JSON.parse(textOut);
            return NextResponse.json({ success: true, listing: parsed, source: "gemini" });
          }
        }
      } catch (err) {
        console.warn("Gemini parse fallback to built-in NLP engine:", err);
      }
    }

    // 2. Built-in Intelligent Nigerian Real Estate & UNIPORT NLP Parser (Works 100% offline/zero-key)
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
    } else if (lower.includes("gra")) {
      neighborhood = "GRA Port Harcourt";
    }

    // Detect property type
    let propertyType = "SELF_CONTAIN";
    let typeTitle = "Executive Self-Contain";
    if (
      lower.includes("2 bed") ||
      lower.includes("two bed") ||
      lower.includes("2-bed") ||
      lower.includes("flat")
    ) {
      propertyType = "TWO_BED";
      typeTitle = "Spacious 2-Bedroom Flat";
    } else if (
      lower.includes("1 bed") ||
      lower.includes("one bed") ||
      lower.includes("1-bed") ||
      lower.includes("chamber")
    ) {
      propertyType = "ONE_BED";
      typeTitle = "Modern 1-Bedroom Apartment";
    } else if (lower.includes("studio") || lower.includes("serviced")) {
      propertyType = "STUDIO";
      typeTitle = "Serviced Student Studio";
    }

    // Extract price (supports "250k", "300,000", "250000", "1.2m")
    let price = 250000;
    const kMatch = lower.match(/(\d+(?:\.\d+)?)\s*k\b/);
    const mMatch = lower.match(/(\d+(?:\.\d+)?)\s*m\b/);
    const rawNumMatch = lower.replace(/,/g, "").match(/\b(\d{5,7})\b/);

    if (kMatch) {
      price = Math.round(parseFloat(kMatch[1]) * 1000);
    } else if (mMatch) {
      price = Math.round(parseFloat(mMatch[1]) * 1000000);
    } else if (rawNumMatch) {
      price = parseInt(rawNumMatch[1], 10);
    }

    const agencyFee = Math.round(price * 0.1);
    const cautionFee = price >= 400000 ? 50000 : 30000;

    // Extract distance in minutes
    let distanceToCampusMinutes = neighborhood === "Choba" || neighborhood === "Aluu" ? 5 : 12;
    const minMatch = lower.match(/(\d{1,2})\s*(?:min|mins|minute|minutes)/);
    if (minMatch) {
      distanceToCampusMinutes = parseInt(minMatch[1], 10);
    }

    // Extract amenities
    const amenities = new Set<string>([
      "Borehole Water",
      "Prepaid Meter",
      "Fenced Gate",
      "24/7 Security",
    ]);
    if (lower.includes("ac") || lower.includes("air condition")) amenities.add("Air Conditioning");
    if (lower.includes("furnish") || lower.includes("bed") || lower.includes("wardrobe"))
      amenities.add("Furnished");
    if (lower.includes("cabinet") || lower.includes("kitchen")) amenities.add("Kitchen Cabinets");
    if (lower.includes("balcony") || lower.includes("upstairs")) amenities.add("Balcony");
    if (lower.includes("gen") || lower.includes("solar") || lower.includes("steady light"))
      amenities.add("Generator Line");
    if (lower.includes("tank") || lower.includes("water")) amenities.add("Personal Water Tank");

    // Extract specific street landmark if mentioned
    const address =
      rawText.length > 8 && rawText.length < 70
        ? rawText
        : `Off UNIPORT Road, ${neighborhood}, Port Harcourt`;

    const title = `Newly Built ${typeTitle} at ${neighborhood} (${distanceToCampusMinutes} Mins to UNIPORT)`;

    const description =
      `Clean, student-ready ${typeTitle.toLowerCase()} located in a secure, gated compound at ${neighborhood}, Port Harcourt (${distanceToCampusMinutes} minutes to UNIPORT Gate). ` +
      `Features constant borehole water, prepaid electricity meter, POP/tiled finishing, kitchen cabinets, and 24/7 compound security. ` +
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
