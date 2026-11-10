import { NextRequest, NextResponse } from "next/server";
import { getRequestById } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const request = await getRequestById(id);
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json({
      request: {
        ...request,
        student: {
          id: "student-" + request.id,
          name: request.tenantName,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(request.tenantName)}`,
          city: "Port Harcourt",
          currentSchool: request.tenantSchool || "UNIPORT",
        },
        proposals: [],
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch request" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ success: true });
}
