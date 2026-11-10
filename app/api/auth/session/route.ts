import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth-security";
import { getUserById, createUser } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("cribconnect_session")?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const payload = verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ user: null });
    }

    let user = await getUserById(payload.userId);
    if (!user && payload.email) {
      user = await createUser({
        id: payload.userId,
        name: payload.name || payload.email.split("@")[0],
        email: payload.email,
        phone: payload.phone || "+234 800 000 0000",
        whatsapp: payload.whatsapp || "2348000000000",
        role: (payload.role as any) || "AGENT",
        avatar:
          payload.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
            payload.name || "Agent"
          )}`,
        agencyName: payload.agencyName || "Verified Realty Specialist",
        passwordSalt: "",
        passwordHash: "",
        isVerified: true,
      });
    }

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        whatsapp: user.whatsapp,
        role: user.role,
        avatar: user.avatar,
        agencyName: user.agencyName,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
