import { NextRequest, NextResponse } from "next/server";
import {
  addMessageStore,
  getMessagesForUser,
  getUserById,
  getUsersStore,
} from "@/lib/data-store";
import { requireAuth } from "@/lib/session";
import { checkRateLimit, sanitizeText } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { user } = auth.context;
    const [messages, users] = await Promise.all([
      getMessagesForUser(user.id),
      getUsersStore(),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));

    const enriched = messages.map((m) => {
      const sender = userMap.get(m.senderId);
      const recipient = userMap.get(m.recipientId);
      return {
        ...m,
        sender: {
          id: m.senderId,
          name: sender?.name || m.senderName,
          avatar: sender?.avatar || m.senderAvatar,
          role: sender?.role || m.senderRole,
        },
        recipient: {
          id: m.recipientId,
          name: recipient?.name || m.recipientName || "CribConnect Member",
          avatar:
            recipient?.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
              recipient?.name || m.recipientId
            )}`,
          role: recipient?.role || "USER",
        },
      };
    });

    return NextResponse.json({ messages: enriched });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { user } = auth.context;
    const { allowed } = checkRateLimit(`message-send:${user.id}`, 60, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Message rate limit reached. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const recipientId = sanitizeText(body.recipientId, 100);
    const content = sanitizeText(body.content, 2000);
    const requestId = body.requestId ? sanitizeText(body.requestId, 100) : null;
    const listingId = body.listingId ? sanitizeText(body.listingId, 100) : null;

    if (!recipientId || !content) {
      return NextResponse.json(
        { error: "Recipient and message content are required." },
        { status: 400 }
      );
    }

    if (recipientId === user.id) {
      return NextResponse.json(
        { error: "You cannot send a message to yourself." },
        { status: 400 }
      );
    }

    const recipient = await getUserById(recipientId);
    if (!recipient) {
      return NextResponse.json({ error: "Recipient user not found." }, { status: 404 });
    }

    const saved = await addMessageStore({
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      senderRole: user.role,
      recipientId: recipient.id,
      recipientName: recipient.name,
      requestId,
      listingId,
      content,
    });

    return NextResponse.json(
      {
        success: true,
        message: {
          ...saved,
          sender: {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
          },
          recipient: {
            id: recipient.id,
            name: recipient.name,
            avatar: recipient.avatar,
            role: recipient.role,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
