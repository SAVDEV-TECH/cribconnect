import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/auth-security";
import { prisma } from "@/lib/prisma";

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

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 30 * 1024 * 1024; // 30 MB

async function storeMediaAssetAndGetUrl(
  mimeType: string,
  base64Payload: string,
  sizeBytes: number
): Promise<string> {
  // 1. Optional Cloudinary CDN upload if configured in environment
  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET;

  if (cloudName && uploadPreset) {
    try {
      const resourceType = mimeType.startsWith("video/") ? "video" : "image";
      const form = new FormData();
      form.append("file", `data:${mimeType};base64,${base64Payload}`);
      form.append("upload_preset", uploadPreset);

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        {
          method: "POST",
          body: form,
        }
      );
      if (cloudRes.ok) {
        const cloudJson = await cloudRes.json();
        if (cloudJson.secure_url) {
          return cloudJson.secure_url;
        }
      }
    } catch (err) {
      console.warn("Cloudinary upload skipped, falling back to MediaAsset table:", err);
    }
  }

  // 2. Store in dedicated indexed PostgreSQL MediaAsset table and serve via /api/media/[id] with Edge CDN caching
  const prefix = mimeType.startsWith("video/") ? "vid" : "img";
  const id = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    await (prisma as any).mediaAsset.create({
      data: {
        id,
        mimeType,
        data: base64Payload,
        sizeBytes,
      },
    });
    return `/api/media/${id}`;
  } catch (err) {
    console.warn("MediaAsset table insert fallback to data URL:", err);
    return `data:${mimeType};base64,${base64Payload}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiter: Max 40 uploads per 10 minutes per IP
    const clientIp = req.headers.get("x-forwarded-for") || "local";
    const { allowed } = checkRateLimit(`upload:${clientIp}`, 40, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "Upload rate limit reached. Please wait a few minutes before uploading more media.",
        },
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
            error:
              "Unsupported file type. Allowed formats: JPG, PNG, WEBP, AVIF for photos; MP4, WEBM for video walkthroughs.",
          },
          { status: 400 }
        );
      }

      if (isImage && file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          {
            error: `Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed is 10MB.`,
          },
          { status: 400 }
        );
      }

      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        return NextResponse.json(
          {
            error: `Video too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed is 30MB.`,
          },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Payload = buffer.toString("base64");

      const url = await storeMediaAssetAndGetUrl(mimeType, base64Payload, file.size);

      return NextResponse.json({
        success: true,
        url,
        type: isImage ? "image" : "video",
        fileName: file.name.replace(/[^a-zA-Z0-9.\-_]/g, ""),
        sizeBytes: file.size,
      });
    }

    // Handle JSON Base64 upload (from client-side compressed canvas)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { dataUrl } = body;

      if (!dataUrl || typeof dataUrl !== "string") {
        return NextResponse.json({ error: "Missing dataUrl" }, { status: 400 });
      }

      const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: "Invalid data URL format" }, { status: 400 });
      }

      const mime = match[1].toLowerCase();
      const base64Payload = match[2];

      if (!ALLOWED_IMAGE_TYPES.has(mime) && !ALLOWED_VIDEO_TYPES.has(mime)) {
        return NextResponse.json({ error: "Disallowed MIME type in payload" }, { status: 400 });
      }

      const approxBytes = Math.round((base64Payload.length * 3) / 4);
      const url = await storeMediaAssetAndGetUrl(mime, base64Payload, approxBytes);

      return NextResponse.json({
        success: true,
        url,
        type: ALLOWED_IMAGE_TYPES.has(mime) ? "image" : "video",
        sizeBytes: approxBytes,
      });
    }

    return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 400 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
  }
}
