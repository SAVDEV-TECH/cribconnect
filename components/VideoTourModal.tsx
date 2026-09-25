"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { X, Video, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function VideoTourModal() {
  const { videoTourUrl, closeVideoTour } = useApp();

  if (!videoTourUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-white flex items-center gap-2">
                Virtual Video Walkthrough Tour
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Agent Verified
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Inspect layout, water flow, bathroom finish, and compound security before visiting
              </p>
            </div>
          </div>
          <button
            onClick={closeVideoTour}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="aspect-video w-full bg-black relative flex items-center justify-center">
          <iframe
            src={videoTourUrl}
            title="Property Video Tour"
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Modal Footer / Verification Callout */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Recorded & authenticated by CribConnect accredited agent on-site.</span>
          </div>
          <button
            onClick={closeVideoTour}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close Walkthrough
          </button>
        </div>
      </div>
    </div>
  );
}
