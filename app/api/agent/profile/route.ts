import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { sanitizeText, sanitizeUrl, isValidPhone } from "@/lib/auth-security";
import {
  updateUser,
  getListingsStore,
  updateListingStore,
  offloadDataUrlToMediaAsset,
} from "@/lib/data-store";
import { formatNigerianWhatsApp } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { user, isAdmin } = auth.context;
    const allListings = await getListingsStore();
    const userListings = allListings.filter((l) => l.agentId === user.id);

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        whatsapp: user.whatsapp,
        role: user.role,
        isAdmin,
        avatar: user.avatar,
        agencyName: user.agencyName || "",
        bio: user.bio || "",
        specializations: user.specializations || "",
        coverageAreas: user.coverageAreas || [],
        ninOrLicense: user.ninOrLicense || "",
        bankName: user.bankName || "",
        bankAccountNumber: user.bankAccountNumber || "",
        bankAccountName: user.bankAccountName || "",
        isVerified: Boolean(user.isVerified),
        verificationStatus:
          user.verificationStatus || (user.isVerified ? "VERIFIED" : "UNVERIFIED"),
        tier: user.tier || "FREE",
        badges: user.badges || [],
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
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { user, isAdmin } = auth.context;
    const body = await req.json();
    const updates: Record<string, any> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      updates.name = sanitizeText(body.name, 100);
    }

    if (body.phone !== undefined && body.phone !== "") {
      if (!isValidPhone(body.phone)) {
        return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
      }
      updates.phone = sanitizeText(body.phone, 25);
    }

    if (body.whatsapp !== undefined) {
      const formattedWa = formatNigerianWhatsApp(sanitizeText(body.whatsapp, 30));
      if (body.whatsapp && !formattedWa) {
        return NextResponse.json(
          { error: "Please enter a valid WhatsApp number." },
          { status: 400 }
        );
      }
      if (formattedWa) updates.whatsapp = formattedWa;
    }

    if (body.agencyName !== undefined) updates.agencyName = sanitizeText(body.agencyName, 120);
    if (body.bio !== undefined) updates.bio = sanitizeText(body.bio, 1200);
    if (body.specializations !== undefined) {
      updates.specializations = sanitizeText(body.specializations, 200);
    }
    if (body.bankName !== undefined) updates.bankName = sanitizeText(body.bankName, 80);
    if (body.bankAccountNumber !== undefined) {
      const digits = sanitizeText(body.bankAccountNumber, 20).replace(/\D/g, "").slice(0, 10);
      if (digits && digits.length !== 10) {
        return NextResponse.json(
          { error: "Nigerian bank account number must be 10 digits." },
          { status: 400 }
        );
      }
      updates.bankAccountNumber = digits;
    }
    if (body.bankAccountName !== undefined) {
      updates.bankAccountName = sanitizeText(body.bankAccountName, 120);
    }

    if (typeof body.avatar === "string" && body.avatar.trim()) {
      const rawAvatar = body.avatar.trim();
      if (rawAvatar.startsWith("data:image/")) {
        updates.avatar = await offloadDataUrlToMediaAsset(rawAvatar);
      } else {
        const cleanAvatar = sanitizeUrl(rawAvatar);
        if (!cleanAvatar) {
          return NextResponse.json({ error: "Invalid avatar URL." }, { status: 400 });
        }
        updates.avatar = cleanAvatar;
      }
    }

    const updated = await updateUser(user.id, updates);
    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Keep the user's own listings synchronized with updated contact details
    if (
      updates.name ||
      updates.phone ||
      updates.whatsapp ||
      updates.avatar ||
      updates.agencyName !== undefined
    ) {
      const allListings = await getListingsStore();
      const myListings = allListings.filter((l) => l.agentId === updated.id);
      await Promise.all(
        myListings.map((l) =>
          updateListingStore(l.id, {
            agentName: updated.name,
            agentPhone: updated.phone,
            agentWhatsapp: updated.whatsapp,
            agentAvatar: updated.avatar,
            agencyName: updated.agencyName || l.agencyName,
          })
        )
      );
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
        isAdmin,
        avatar: updated.avatar,
        agencyName: updated.agencyName || "",
        bio: updated.bio || "",
        specializations: updated.specializations || "",
        bankName: updated.bankName || "",
        bankAccountNumber: updated.bankAccountNumber || "",
        bankAccountName: updated.bankAccountName || "",
        isVerified: Boolean(updated.isVerified),
        verificationStatus:
          updated.verificationStatus || (updated.isVerified ? "VERIFIED" : "UNVERIFIED"),
        tier: updated.tier || "FREE",
        badges: updated.badges || [],
        tenantsHousedCount: updated.tenantsHousedCount || 0,
        rentalsHistory: updated.rentalsHistory || [],
      },
    });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
