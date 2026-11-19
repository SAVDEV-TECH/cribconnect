"use client";

import React, { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { normalizeVideoTourUrl } from "@/lib/types";
import { X, Video, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function VideoTourModal() {
  const { videoTourUrl, closeVideoTour } = useApp();

  useEffect(() => {
    if (!videoTourUrl) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeVideoTour();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [videoTourUrl, closeVideoTour]);

  if (!videoTourUrl) return null;

  const media = normalizeVideoTourUrl(videoTourUrl);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-tour-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-3xl w-full overflow-hidden shadow-2xl text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="video-tour-title"
                className="font-semibold text-base text-white flex items-center gap-2"
              >
                Virtual Video Walkthrough Tour
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Video Tour
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Inspect layout, water flow, bathroom finish, and compound security before visiting
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeVideoTour}
            aria-label="Close video tour"
            className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="aspect-video w-full bg-black relative flex items-center justify-center">
          {media?.kind === "video" ? (
            <video
              src={media.src}
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          ) : media?.kind === "iframe" ? (
            <iframe
              src={media.src}
              title="Property Video Tour"
              className="w-full h-full border-none"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="text-xs text-gray-400 p-6 text-center">
              Unable to load this video walkthrough URL.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-950/90 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Always inspect physically before releasing your 4-digit Escrow PIN.</span>
          </div>
          <button
            type="button"
            onClick={closeVideoTour}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors"
          >
            Close Walkthrough
          </button>
        </div>
      </div>
    </div>
  );
}
