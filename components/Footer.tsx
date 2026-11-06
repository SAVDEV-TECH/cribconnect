import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 text-sm text-gray-500">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">C</span>
              </div>
              <span className="font-semibold text-gray-900 text-sm">CribConnect</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-[200px]">
              Verified student housing near UNIPORT, Port Harcourt.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              Zero-scam guarantee
            </div>
          </div>

          {/* Areas */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Areas</p>
            {[
              { label: "Choba (Main Gate)", href: "/listings?neighborhood=Choba" },
              { label: "Aluu (Back Gate)", href: "/listings?neighborhood=Aluu" },
              { label: "Rumuola", href: "/listings?neighborhood=Rumuola" },
              { label: "GRA Port Harcourt", href: "/listings?neighborhood=GRA Port Harcourt" },
            ].map((link) => (
              <div key={link.href}>
                <Link href={link.href} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                  {link.label}
                </Link>
              </div>
            ))}
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Platform</p>
            {[
              { label: "Browse listings", href: "/listings" },
              { label: "Post a request", href: "/requests" },
              { label: "Find an agent", href: "/agents" },
              { label: "List a property", href: "/list-property" },
            ].map((link) => (
              <div key={link.href}>
                <Link href={link.href} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                  {link.label}
                </Link>
              </div>
            ))}
          </div>

          {/* Support */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Support</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Need help verifying an agent or resolving a dispute?
            </p>
            <p className="text-xs text-gray-600">support@cribconnect.ng</p>
            <p className="text-xs text-gray-600">+234 1 800 2742</p>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>© 2026 CribConnect Nigeria. All rights reserved.</span>
          <span>Built for UNIPORT students.</span>
        </div>
      </div>
    </footer>
  );
}
