import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const university = searchParams.get("university");
    const propertyType = searchParams.get("propertyType");
    const status = searchParams.get("status") || "OPEN";
    const studentId = searchParams.get("studentId");

    const where: any = {};

    if (status !== "ALL") {
      where.status = status;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (university && university !== "ALL") {
      where.targetUniversity = { contains: university };
    }

    if (propertyType && propertyType !== "ALL") {
      where.propertyType = propertyType;
    }

    const requests = await prisma.housingRequest.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            city: true,
            currentSchool: true,
          },
        },
        proposals: {
          select: {
            id: true,
            agentId: true,
            proposedPrice: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Failed to fetch housing requests:", error);
    return NextResponse.json({ error: "Failed to fetch housing requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    const request = await prisma.housingRequest.create({
      data: {
        studentId: user.id,
        title: data.title,
        description: data.description,
        targetUniversity: data.targetUniversity || "University of Lagos (UNILAG)",
        preferredAreas: JSON.stringify(data.preferredAreas || ["Akoka", "Yaba"]),
        maxBudget: parseFloat(data.maxBudget),
        currency: data.currency || "NGN",
        propertyType: data.propertyType || "SELF_CONTAIN",
        moveInDate: data.moveInDate || new Date().toISOString().split("T")[0],
        duration: data.duration || "1 Year",
        needsRoommate: Boolean(data.needsRoommate),
        status: "OPEN",
      },
    });

    return NextResponse.json({ success: true, request });
  } catch (error) {
    console.error("Failed to create housing request:", error);
    return NextResponse.json({ error: "Failed to create housing request" }, { status: 500 });
  }
}
