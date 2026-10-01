import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MOCK_USERS, MOCK_AGENT_PROFILES } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

async function resolveUser(userId: string) {
  // Try Prisma first
  try {
    const { prisma } = await import("@/lib/prisma");
    return await prisma.user.findUnique({ where: { id: userId }, include: { agentProfile: true } });
  } catch {
    // Fallback to mock data
    const user = MOCK_USERS.find(u => u.id === userId);
    if (!user) return null;
    const agentProfile = MOCK_AGENT_PROFILES.find(p => p.userId === userId) || null;
    return { ...user, agentProfile };
  }
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("cribconnect_user_id")?.value || "student-chidi";
    const user = await resolveUser(userId);
    return NextResponse.json({ user });
  } catch (error) {
    // Always return a default user so the app never crashes
    const defaultUser = { ...MOCK_USERS[0], agentProfile: null };
    return NextResponse.json({ user: defaultUser });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const user = await resolveUser(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const cookieStore = cookies();
    cookieStore.set("cribconnect_user_id", userId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
