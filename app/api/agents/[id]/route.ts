import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Look up by agent profile id or by user id
    const profile = await prisma.agentProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        user: {
          include: {
            listings: {
              where: { isAvailable: true },
            },
          },
        },
        reviewsReceived: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                avatar: true,
                city: true,
                currentSchool: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Failed to fetch agent profile:", error);
    return NextResponse.json({ error: "Failed to fetch agent" }, { status: 500 });
  }
}
