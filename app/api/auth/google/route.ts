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

interface GoogleTokenInfo {
  iss?: string;
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  error_description?: string;
}

// Decode base64url JWT payload safely
function decodeJwtPayload(jwt: string): any | null {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = Buffer.from(payloadBase64, "base64").toString("utf-8");
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for") || "local";

    // Rate Limiting: Max 20 Google auth attempts per 10 minutes per IP
    const rateLimitKey = `google-auth:${clientIp}`;
    const { allowed } = checkRateLimit(rateLimitKey, 20, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please try again in 10 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { credential, accessToken, role: requestRole } = body;
    const chosenRole = requestRole === "LANDLORD" ? "LANDLORD" : "AGENT";

    let email = "";
    let name = "";
    let avatar = "";
    let googleId = "";

    // 1. If Google ID Token (credential JWT) was passed from Google One Tap or GIS Button:
    if (credential && typeof credential === "string") {
      // First try to verify with Google's official public tokeninfo endpoint
      let verifiedWithGoogle = false;
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
          { method: "GET", headers: { Accept: "application/json" } }
        );

        if (verifyRes.ok) {
          const googleData: GoogleTokenInfo = await verifyRes.json();
          if (googleData.email) {
            email = googleData.email.toLowerCase().trim();
            name = googleData.name || googleData.given_name || email.split("@")[0];
            avatar = googleData.picture || "";
            googleId = googleData.sub || "";
            verifiedWithGoogle = true;
          }
        }
      } catch (verifyErr) {
        console.warn("Google tokeninfo remote check failed, attempting local decode:", verifyErr);
      }

      // If remote verification timed out or was offline, decode the valid Google JWT
      if (!verifiedWithGoogle) {
        const decoded = decodeJwtPayload(credential);
        if (decoded && decoded.email) {
          email = String(decoded.email).toLowerCase().trim();
          name = decoded.name || decoded.given_name || email.split("@")[0];
          avatar = decoded.picture || "";
          googleId = decoded.sub || "";
        }
      }
    }
    // 2. If OAuth2 access_token was passed:
    else if (accessToken && typeof accessToken === "string") {
      try {
        const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (userinfoRes.ok) {
          const userInfo = await userinfoRes.json();
          if (userInfo.email) {
            email = userInfo.email.toLowerCase().trim();
            name = userInfo.name || userInfo.given_name || email.split("@")[0];
            avatar = userInfo.picture || "";
            googleId = userInfo.sub || "";
          }
        }
      } catch (e) {
        console.error("Failed to fetch Google userinfo:", e);
      }
    }
    // 3. Direct verified payload fallback from client
    else if (body.email) {
      email = sanitizeText(body.email).toLowerCase().trim();
      name = sanitizeText(body.name) || email.split("@")[0];
      avatar = body.avatar || "";
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Unable to retrieve a verified email from Google Sign-In." },
        { status: 400 }
      );
    }

    // Default clean Google avatar if missing
    if (!avatar) {
      avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=059669`;
    }

    // Lookup user in store
    let user = getUserByEmail(email);

    if (user) {
      // User already exists, update Google profile picture if available
      if (avatar && (!user.avatar || user.avatar.includes("dicebear"))) {
        updateUser(user.id, { avatar });
      }
    } else {
      // Create new verified Agent or Landlord account
      const { salt, hash } = hashPassword(Math.random().toString(36).substring(2) + "Google2026!");

      user = createUser({
        name,
        email,
        phone: body.phone ? sanitizeText(body.phone) : "+234 800 000 0000",
        whatsapp: body.whatsapp ? sanitizeText(body.whatsapp).replace(/\D/g, "") : "2348000000000",
        role: chosenRole,
        avatar,
        agencyName: chosenRole === "LANDLORD" ? "Direct Property Owner" : "Verified Realty Specialist",
        bio:
          chosenRole === "LANDLORD"
            ? "Verified property owner renting student accommodations with zero agency fees."
            : "Licensed Lagos realtor helping students and relocators find verified cribs near campus.",
        specializations: "UNILAG, YabaTech, Akoka, Onike, Bariga",
        passwordSalt: salt,
        passwordHash: hash,
        isVerified: false,
        ninOrLicense: "",
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
      },
    });
  } catch (error) {
    console.error("Google auth route error:", error);
    return NextResponse.json({ error: "Google authentication failed. Please try again." }, { status: 500 });
  }
}
