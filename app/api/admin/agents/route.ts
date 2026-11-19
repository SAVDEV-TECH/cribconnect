import { NextResponse } from "next/server";
import { getUsersStore } from "@/lib/data-store";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const users = await getUsersStore();
    const agents = users
      .filter((u) => u.role === "AGENT" || u.role === "LANDLORD")
      .map((u) => ({
        id: `profile-${u.id}`,
        userId: u.id,
        agencyName: u.agencyName || "",
        ninNumber: u.ninOrLicense || "",
        idDocumentUrl: u.idDocumentUrl || null,
        verificationStatus: u.verificationStatus || (u.isVerified ? "VERIFIED" : "UNVERIFIED"),
        verificationNotes: u.verificationNotes || null,
        tier: u.tier || "FREE",
        badges: JSON.stringify(u.badges || []),
        user: {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          whatsapp: u.whatsapp,
          avatar: u.avatar,
        },
      }));

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Failed to fetch admin agents list:", error);
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}
