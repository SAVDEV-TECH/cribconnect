import { NextRequest, NextResponse } from "next/server";
import { getRequestsStore, addRequestStore } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const requests = getRequestsStore();
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Failed to fetch requests:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title || !body.maxBudget || !body.tenantName) {
      return NextResponse.json(
        { error: "Please provide your name, budget, and request title." },
        { status: 400 }
      );
    }

    const newRequest = addRequestStore({
      tenantName: body.tenantName,
      tenantPhone: body.tenantPhone || "+234 800 000 0000",
      tenantWhatsapp: body.tenantWhatsapp?.replace(/\D/g, "") || body.tenantPhone?.replace(/\D/g, "") || "2348000000000",
      tenantSchool: body.tenantSchool || "UNILAG Student",
      title: body.title,
      description: body.description || "Looking for reliable accommodation matching my budget.",
      targetUniversity: body.targetUniversity || "University of Lagos (UNILAG)",
      preferredArea: body.preferredArea || "Akoka / Yaba Axis",
      maxBudget: parseFloat(body.maxBudget),
      propertyType: body.propertyType || "SELF_CONTAIN",
      moveInDate: body.moveInDate || "As soon as possible",
    });

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error) {
    console.error("Failed to create request:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
