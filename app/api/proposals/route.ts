import { NextRequest, NextResponse } from "next/server";
import {
  addProposalStore,
  getListingById,
  getProposalById,
  getProposalsStore,
  getRequestById,
  updateProposalStatus,
  updateRequestStore,
} from "@/lib/data-store";
import { requireAuth } from "@/lib/session";
import { checkRateLimit, sanitizeText } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId")?.trim();
    const agentId = searchParams.get("agentId")?.trim();

    let proposals = await getProposalsStore();
    if (requestId) {
      proposals = proposals.filter((p) => p.requestId === requestId);
    }
    if (agentId) {
      proposals = proposals.filter((p) => p.agentId === agentId);
    }

    const enriched = await Promise.all(
      proposals.map(async (p) => {
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

    return NextResponse.json({ proposals: enriched });
  } catch (error) {
    console.error("Failed to fetch proposals:", error);
    return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { user, isAdmin } = auth.context;
    if (!isAdmin && user.role !== "AGENT" && user.role !== "LANDLORD") {
      return NextResponse.json(
        { error: "Only registered Agents or Landlords can submit proposals." },
        { status: 403 }
      );
    }

    const { allowed } = checkRateLimit(`proposal-create:${user.id}`, 30, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Proposal rate limit reached. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const requestId = sanitizeText(body.requestId, 100);
    const pitchMessage = sanitizeText(body.pitchMessage, 1500);
    const proposedPrice = Number(body.proposedPrice);
    const agencyFee = body.agencyFee !== undefined && body.agencyFee !== "" ? Number(body.agencyFee) : 0;
    const cautionFee = body.cautionFee !== undefined && body.cautionFee !== "" ? Number(body.cautionFee) : 0;
    const period = sanitizeText(body.period || "per year", 30);

    if (!requestId || pitchMessage.length < 10 || !Number.isFinite(proposedPrice) || proposedPrice <= 0) {
      return NextResponse.json(
        { error: "Please provide a valid request, price, and pitch message (min 10 characters)." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(agencyFee) || agencyFee < 0 || !Number.isFinite(cautionFee) || cautionFee < 0) {
      return NextResponse.json(
        { error: "Agency fee and caution fee must be non-negative numbers." },
        { status: 400 }
      );
    }

    const parentRequest = await getRequestById(requestId);
    if (!parentRequest) {
      return NextResponse.json({ error: "Housing request not found." }, { status: 404 });
    }
    if (parentRequest.status === "CLOSED") {
      return NextResponse.json(
        { error: "This housing request is already closed." },
        { status: 409 }
      );
    }

    let listingId: string | null = null;
    if (body.listingId) {
      const candidate = await getListingById(sanitizeText(body.listingId, 100));
      if (!candidate) {
        return NextResponse.json({ error: "Attached listing not found." }, { status: 404 });
      }
      if (!isAdmin && candidate.agentId !== user.id) {
        return NextResponse.json(
          { error: "Forbidden: You can only attach your own listings." },
          { status: 403 }
        );
      }
      listingId = candidate.id;
    }

    const totalUpfront = Math.round(proposedPrice + agencyFee + cautionFee);

    const proposal = await addProposalStore({
      requestId: parentRequest.id,
      agentId: user.id,
      agentName: user.name,
      agentAvatar: user.avatar,
      agentPhone: user.phone,
      agentWhatsapp: user.whatsapp,
      agentVerified: Boolean(user.isVerified),
      agencyName: user.agencyName || "Independent Realtor",
      listingId,
      pitchMessage,
      proposedPrice: Math.round(proposedPrice),
      currency: "NGN",
      period,
      agencyFee: Math.round(agencyFee),
      cautionFee: Math.round(cautionFee),
      totalUpfront,
    });

    return NextResponse.json(
      { success: true, message: "Proposal submitted!", proposal },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create proposal:", error);
    return NextResponse.json({ error: "Failed to submit proposal" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { user, isAdmin } = auth.context;
    const body = await req.json();
    const id = sanitizeText(body.id, 100);
    const status = body.status as "SHORTLISTED" | "ACCEPTED" | "DECLINED";

    if (!id || !["SHORTLISTED", "ACCEPTED", "DECLINED"].includes(status)) {
      return NextResponse.json(
        { error: "Valid proposal ID and status (SHORTLISTED, ACCEPTED, DECLINED) are required." },
        { status: 400 }
      );
    }

    const proposal = await getProposalById(id);
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
    }

    const parentRequest = await getRequestById(proposal.requestId);
    const isRequestOwner = Boolean(parentRequest?.studentId && parentRequest.studentId === user.id);

    if (!isAdmin && !isRequestOwner) {
      return NextResponse.json(
        { error: "Forbidden: Only the student who posted this request or an admin can update proposals." },
        { status: 403 }
      );
    }

    const updated = await updateProposalStatus(id, status);
    if (status === "ACCEPTED" && parentRequest) {
      await updateRequestStore(parentRequest.id, { status: "MATCHED" });
    }

    return NextResponse.json({ success: true, proposal: updated });
  } catch (error) {
    console.error("Failed to update proposal:", error);
    return NextResponse.json({ error: "Failed to update proposal" }, { status: 500 });
  }
}
