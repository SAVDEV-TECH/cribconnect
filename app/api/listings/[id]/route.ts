import { NextRequest, NextResponse } from "next/server";
import { getListingById, deleteListingById, incrementListingMetric } from "@/lib/data-store";
import { requireAuth } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const listing = (await incrementListingMetric(id, "views")) || (await getListingById(id));

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ listing });
  } catch (error) {
    console.error("Failed to fetch listing:", error);
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const clientIp = getClientIp(req);
    const { allowed } = checkRateLimit(`listing-track:${clientIp}:${id}`, 20, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many tracking requests" }, { status: 429 });
    }

    const updated = await incrementListingMetric(id, "whatsapp");
    if (!updated) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, listing: updated });
  } catch (error) {
    console.error("Failed to track connect:", error);
    return NextResponse.json({ error: "Failed to track connect" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { user, isAdmin } = auth.context;
    const { id } = params;

    const existing = await getListingById(id);
    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (!isAdmin && existing.agentId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete listings that belong to your account." },
        { status: 403 }
      );
    }

    const deleted = await deleteListingById(id);
    if (!deleted) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete listing:", error);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}
