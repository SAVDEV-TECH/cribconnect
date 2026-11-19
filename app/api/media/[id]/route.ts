import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAllowedMediaMime } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params?.id;
    if (!id || !/^[a-zA-Z0-9_-]{3,80}$/.test(id)) {
      return new NextResponse("Invalid media ID", { status: 400 });
    }

    const asset = await prisma.mediaAsset.findUnique({
      where: { id },
    });

    if (!asset || !asset.data) {
      return new NextResponse("Media not found", { status: 404 });
    }

    const mimeType = (asset.mimeType || "").toLowerCase().trim();
    if (!isAllowedMediaMime(mimeType)) {
      return new NextResponse("Unsupported media type", { status: 415 });
    }

    const rawBase64 = asset.data.includes(";base64,")
      ? asset.data.split(";base64,")[1]
      : asset.data;

    const binaryBuffer = Buffer.from(rawBase64, "base64");
    const totalLength = binaryBuffer.length;

    const baseHeaders: Record<string, string> = {
      "Content-Type": mimeType,
      "Accept-Ranges": "bytes",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    };

    // Support HTTP Range requests for video streaming and seeking
    const rangeHeader = req.headers.get("range");
    if (rangeHeader && rangeHeader.startsWith("bytes=")) {
      const [rawStart, rawEnd] = rangeHeader.replace("bytes=", "").split("-");
      const start = rawStart ? parseInt(rawStart, 10) : 0;
      const end = rawEnd ? Math.min(parseInt(rawEnd, 10), totalLength - 1) : totalLength - 1;

      if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        start < 0 ||
        end < start ||
        start >= totalLength
      ) {
        return new NextResponse("Range Not Satisfiable", {
          status: 416,
          headers: { "Content-Range": `bytes */${totalLength}` },
        });
      }

      const chunk = binaryBuffer.subarray(start, end + 1);
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${start}-${end}/${totalLength}`,
          "Content-Length": String(chunk.length),
        },
      });
    }

    return new NextResponse(binaryBuffer, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Length": String(totalLength),
      },
    });
  } catch (error) {
    console.error("Media serve error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
