import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSessionToken,
  isValidEmail,
  sanitizeText,
  checkRateLimit,
  hashPassword,
} from "@/lib/auth-security";
import { getUserByEmail, createUser, updateUser } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for") || "local";

    // Rate Limiting: Max 15 social auth attempts per 10 minutes per IP
    const rateLimitKey = `social-auth:${clientIp}`;
    const { allowed } = checkRateLimit(rateLimitKey, 15, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait 10 minutes before trying again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const provider = (sanitizeText(body.provider).toLowerCase() || "google") as "google" | "facebook" | "apple";
    const rawEmail = sanitizeText(body.email).toLowerCase();
    const rawName = sanitizeText(body.name);
    const chosenRole = body.role === "LANDLORD" ? "LANDLORD" : "AGENT";

    // Fallback defaults if clicked with quick 1-click
    const email = rawEmail || (provider === "google" ? "user@gmail.com" : "user@facebook.com");
    const name = rawName || (provider === "google" ? "Google User" : "Facebook User");

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address received from provider." },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = getUserByEmail(email);

    if (user) {
      // User exists - update avatar if currently default and provider gave a specific one
      if (body.avatar && (!user.avatar || user.avatar.includes("dicebear"))) {
        updateUser(user.id, { avatar: body.avatar });
      }
    } else {
      // Create new Agent or Landlord account immediately
      const defaultAvatar =
        body.avatar ||
        (provider === "google"
          ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`);

      const { salt, hash } = hashPassword(Math.random().toString(36).substring(2) + "Crib2026!");

      user = createUser({
        name,
        email,
        phone: body.phone ? sanitizeText(body.phone) : "+234 800 000 0000",
        whatsapp: body.whatsapp ? sanitizeText(body.whatsapp).replace(/\D/g, "") : "2348000000000",
        role: chosenRole,
        avatar: defaultAvatar,
        agencyName: chosenRole === "LANDLORD" ? "Direct Property Owner" : "Verified Realty Specialist",
        bio:
          chosenRole === "LANDLORD"
            ? "Verified property owner renting clean student accommodations with zero agent markups."
            : "Licensed Lagos realtor helping students and relocators find verified cribs near campus.",
        specializations: "UNILAG, YabaTech, Akoka, Onike, Bariga",
        passwordSalt: salt,
        passwordHash: hash,
        isVerified: Boolean(body.isVerified),
        ninOrLicense: body.ninOrLicense ? sanitizeText(body.ninOrLicense) : "",
      });
    }

    // Issue tamper-proof signed session token
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
      provider,
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
    console.error("Social auth error:", error);
    return NextResponse.json({ error: "Failed to authenticate with social provider." }, { status: 500 });
  }
}
