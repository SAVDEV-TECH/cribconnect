import { NextRequest, NextResponse } from "next/server";
import {
  getEscrowDepositsStore,
  getEscrowsByListingId,
  getEscrowsByAgent,
} from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get("listingId");
    const agentId = searchParams.get("agentId");

    let escrows = getEscrowDepositsStore();

    if (listingId) {
      escrows = getEscrowsByListingId(listingId);
    } else if (agentId) {
      escrows = getEscrowsByAgent(agentId);
    }

    return NextResponse.json({
      success: true,
      escrows,
    });
  } catch (error: any) {
    console.error("Fetch escrows error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve escrow records." },
      { status: 500 }
    );
  }
}
