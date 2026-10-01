import { NextRequest, NextResponse } from "next/server";
import { MOCK_MESSAGES, MOCK_USERS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    try {
      const { prisma } = await import("@/lib/prisma");
      const where: any = userId ? { OR: [{ senderId: userId }, { recipientId: userId }] } : {};
      const messages = await prisma.message.findMany({
        where,
        include: { sender: { select: { id: true, name: true, avatar: true, role: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ messages });
    } catch {
      let results = MOCK_MESSAGES;
      if (userId) results = results.filter(m => m.senderId === userId || m.recipientId === userId);
      const enriched = results.map(m => {
        const sender = MOCK_USERS.find(u => u.id === m.senderId)!;
        return { ...m, sender: { id: sender.id, name: sender.name, avatar: sender.avatar, role: sender.role } };
      });
      return NextResponse.json({ messages: enriched });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ success: true, demo: true, message: "Message sent! (Demo mode)" });
}
