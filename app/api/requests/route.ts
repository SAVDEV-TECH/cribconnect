import { NextRequest, NextResponse } from "next/server";
import { getRequestsStore, addRequestStore } from "@/lib/data-store";
import { getSessionContext } from "@/lib/session";
import {
  checkRateLimit,
  getClientIp,
  isValidPhone,
  sanitizeText,
} from "@/lib/auth-security";
import { formatNigerianWhatsApp } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED_PROPERTY_TYPES = new Set([
  "SELF_CONTAIN",
  "ONE_BED",
  "TWO_BED",
  "THREE_BED",
  "HOSTEL_BED",
  "STUDIO",
]);

export async function GET() {
  try {
    const requests = await getRequestsStore();
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Failed to fetch requests:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const { allowed } = checkRateLimit(`request-create:${clientIp}`, 10, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many housing requests submitted. Please try again later." },
        { status: 429 }
      );
    }

    const sessionCtx = await getSessionContext();
    const body = await req.json();

    const title = sanitizeText(body.title, 160);
    const tenantName = sanitizeText(body.tenantName || sessionCtx?.user.name || "", 120);
    const maxBudget = Number(body.maxBudget);

    if (!title || !tenantName || !Number.isFinite(maxBudget) || maxBudget <= 0 || maxBudget > 100_000_000) {
      return NextResponse.json(
        { error: "Please provide your name, a valid budget, and request title." },
        { status: 400 }
      );
    }

    const rawPhone = sanitizeText(body.tenantPhone || sessionCtx?.user.phone || "", 30);
    if (rawPhone && !isValidPhone(rawPhone)) {
      return NextResponse.json(
        { error: "Please provide a valid Nigerian or international phone number." },
        { status: 400 }
      );
    }

    const formattedWa =
      formatNigerianWhatsApp(body.tenantWhatsapp || rawPhone || sessionCtx?.user.whatsapp) || "";

    const rawType = sanitizeText(body.propertyType || "SELF_CONTAIN", 30);
    const propertyType = ALLOWED_PROPERTY_TYPES.has(rawType) ? rawType : "SELF_CONTAIN";

    const newRequest = await addRequestStore({
      studentId: sessionCtx?.user.id,
      tenantName,
      tenantPhone: rawPhone || "",
      tenantWhatsapp: formattedWa,
      tenantSchool: sanitizeText(body.tenantSchool || "UNIPORT Student", 120),
      title,
      description: sanitizeText(
        body.description || "Looking for reliable accommodation matching my budget.",
        1500
      ),
      targetUniversity: sanitizeText(
        body.targetUniversity || "University of Port Harcourt (UNIPORT)",
        120
      ),
      preferredArea: sanitizeText(body.preferredArea || "Choba / Ozuoba", 100),
      maxBudget: Math.round(maxBudget),
      propertyType,
      moveInDate: sanitizeText(body.moveInDate || "As soon as possible", 60),
    });

    return NextResponse.json({ success: true, request: newRequest }, { status: 201 });
  } catch (error) {
    console.error("Failed to create request:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
