import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const request = await prisma.housingRequest.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            city: true,
            currentSchool: true,
            phone: true,
            whatsapp: true,
          },
        },
        proposals: {
          include: {
            agent: {
              select: {
                id: true,
                name: true,
                avatar: true,
                phone: true,
                whatsapp: true,
                agentProfile: true,
              },
            },
            listing: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Housing request not found" }, { status: 404 });
    }

    return NextResponse.json({ request });
  } catch (error) {
    console.error("Failed to fetch request:", error);
    return NextResponse.json({ error: "Failed to fetch request" }, { status: 500 });
  }
}
