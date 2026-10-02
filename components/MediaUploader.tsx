"use client";

import React, { useState, useRef } from "react";
import {
  Camera,
  Video,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Play,
} from "lucide-react";

interface MediaUploaderProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  videoUrl?: string;
  onVideoChange: (videoUrl: string) => void;
}

export default function MediaUploader({
  photos,
  onPhotosChange,
  videoUrl,
  onVideoChange,
}: MediaUploaderProps) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploadingImage(true);

    try {
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Client-side file size check (5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`"${file.name}" is larger than 5MB. Please choose a smaller photo.`);
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to upload photo");
        }

        if (data.url) {
          newUrls.push(data.url);
        }
      }

      onPhotosChange([...photos, ...newUrls]);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload photos");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleVideoFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploadingVideo(true);

    try {
      const file = files[0];

      // Client-side file size check (30MB)
      if (file.size > 30 * 1024 * 1024) {
        throw new Error(`Video is larger than 30MB. Please upload a shorter clip or use a YouTube link.`);
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload video");
      }

      if (data.url) {
        onVideoChange(data.url);
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload video");
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {uploadError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Photo Uploader */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-emerald-600" />
            <span>Property Photos ({photos.length} uploaded)</span>
          </label>
          <span className="text-[11px] text-slate-400 font-medium">Max 5MB per photo</span>
        </div>

        {/* Thumbnails grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {photos.map((url, idx) => (
              <div
                key={idx}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 group bg-slate-100 shadow-xs"
              >
                <img src={url} alt={`Property upload ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                  title="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold">
                    Cover Photo
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload Trigger Dropzone */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => handleImageFiles(e.target.files)}
        />

        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={uploadingImage}
          className="w-full border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center transition-all bg-slate-50/50 hover:bg-emerald-50/30 flex flex-col items-center justify-center gap-2 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              {uploadingImage ? "Uploading photos..." : "Click to upload room & compound photos"}
            </span>
            <span className="text-[11px] text-slate-400">
              Supports multiple JPG, PNG, WEBP files
            </span>
          </div>
        </button>
      </div>

      {/* Video Walkthrough Uploader */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Video className="w-4 h-4 text-emerald-600" />
            <span>Video Walkthrough (Recommended for faster rentals)</span>
          </label>
          <span className="text-[11px] text-slate-400 font-medium">MP4/WEBM up to 30MB</span>
        </div>

        {videoUrl ? (
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Video walkthrough attached</span>
            </div>
            <button
              type="button"
              onClick={() => onVideoChange("")}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={(e) => handleVideoFile(e.target.files)}
            />

            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploadingVideo}
              className="w-full border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 text-center transition-all bg-slate-50/50 hover:bg-emerald-50/30 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Video className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-700">
                {uploadingVideo ? "Uploading video file..." : "Upload short video walkthrough (MP4)"}
              </span>
            </button>

            <div className="flex items-center gap-2">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-[10px] uppercase font-bold text-slate-400">or enter YouTube embed</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <input
              type="url"
              placeholder="https://www.youtube.com/embed/..."
              value={videoUrl || ""}
              onChange={(e) => onVideoChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
