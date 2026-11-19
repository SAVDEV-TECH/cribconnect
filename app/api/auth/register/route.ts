import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  hashPassword,
  createSessionToken,
  isValidEmail,
  isValidPhone,
  sanitizeText,
  checkRateLimit,
  getClientIp,
  isAdminUser,
  MAX_PASSWORD_LENGTH,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth-security";
import { getUserByEmail, createUser } from "@/lib/data-store";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { formatNigerianWhatsApp } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const { allowed } = checkRateLimit(`reg:${clientIp}`, 5, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again in 10 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const email = sanitizeText(body.email, 254).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const name = sanitizeText(body.name, 120);
    const phone = sanitizeText(body.phone, 30);
    const whatsapp = formatNigerianWhatsApp(sanitizeText(body.whatsapp || phone, 30));

    // Never allow ADMIN role assignment via public registration
    const requestedRole = String(body.role || "AGENT").toUpperCase();
    const role: "AGENT" | "LANDLORD" | "TENANT" | "STUDENT" =
      requestedRole === "LANDLORD"
        ? "LANDLORD"
        : requestedRole === "TENANT"
        ? "TENANT"
        : requestedRole === "STUDENT"
        ? "STUDENT"
        : "AGENT";

    const agencyName = sanitizeText(
      body.agencyName || (role === "LANDLORD" ? "Property Owner" : role === "AGENT" ? "Independent Realtor" : ""),
      120
    );
    const ninOrLicense = sanitizeText(body.ninOrLicense || "", 60);

    if (!name || name.length < 3) {
      return NextResponse.json(
        { error: "Please enter your full name (at least 3 characters)." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (password.length < 8 || password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: "Password must be between 8 and 256 characters long." },
        { status: 400 }
      );
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: "Please provide a valid phone number (e.g. 08012345678 or +234...)." },
        { status: 400 }
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    const { salt, hash } = hashPassword(password);
    const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    // Users ALWAYS start unverified; submitting NIN/License puts them in PENDING admin review
    const newUser = await createUser({
      name,
      email,
      phone,
      whatsapp: whatsapp || phone.replace(/\D/g, ""),
      role,
      avatar: defaultAvatar,
      agencyName,
      passwordSalt: salt,
      passwordHash: hash,
      isVerified: false,
      verificationStatus: ninOrLicense ? "PENDING" : "UNVERIFIED",
      ninOrLicense,
    });

    const token = createSessionToken(newUser.id, newUser.role, {
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      whatsapp: newUser.whatsapp,
      avatar: newUser.avatar,
      agencyName: newUser.agencyName,
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
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        whatsapp: newUser.whatsapp,
        role: newUser.role,
        avatar: newUser.avatar,
        agencyName: newUser.agencyName,
        isVerified: newUser.isVerified,
        isAdmin: isAdminUser(newUser),
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Failed to create account. Please try again." }, { status: 500 });
  }
}
