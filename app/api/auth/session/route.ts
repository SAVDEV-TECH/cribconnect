import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ctx = await getSessionContext();
    if (!ctx) {
      return NextResponse.json({ user: null });
    }

    const { user, isAdmin } = ctx;
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
        isAdmin,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
