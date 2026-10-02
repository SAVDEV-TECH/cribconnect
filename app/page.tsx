import React from "react";
import Link from "next/link";
import { getListingsStore, getRequestsStore } from "@/lib/data-store";
import ListingCard from "@/components/ListingCard";
import {
  Search,
  ShieldCheck,
  Video,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  PlusCircle,
  Building2,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const allListings = getListingsStore();
  const featuredListings = allListings.slice(0, 6);
  const activeRequests = getRequestsStore().slice(0, 2);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-80 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-xs font-bold text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verified Student & Relocation Housing in Lagos</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Find your student home <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              before arriving on campus.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
            Stop losing money to roadside &quot;inspection fee&quot; scams. Connect directly with verified agents near UNILAG, YabaTech, and surrounding hubs on WhatsApp with zero hidden charges.
          </p>

          {/* Clean, Simple Search Box */}
          <div className="mt-8 bg-white p-3 sm:p-4 rounded-2xl shadow-2xl max-w-3xl mx-auto text-left border border-slate-100">
            <form action="/listings" method="GET" className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Neighborhood
                </label>
                <select
                  name="neighborhood"
                  defaultValue="ALL"
                  className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="ALL">All Hubs (Akoka, Onike, Yaba)</option>
                  <option value="Akoka">Akoka (Near UNILAG Gates)</option>
                  <option value="Onike">Onike (Quiet & Residential)</option>
                  <option value="Abule-Oja">Abule-Oja (2nd Gate Axis)</option>
                  <option value="Yaba">Yaba / Commercial Ave</option>
                  <option value="Bariga">Bariga / St. Finbarr&apos;s</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Type
                </label>
                <select
                  name="propertyType"
                  defaultValue="ALL"
                  className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="ALL">All Types</option>
                  <option value="SELF_CONTAIN">Self-Contain</option>
                  <option value="ONE_BED">1-Bedroom Flat</option>
                  <option value="TWO_BED">2-Bedroom Flat</option>
                  <option value="STUDIO">Serviced Studio</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Budget
                </label>
                <select
                  name="maxPrice"
                  defaultValue="1000000"
                  className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="400000">Under ₦400,000 / yr</option>
                  <option value="600000">Under ₦600,000 / yr</option>
                  <option value="850000">Under ₦850,000 / yr</option>
                  <option value="1500000">Up to ₦1,500,000 / yr</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.02]"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Cribs</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
            <span className="text-slate-400 font-medium">Quick Picks:</span>
            <Link
              href="/listings?neighborhood=Akoka"
              className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-colors"
            >
              🚶 Akoka (4-8 mins to Gate)
            </Link>
            <Link
              href="/listings?propertyType=SELF_CONTAIN"
              className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-colors"
            >
              🏠 Self-Contains
            </Link>
            <Link
              href="/listings?maxPrice=500000"
              className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-colors"
            >
              💰 Under ₦500k
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Properties Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Handpicked & Verified
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Available Cribs Near Campus
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Inspected student rooms with direct agent WhatsApp, video tours, and clear upfront pricing.
            </p>
          </div>

          <Link
            href="/listings"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 group"
          >
            <span>View All {allListings.length} Properties</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* "Can't find a place?" Housing Request Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white border border-emerald-900/50 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs uppercase tracking-wider font-extrabold text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                Can&apos;t find what you want?
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Tell verified agents what you need.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Post your target budget and campus gate. Verified agents monitoring the board will send matching houses directly to your WhatsApp!
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/requests"
                className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-lg transition-all hover:scale-105"
              >
                + Post Housing Need (Free)
              </Link>
              <Link
                href="/requests"
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
              >
                See Current Student Requests
              </Link>
            </div>
          </div>

          {/* Live Request Snippets */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 pt-6 border-t border-slate-800">
            {activeRequests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">{req.tenantName} ({req.tenantSchool})</span>
                  <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                    Max ₦{req.maxBudget.toLocaleString()} / yr
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium line-clamp-1">{req.title}</p>
                <p className="text-[11px] text-slate-400 line-clamp-2">{req.description}</p>
                <div className="flex items-center justify-between text-[11px] pt-1 text-emerald-400 font-semibold">
                  <span>📍 {req.preferredArea}</span>
                  <Link href="/requests" className="hover:underline flex items-center gap-1">
                    <span>View Request</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Pillars of Tenant Trust */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
          <h2 className="text-2xl font-black text-slate-900">
            Why Rent Through CribConnect?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Built specifically to solve the stressful rental problems in Nigerian university hubs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">100% Verified Agents</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every agent on CribConnect has their NIN and office verified. Zero roadside scams, zero disappearing agents.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Virtual Walkthroughs</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              See video walkthroughs of the rooms, water pressure, generator setup, and compound gate before traveling.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Total Fee Transparency</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              See exact breakdowns: Annual Rent + Agreement/Agency Fee + Caution Deposit = Total Move-in Upfront. No surprise charges.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
