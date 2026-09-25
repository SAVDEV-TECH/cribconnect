import React from "react";
import Link from "next/link";
import { Building2, ShieldCheck, Heart, MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-white font-bold text-base">CribConnect</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              The &quot;Zillow + Upwork&quot; hybrid platform connecting incoming university students and relocators with verified local housing agents.
            </p>
            <div className="pt-2 flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Scam Verified Agent Guarantee</span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Explore Campus Hubs
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/listings?university=UNILAG" className="hover:text-white transition-colors">
                  UNILAG (Akoka, Onike, Abule-Oja)
                </Link>
              </li>
              <li>
                <Link href="/listings?university=Yaba" className="hover:text-white transition-colors">
                  Yaba College of Technology (Sabo)
                </Link>
              </li>
              <li>
                <Link href="/listings?university=LASU" className="hover:text-white transition-colors">
                  Lagos State University (Ojo)
                </Link>
              </li>
              <li>
                <Link href="/listings?university=UI" className="hover:text-white transition-colors">
                  University of Ibadan (UI Bodija)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Marketplace Features
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/requests" className="hover:text-white transition-colors">
                  Post Housing Request (Upwork Model)
                </Link>
              </li>
              <li>
                <Link href="/listings" className="hover:text-white transition-colors">
                  Split Map & Video Tours
                </Link>
              </li>
              <li>
                <Link href="/agents" className="hover:text-white transition-colors">
                  Verified Agents Directory
                </Link>
              </li>
              <li>
                <Link href="/agent/dashboard" className="hover:text-white transition-colors">
                  Agent Growth Portal (Pro Tier)
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  Admin Trust & Safety Screening
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Trust & Safety Support
            </h4>
            <p className="text-slate-400 mb-3">
              Need assistance verifying an agent or resolving a housing dispute?
            </p>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>support@cribconnect.ng</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>+234 1 800 2742 (CRIB)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <div>
            © 2026 CribConnect Nigeria. All rights reserved. Designed for students relocating to university environments.
          </div>
          <div className="flex items-center gap-1">
            <span>Built with integrity for Nigerian student housing</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
          </div>
        </div>
      </div>
    </footer>
  );
}
