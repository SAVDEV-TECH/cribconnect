import React from "react";
import Link from "next/link";
import { getListingsStore, getRequestsStore } from "@/lib/data-store";
import ListingCard from "@/components/ListingCard";
import { Search, ShieldCheck, Video, CheckCircle2, ArrowRight, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const allListings = getListingsStore();
  const featuredListings = allListings.slice(0, 6);
  const activeRequests = getRequestsStore().slice(0, 2);

  return (
    <div className="bg-white">

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-14 text-center">
        <p className="text-sm font-medium text-emerald-600 mb-4">
          Verified student housing · Port Harcourt
        </p>
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight max-w-3xl mx-auto">
          Find a home near UNIPORT<br className="hidden sm:block" /> before you arrive.
        </h1>
        <p className="mt-5 text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
          Connect directly with verified agents in Choba, Rumuola, Aluu and surrounding areas. No scams, no hidden fees.
        </p>

        {/* Search bar */}
        <form
          action="/listings"
          method="GET"
          className="mt-8 max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-2 flex flex-col sm:flex-row gap-2"
        >
          <select
            name="neighborhood"
            defaultValue="ALL"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="ALL">All areas</option>
            <option value="Choba">Choba — Near Main Gate</option>
            <option value="Ozuoba">Ozuoba — Budget Zone</option>
            <option value="Aluu">Aluu — Back Gate</option>
            <option value="Rumuola">Rumuola — Quiet & Residential</option>
            <option value="Rumuokoro">Rumuokoro — Commercial</option>
            <option value="GRA Port Harcourt">GRA Port Harcourt — Premium</option>
          </select>

          <select
            name="propertyType"
            defaultValue="ALL"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="ALL">Any type</option>
            <option value="SELF_CONTAIN">Self-Contain</option>
            <option value="ONE_BED">1-Bedroom</option>
            <option value="TWO_BED">2-Bedroom</option>
            <option value="STUDIO">Serviced Studio</option>
          </select>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </form>

        {/* Quick links */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-gray-500">
          <span>Popular:</span>
          <Link href="/listings?neighborhood=Choba" className="text-emerald-600 hover:underline">Choba</Link>
          <span>·</span>
          <Link href="/listings?propertyType=SELF_CONTAIN" className="text-emerald-600 hover:underline">Self-Contain</Link>
          <span>·</span>
          <Link href="/listings?maxPrice=250000" className="text-emerald-600 hover:underline">Under ₦250k</Link>
          <span>·</span>
          <Link href="/listings?neighborhood=Aluu" className="text-emerald-600 hover:underline">Back Gate Area</Link>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Listings */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Available properties</h2>
            <p className="text-sm text-gray-500 mt-0.5">{allListings.length} verified listings near UNIPORT</p>
          </div>
          <Link
            href="/listings"
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Why CribConnect */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-10">
          <h2 className="text-xl font-bold text-gray-900">Why use CribConnect?</h2>
          <p className="text-sm text-gray-500 mt-1">Built for UNIPORT students to find housing safely and easily.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
              title: "Verified agents only",
              body: "Every agent has been identity-checked. No anonymous listings, no roadside touts.",
            },
            {
              icon: <Video className="w-5 h-5 text-emerald-600" />,
              title: "Video walkthroughs",
              body: "Watch a video tour of the room, compound, water supply and generator before you travel.",
            },
            {
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
              title: "Transparent fees",
              body: "See the full breakdown: rent + agency fee + caution deposit. No surprises on move-in day.",
            },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-6 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                {item.icon}
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Housing Requests CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-gray-50 rounded-2xl p-8 sm:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-md space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              <MessageSquare className="w-3.5 h-3.5" />
              Reverse marketplace
            </div>
            <h2 className="text-xl font-bold text-gray-900">Can't find what you need?</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Post your budget and preferred area. Verified agents will send matching properties directly to your WhatsApp.
            </p>

            {/* Live Requests Preview */}
            <div className="pt-4 space-y-2">
              {activeRequests.map((req) => (
                <div key={req.id} className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{req.tenantName} · {req.tenantSchool}</p>
                    <p className="text-xs text-gray-500 truncate">{req.title}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 shrink-0">₦{req.maxBudget.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 shrink-0">
            <Link
              href="/requests"
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors text-center"
            >
              Post your housing need
            </Link>
            <Link
              href="/requests"
              className="px-5 py-2.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors text-center"
            >
              View all requests
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
