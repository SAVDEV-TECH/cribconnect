import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            whatsapp: true,
            avatar: true,
            agentProfile: {
              include: {
                reviewsReceived: {
                  include: {
                    student: {
                      select: {
                        name: true,
                        avatar: true,
                        currentSchool: true,
                      },
                    },
                  },
                  orderBy: { createdAt: "desc" },
                },
              },
            },
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Increment views count asynchronously
    await prisma.listing.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });

    return NextResponse.json({ listing });
  } catch (error) {
    console.error("Failed to fetch listing:", error);
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (existing.agentId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, listing: updated });
  } catch (error) {
    console.error("Failed to update listing:", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (existing.agentId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.listing.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete listing:", error);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}
