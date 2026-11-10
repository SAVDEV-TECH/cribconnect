import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return new NextResponse("Missing media ID", { status: 400 });
    }

    const asset = await (prisma as any).mediaAsset.findUnique({
      where: { id },
    });

    if (!asset || !asset.data) {
      return new NextResponse("Media not found", { status: 404 });
    }

    // Strip data URL prefix if stored with one, or decode raw base64 directly
    const rawBase64 = asset.data.includes(";base64,")
      ? asset.data.split(";base64,")[1]
      : asset.data;

    const binaryBuffer = Buffer.from(rawBase64, "base64");

    return new NextResponse(binaryBuffer, {
      status: 200,
      headers: {
        "Content-Type": asset.mimeType || "image/jpeg",
        "Content-Length": String(binaryBuffer.length),
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Media serve error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
