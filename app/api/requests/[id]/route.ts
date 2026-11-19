import { NextRequest, NextResponse } from "next/server";
import {
  getListingById,
  getProposalsByRequestId,
  getRequestById,
  updateRequestStore,
} from "@/lib/data-store";
import { requireAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const request = await getRequestById(id);
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const rawProposals = await getProposalsByRequestId(id);
    const enrichedProposals = await Promise.all(
      rawProposals.map(async (p) => {
        const listing = p.listingId ? (await getListingById(p.listingId)) || null : null;
        return {
          ...p,
          agent: {
            id: p.agentId,
            name: p.agentName,
            avatar: p.agentAvatar,
            phone: p.agentPhone,
            whatsapp: p.agentWhatsapp,
            agentProfile: {
              agencyName: p.agencyName,
              verificationStatus: p.agentVerified ? "VERIFIED" : "UNVERIFIED",
              rating: null,
            },
          },
          listing,
        };
      })
    );

    return NextResponse.json({
      request: {
        ...request,
        student: {
          id: request.studentId || "",
          name: request.tenantName,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
            request.tenantName
          )}`,
          city: "Port Harcourt",
          currentSchool: request.tenantSchool || "UNIPORT",
        },
        proposals: enrichedProposals,
      },
    });
  } catch (error) {
    console.error("Failed to fetch request:", error);
    return NextResponse.json({ error: "Failed to fetch request" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { user, isAdmin } = auth.context;
    const { id } = params;
    const existing = await getRequestById(id);
    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (!isAdmin && (!existing.studentId || existing.studentId !== user.id)) {
      return NextResponse.json(
        { error: "Forbidden: Only the request owner or an admin can update this request." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const status = body.status as "OPEN" | "MATCHED" | "CLOSED";
    if (!["OPEN", "MATCHED", "CLOSED"].includes(status)) {
      return NextResponse.json({ error: "Invalid request status." }, { status: 400 });
    }

    const updated = await updateRequestStore(id, { status });
    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error("Failed to update request:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
