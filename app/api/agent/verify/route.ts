import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { sanitizeText, sanitizeUrl } from "@/lib/auth-security";
import { offloadDataUrlToMediaAsset, updateUser } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { user, isAdmin } = auth.context;
    const data = await req.json();

    const agencyName = sanitizeText(data.agencyName || user.agencyName || "", 120);
    const ninOrLicense = sanitizeText(data.ninNumber || data.ninOrLicense || "", 60);
    const bio = sanitizeText(data.bio || user.bio || "", 1200);
    const specializations = sanitizeText(
      data.campusSpecialization || data.specializations || "University of Port Harcourt (UNIPORT)",
      200
    );
    const coverageAreas = Array.isArray(data.coverageAreas)
      ? data.coverageAreas
          .map((a: unknown) => sanitizeText(a, 60))
          .filter(Boolean)
          .slice(0, 12)
      : ["Choba", "Aluu", "Ozuoba"];

    if (!ninOrLicense || ninOrLicense.length < 6) {
      return NextResponse.json(
        { error: "Please provide a valid NIN or professional license number." },
        { status: 400 }
      );
    }

    let idDocumentUrl = user.idDocumentUrl || "";
    if (typeof data.idDocumentUrl === "string" && data.idDocumentUrl.trim()) {
      const rawDoc = data.idDocumentUrl.trim();
      if (rawDoc.startsWith("data:image/")) {
        idDocumentUrl = await offloadDataUrlToMediaAsset(rawDoc);
      } else {
        const clean = sanitizeUrl(rawDoc);
        if (!clean) {
          return NextResponse.json({ error: "Invalid ID document URL." }, { status: 400 });
        }
        idDocumentUrl = clean;
      }
    }

    // Preserve ADMIN or LANDLORD roles; only upgrade STUDENT/TENANT to AGENT when applying
    const nextRole =
      isAdmin || user.role === "ADMIN" || user.role === "LANDLORD" ? user.role : "AGENT";

    const updated = await updateUser(user.id, {
      role: nextRole,
      agencyName,
      ninOrLicense,
      idDocumentUrl,
      bio,
      specializations,
      coverageAreas,
      isVerified: false,
      verificationStatus: "PENDING",
      verificationNotes: "Identity documents submitted for manual administrator verification.",
    });

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: updated.id,
        agencyName: updated.agencyName,
        verificationStatus: updated.verificationStatus,
        verificationNotes: updated.verificationNotes,
        coverageAreas: updated.coverageAreas,
        role: updated.role,
      },
    });
  } catch (error) {
    console.error("Failed to submit verification:", error);
    return NextResponse.json({ error: "Failed to submit verification" }, { status: 500 });
  }
}
