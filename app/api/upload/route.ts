import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE = 30 * 1024 * 1024; // 30 MB

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiter: Max 20 uploads per 10 minutes per IP
    const clientIp = req.headers.get("x-forwarded-for") || "local";
    const { allowed } = checkRateLimit(`upload:${clientIp}`, 20, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Upload rate limit reached. Please wait a few minutes before uploading more media." },
        { status: 429 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    // Handle FormData (file uploads)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const mimeType = file.type.toLowerCase();
      const isImage = ALLOWED_IMAGE_TYPES.has(mimeType);
      const isVideo = ALLOWED_VIDEO_TYPES.has(mimeType);

      if (!isImage && !isVideo) {
        return NextResponse.json(
          {
            error: "Unsupported file type. Allowed formats: JPG, PNG, WEBP, AVIF for photos; MP4, WEBM for video walkthroughs.",
          },
          { status: 400 }
        );
      }

      // Check file size
      if (isImage && file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: `Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed is 5MB.` },
          { status: 400 }
        );
      }

      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        return NextResponse.json(
          { error: `Video too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed is 30MB.` },
          { status: 400 }
        );
      }

      // Convert file buffer to base64 Data URL (serverless-compatible, zero external dependency)
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

      return NextResponse.json({
        success: true,
        url: dataUrl,
        type: isImage ? "image" : "video",
        fileName: file.name.replace(/[^a-zA-Z0-9.\-_]/g, ""),
        sizeBytes: file.size,
      });
    }

    // Handle JSON Base64 upload
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { dataUrl, type } = body;

      if (!dataUrl || typeof dataUrl !== "string") {
        return NextResponse.json({ error: "Missing dataUrl" }, { status: 400 });
      }

      // Validate base64 structure and MIME
      const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
      if (!match) {
        return NextResponse.json({ error: "Invalid data URL format" }, { status: 400 });
      }

      const mime = match[1].toLowerCase();
      if (!ALLOWED_IMAGE_TYPES.has(mime) && !ALLOWED_VIDEO_TYPES.has(mime)) {
        return NextResponse.json({ error: "Disallowed MIME type in payload" }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        url: dataUrl,
        type: ALLOWED_IMAGE_TYPES.has(mime) ? "image" : "video",
      });
    }

    return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 400 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
  }
}
