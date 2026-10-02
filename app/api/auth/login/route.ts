import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifyPassword,
  createSessionToken,
  isValidEmail,
  sanitizeText,
  checkRateLimit,
} from "@/lib/auth-security";
import { getUserByEmail } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for") || "local";

    const body = await req.json();
    const email = sanitizeText(body.email).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (!isValidEmail(email) || !password) {
      return NextResponse.json(
        { error: "Please provide a valid email and password." },
        { status: 400 }
      );
    }

    // Rate Limiting: Max 5 attempts per 15 minutes per IP + email combination
    const rateLimitKey = `login:${clientIp}:${email}`;
    const { allowed, remaining } = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many failed login attempts. Please wait 15 minutes before trying again." },
        { status: 429 }
      );
    }

    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: `Invalid email or password. (${remaining} attempts remaining)` },
        { status: 401 }
      );
    }

    // Timing-safe password verification
    const passwordValid = verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: `Invalid email or password. (${remaining} attempts remaining)` },
        { status: 401 }
      );
    }

    // Issue tamper-proof HMAC session token
    const token = createSessionToken(user.id, user.role);

    // Set secure HTTP-only cookie
    const cookieStore = cookies();
    cookieStore.set("cribconnect_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({
      success: true,
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
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to sign in. Please try again." }, { status: 500 });
  }
}
