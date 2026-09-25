// app/not-found.tsx — Custom 404 page
import Link from "next/link";
import { Home, Search, MessageSquare, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | CribConnect",
  description: "The page you're looking for doesn't exist. Find student housing near UNILAG and YabaTech on CribConnect.",
};

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-slate-50">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* 404 Hero */}
        <div className="space-y-4">
          <div className="text-8xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent leading-none">
            404
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            This crib doesn&apos;t exist 🏠
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            The page you&apos;re looking for may have moved, been rented out, or never existed.
            Let&apos;s find you the right spot.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Home className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Home</span>
          </Link>

          <Link
            href="/listings"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Browse Listings</span>
          </Link>

          <Link
            href="/requests"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Post Request</span>
          </Link>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to CribConnect
        </Link>
      </div>
    </div>
  );
}
