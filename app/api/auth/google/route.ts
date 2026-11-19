import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSessionToken,
  isValidEmail,
  sanitizeText,
  sanitizeUrl,
  checkRateLimit,
  getClientIp,
  hashPassword,
  isAdminUser,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth-security";
import { getUserByEmail, createUser, updateUser } from "@/lib/data-store";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { formatNigerianWhatsApp } from "@/lib/types";

export const dynamic = "force-dynamic";

interface GoogleTokenInfo {
  iss?: string;
  aud?: string;
  sub?: string;
  exp?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  given_name?: string;
}

const VALID_GOOGLE_ISSUERS = new Set([
  "accounts.google.com",
  "https://accounts.google.com",
]);

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const { allowed } = checkRateLimit(`google-auth:${clientIp}`, 20, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please try again in 10 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { credential, accessToken, role: requestRole } = body;
    const requestedRole = String(requestRole || "AGENT").toUpperCase();
    const chosenRole: "AGENT" | "LANDLORD" | "STUDENT" | "TENANT" =
      requestedRole === "LANDLORD"
        ? "LANDLORD"
        : requestedRole === "STUDENT"
        ? "STUDENT"
        : requestedRole === "TENANT"
        ? "TENANT"
        : "AGENT";

    const expectedClientId = (
      process.env.GOOGLE_CLIENT_ID ||
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      ""
    ).trim();

    let email = "";
    let name = "";
    let avatar = "";

    // 1. Strict server-side verification of Google ID Token (credential JWT)
    if (credential && typeof credential === "string") {
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
        { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" }
      );

      if (!verifyRes.ok) {
        return NextResponse.json(
          { error: "Invalid or expired Google sign-in token. Please try again." },
          { status: 401 }
        );
      }

      const googleData: GoogleTokenInfo = await verifyRes.json();

      if (expectedClientId && googleData.aud !== expectedClientId) {
        return NextResponse.json(
          { error: "Google token audience mismatch." },
          { status: 401 }
        );
      }

      if (googleData.iss && !VALID_GOOGLE_ISSUERS.has(googleData.iss)) {
        return NextResponse.json(
          { error: "Untrusted Google token issuer." },
          { status: 401 }
        );
      }

      const emailVerified =
        googleData.email_verified === true || googleData.email_verified === "true";
      if (!emailVerified || !googleData.email) {
        return NextResponse.json(
          { error: "Your Google account email must be verified to sign in." },
          { status: 401 }
        );
      }

      if (googleData.exp && Number(googleData.exp) * 1000 < Date.now()) {
        return NextResponse.json(
          { error: "Google sign-in token has expired. Please try again." },
          { status: 401 }
        );
      }

      email = googleData.email.toLowerCase().trim();
      name = sanitizeText(googleData.name || googleData.given_name || email.split("@")[0], 120);
      avatar = sanitizeUrl(googleData.picture) || "";
    }
    // 2. Strict server-side verification of Google OAuth2 access_token
    else if (accessToken && typeof accessToken === "string") {
      const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });

      if (!userinfoRes.ok) {
        return NextResponse.json(
          { error: "Invalid or expired Google access token." },
          { status: 401 }
        );
      }

      const userInfo = await userinfoRes.json();
      const emailVerified =
        userInfo.email_verified === true || userInfo.email_verified === "true";
      if (!emailVerified || !userInfo.email) {
        return NextResponse.json(
          { error: "Verified email not available from Google account." },
          { status: 401 }
        );
      }

      email = String(userInfo.email).toLowerCase().trim();
      name = sanitizeText(userInfo.name || userInfo.given_name || email.split("@")[0], 120);
      avatar = sanitizeUrl(userInfo.picture) || "";
    } else {
      return NextResponse.json(
        {
          error:
            "A verified Google credential is required. Please use Google Sign-In or sign in with your email and password.",
        },
        { status: 400 }
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Unable to retrieve a verified email from Google Sign-In." },
        { status: 400 }
      );
    }

    if (!avatar) {
      avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0F766E`;
    }

    let user = await getUserByEmail(email);

    if (user) {
      if (avatar && (!user.avatar || user.avatar.includes("dicebear"))) {
        user = (await updateUser(user.id, { avatar })) || user;
      }
    } else {
      const randomSecret = crypto.randomBytes(32).toString("hex");
      const { salt, hash } = hashPassword(randomSecret);
      const rawPhone = body.phone ? sanitizeText(body.phone, 30) : "";

      user = await createUser({
        name,
        email,
        phone: rawPhone,
        whatsapp: formatNigerianWhatsApp(rawPhone),
        role: chosenRole,
        avatar,
        agencyName:
          chosenRole === "LANDLORD"
            ? "Direct Property Owner"
            : chosenRole === "AGENT"
            ? "Independent Realtor"
            : "",
        bio:
          chosenRole === "LANDLORD"
            ? "Property owner renting student accommodations around UNIPORT."
            : "Port Harcourt realtor helping students and relocators find cribs near UNIPORT.",
        specializations: "UNIPORT, Choba, Rumuola, Aluu, Ozuoba",
        passwordSalt: salt,
        passwordHash: hash,
        isVerified: false,
        verificationStatus: "UNVERIFIED",
        ninOrLicense: "",
      });
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
      method: "google_oauth",
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
    console.error("Google auth route error:", error);
    return NextResponse.json(
      { error: "Google authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
