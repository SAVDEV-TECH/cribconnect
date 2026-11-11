// app/not-found.tsx — Custom 404 page
import Link from "next/link";
import { Home, Search, MessageSquare, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | CribConnect",
  description: "The page you're looking for doesn't exist. Find student housing near UNIPORT Port Harcourt on CribConnect.",
};

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* 404 Hero */}
        <div className="space-y-3">
          <div className="text-7xl font-bold text-gray-900 leading-none">
            404
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Page not found
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            The page you are looking for may have moved or been removed.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-400 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-800 flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-gray-700">Home</span>
          </Link>

          <Link
            href="/listings"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-400 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-800 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-gray-700">Browse Listings</span>
          </Link>

          <Link
            href="/requests"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-400 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-800 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-gray-700">Post Request</span>
          </Link>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to CribConnect
        </Link>
      </div>
    </div>
  );
}

