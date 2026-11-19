import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  checkRateLimit,
  validateMediaMagicBytes,
} from "@/lib/auth-security";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function hasDatabaseConfigured(): boolean {
  return Boolean((process.env.POSTGRES_URL || process.env.DATABASE_URL || "").trim());
}

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
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`,
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

  // 2. Store in dedicated indexed PostgreSQL MediaAsset table and serve via /api/media/[id]
  if (hasDatabaseConfigured()) {
    const prefix = mimeType.startsWith("video/") ? "vid" : "img";
    const id = `${prefix}-${crypto.randomUUID()}`;
    await prisma.mediaAsset.create({
      data: {
        id,
        mimeType,
        data: base64Payload,
        sizeBytes,
      },
    });
    return `/api/media/${id}`;
  }

  // Local development fallback without DB (capped to small images)
  if (ALLOWED_IMAGE_TYPES.has(mimeType) && sizeBytes <= 2 * 1024 * 1024) {
    return `data:${mimeType};base64,${base64Payload}`;
  }

  throw new Error("Media storage is not configured in this environment.");
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { user } = auth.context;
    const { allowed } = checkRateLimit(`upload:${user.id}`, 40, 10 * 60 * 1000);
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
        return NextResponse.json({ error: "No file provided." }, { status: 400 });
      }

      const mimeType = file.type.toLowerCase();
      const isImage = ALLOWED_IMAGE_TYPES.has(mimeType);
      const isVideo = ALLOWED_VIDEO_TYPES.has(mimeType);

      if (!isImage && !isVideo) {
        return NextResponse.json(
          {
            error:
              "Unsupported file type. Allowed formats: JPG, PNG, WEBP, AVIF for photos; MP4, WEBM, MOV for video walkthroughs.",
          },
          { status: 400 }
        );
      }

      if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          {
            error: `Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed is 4MB.`,
          },
          { status: 400 }
        );
      }

      if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
        return NextResponse.json(
          {
            error: `Video too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed is 20MB.`,
          },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (!validateMediaMagicBytes(buffer, mimeType)) {
        return NextResponse.json(
          { error: "File contents do not match the declared media type." },
          { status: 400 }
        );
      }

      const base64Payload = buffer.toString("base64");
      const url = await storeMediaAssetAndGetUrl(mimeType, base64Payload, buffer.length);

      return NextResponse.json({
        success: true,
        url,
        type: isImage ? "image" : "video",
        fileName: file.name.replace(/[^a-zA-Z0-9.\-_]/g, ""),
        sizeBytes: buffer.length,
      });
    }

    // Handle JSON Base64 upload (from client-side compressed canvas)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { dataUrl } = body;

      if (!dataUrl || typeof dataUrl !== "string") {
        return NextResponse.json({ error: "Missing dataUrl" }, { status: 400 });
      }

      const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,([A-Za-z0-9+/=]+)$/);
      if (!match) {
        return NextResponse.json({ error: "Invalid data URL format." }, { status: 400 });
      }

      const mime = match[1].toLowerCase();
      const base64Payload = match[2];
      const isImage = ALLOWED_IMAGE_TYPES.has(mime);
      const isVideo = ALLOWED_VIDEO_TYPES.has(mime);

      if (!isImage && !isVideo) {
        return NextResponse.json({ error: "Disallowed MIME type in payload." }, { status: 400 });
      }

      const buffer = Buffer.from(base64Payload, "base64");
      const maxBytes = isImage ? MAX_IMAGE_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES;
      if (buffer.length === 0 || buffer.length > maxBytes) {
        return NextResponse.json(
          {
            error: isImage
              ? "Image exceeds the 4MB upload limit."
              : "Video exceeds the 20MB upload limit.",
          },
          { status: 400 }
        );
      }

      if (!validateMediaMagicBytes(buffer, mime)) {
        return NextResponse.json(
          { error: "Uploaded bytes do not match declared MIME type." },
          { status: 400 }
        );
      }

      const url = await storeMediaAssetAndGetUrl(mime, base64Payload, buffer.length);

      return NextResponse.json({
        success: true,
        url,
        type: isImage ? "image" : "video",
        sizeBytes: buffer.length,
      });
    }

    return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 400 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
  }
}
