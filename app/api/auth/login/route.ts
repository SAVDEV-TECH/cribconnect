import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifyPassword,
  runDummyPasswordCheck,
  createSessionToken,
  isValidEmail,
  sanitizeText,
  checkRateLimit,
  getClientIp,
  isAdminUser,
  MAX_PASSWORD_LENGTH,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth-security";
import { getUserByEmail } from "@/lib/data-store";
import { SESSION_COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    const body = await req.json();
    const email = sanitizeText(body.email, 254).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (!isValidEmail(email) || !password || password.length > MAX_PASSWORD_LENGTH) {
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

    const user = await getUserByEmail(email);
    if (!user || !user.passwordSalt || !user.passwordHash) {
      // Run dummy PBKDF2 to prevent timing-based account enumeration
      runDummyPasswordCheck(password);
      return NextResponse.json(
        { error: `Invalid email or password. (${remaining} attempts remaining)` },
        { status: 401 }
      );
    }

    const passwordValid = verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: `Invalid email or password. (${remaining} attempts remaining)` },
        { status: 401 }
      );
    }

    const token = createSessionToken(user.id, user.role, {
      name: user.name,
      email: user.email,
      phone: user.phone,
      whatsapp: user.whatsapp,
      avatar: user.avatar,
      agencyName: user.agencyName,
    });

    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
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
        isAdmin: isAdminUser(user),
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to sign in. Please try again." }, { status: 500 });
  }
}
