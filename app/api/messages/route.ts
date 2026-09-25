import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get("otherUserId");

    const where: any = {
      OR: [
        { senderId: user.id },
        { recipientId: user.id },
      ],
    };

    if (otherUserId) {
      where.AND = [
        {
          OR: [
            { senderId: user.id, recipientId: otherUserId },
            { senderId: otherUserId, recipientId: user.id },
          ],
        },
      ];
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            agentProfile: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { recipientId, content, requestId, listingId } = data;

    if (!recipientId || !content) {
      return NextResponse.json(
        { error: "recipientId and content are required" },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        recipientId,
        content,
        requestId: requestId || null,
        listingId: listingId || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            agentProfile: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
