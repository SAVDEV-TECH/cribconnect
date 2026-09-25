import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "AGENT" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Only registered agents can submit proposals." },
        { status: 403 }
      );
    }

    const data = await req.json();
    const {
      requestId,
      listingId,
      pitchMessage,
      proposedPrice,
      agencyFee,
      cautionFee,
      currency,
      period,
    } = data;

    if (!requestId || !pitchMessage || !proposedPrice) {
      return NextResponse.json(
        { error: "Request ID, pitch message, and proposed price are required." },
        { status: 400 }
      );
    }

    const price = parseFloat(proposedPrice);
    const agency = agencyFee ? parseFloat(agencyFee) : price * 0.1; // Default 10%
    const caution = cautionFee ? parseFloat(cautionFee) : price * 0.1; // Default 10%
    const totalUpfront = price + agency + caution;

    const proposal = await prisma.proposal.create({
      data: {
        requestId,
        agentId: user.id,
        listingId: listingId || null,
        pitchMessage,
        proposedPrice: price,
        agencyFee: agency,
        cautionFee: caution,
        totalUpfront,
        currency: currency || "NGN",
        period: period || "per year",
        status: "SUBMITTED",
      },
      include: {
        listing: true,
        agent: {
          select: {
            id: true,
            name: true,
            avatar: true,
            agentProfile: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, proposal });
  } catch (error) {
    console.error("Failed to submit proposal:", error);
    return NextResponse.json({ error: "Failed to submit proposal" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { proposalId, status } = await req.json();

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { request: true },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Only student owner of request or admin can accept/shortlist/decline
    if (proposal.request.studentId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.proposal.update({
      where: { id: proposalId },
      data: { status },
    });

    if (status === "ACCEPTED") {
      // Also mark request as MATCHED
      await prisma.housingRequest.update({
        where: { id: proposal.requestId },
        data: { status: "MATCHED" },
      });
    }

    return NextResponse.json({ success: true, proposal: updated });
  } catch (error) {
    console.error("Failed to update proposal:", error);
    return NextResponse.json({ error: "Failed to update proposal" }, { status: 500 });
  }
}
