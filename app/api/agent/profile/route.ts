import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, sanitizeText, sanitizeUrl, isValidPhone } from "@/lib/auth-security";
import { getUserById, updateUser, getListingsStore } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("cribconnect_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = getUserById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get listings posted by this user (or default user listings)
    const allListings = getListingsStore();
    const userListings = allListings.filter(
      (l) => l.agentId === user.id || l.agentName.toLowerCase() === user.name.toLowerCase()
    );

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        whatsapp: user.whatsapp,
        role: user.role,
        avatar: user.avatar,
        agencyName: user.agencyName || "",
        bio: user.bio || "",
        specializations: user.specializations || "",
        ninOrLicense: user.ninOrLicense || "",
        isVerified: user.isVerified,
        tenantsHousedCount: user.tenantsHousedCount || 0,
        rentalsHistory: user.rentalsHistory || [],
        listings: userListings,
      },
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("cribconnect_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updates: any = {};

    if (body.name) updates.name = sanitizeText(body.name);
    if (body.phone && isValidPhone(body.phone)) updates.phone = sanitizeText(body.phone);
    if (body.whatsapp) updates.whatsapp = sanitizeText(body.whatsapp).replace(/\D/g, "");
    if (body.agencyName !== undefined) updates.agencyName = sanitizeText(body.agencyName);
    if (body.bio !== undefined) updates.bio = sanitizeText(body.bio);
    if (body.specializations !== undefined) updates.specializations = sanitizeText(body.specializations);
    if (body.avatar) updates.avatar = body.avatar; // Can be data URL or https URL

    const updated = updateUser(payload.userId, updates);
    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        whatsapp: updated.whatsapp,
        role: updated.role,
        avatar: updated.avatar,
        agencyName: updated.agencyName,
        bio: updated.bio,
        specializations: updated.specializations,
        isVerified: updated.isVerified,
        tenantsHousedCount: updated.tenantsHousedCount,
        rentalsHistory: updated.rentalsHistory,
      },
    });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
