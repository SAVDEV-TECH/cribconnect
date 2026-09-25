"use client";

import React from "react";
import dynamic from "next/dynamic";

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm animate-pulse border border-slate-200">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span>Loading UNILAG Campus & Property Map...</span>
      </div>
    </div>
  ),
});

interface InteractiveMapProps {
  listings: any[];
  center?: [number, number];
  zoom?: number;
  activeListingId?: string | null;
  onSelectListing?: (id: string) => void;
}

export default function InteractiveMap(props: InteractiveMapProps) {
  return <MapInner {...props} />;
}
