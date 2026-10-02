import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  hashPassword,
  createSessionToken,
  isValidEmail,
  isValidPhone,
  sanitizeText,
  checkRateLimit,
} from "@/lib/auth-security";
import { getUserByEmail, createUser } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Rate limit: Max 5 registration attempts per 10 minutes per IP
    const clientIp = req.headers.get("x-forwarded-for") || "local";
    const { allowed } = checkRateLimit(`reg:${clientIp}`, 5, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again in 10 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const email = sanitizeText(body.email).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const name = sanitizeText(body.name);
    const phone = sanitizeText(body.phone);
    const whatsapp = sanitizeText(body.whatsapp || phone);
    const role = body.role === "LANDLORD" ? "LANDLORD" : body.role === "TENANT" ? "TENANT" : "AGENT";
    const agencyName = sanitizeText(body.agencyName || (role === "LANDLORD" ? "Property Owner" : "Independent Realtor"));
    const ninOrLicense = sanitizeText(body.ninOrLicense || "");

    // Validation
    if (!name || name.length < 3) {
      return NextResponse.json({ error: "Please enter your full name (at least 3 characters)." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long for security." },
        { status: 400 }
      );
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: "Please provide a valid phone number (e.g. 08012345678 or +234...)." },
        { status: 400 }
      );
    }

    // Check duplicate email
    const existing = getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Hash password with PBKDF2 + random salt
    const { salt, hash } = hashPassword(password);

    const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    const newUser = createUser({
      name,
      email,
      phone,
      whatsapp: whatsapp.replace(/\D/g, ""),
      role,
      avatar: defaultAvatar,
      agencyName,
      passwordSalt: salt,
      passwordHash: hash,
      isVerified: Boolean(ninOrLicense),
      ninOrLicense,
    });

    // Create tamper-proof HMAC session token
    const token = createSessionToken(newUser.id, newUser.role);

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
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        whatsapp: newUser.whatsapp,
        role: newUser.role,
        avatar: newUser.avatar,
        agencyName: newUser.agencyName,
        isVerified: newUser.isVerified,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Failed to create account. Please try again." }, { status: 500 });
  }
}
