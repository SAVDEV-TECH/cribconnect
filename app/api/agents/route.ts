import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const university = searchParams.get("university");
    const verifiedOnly = searchParams.get("verifiedOnly");

    const where: any = {};

    if (verifiedOnly === "true") {
      where.verificationStatus = "VERIFIED";
    }

    if (university && university !== "ALL") {
      where.campusSpecialization = { contains: university };
    }

    const agents = await prisma.agentProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            whatsapp: true,
            avatar: true,
            city: true,
            currentSchool: true,
            listings: {
              where: { isAvailable: true },
              select: { id: true, title: true, price: true, photos: true },
            },
          },
        },
        reviewsReceived: {
          include: {
            student: {
              select: { name: true, avatar: true },
            },
          },
        },
      },
      orderBy: [
        { verificationStatus: "asc" }, // VERIFIED first
        { rating: "desc" },
      ],
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Failed to fetch public agents directory:", error);
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}
