import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ListingCard from "@/components/ListingCard";
import {
  ShieldCheck,
  Video,
  Compass,
  ArrowRight,
  Search,
  CheckCircle2,
  Sparkles,
  Users,
  Building2,
  Lock,
  MessageSquare,
  Award,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Fetch featured listings
  const featuredListings = await prisma.listing.findMany({
    where: { isAvailable: true },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          avatar: true,
          phone: true,
          whatsapp: true,
          agentProfile: true,
        },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 6,
  });

  // Fetch active housing requests
  const activeRequests = await prisma.housingRequest.findMany({
    where: { status: "OPEN" },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          avatar: true,
          city: true,
          currentSchool: true,
        },
      },
      proposals: {
        select: { id: true },
      },
    },
    take: 3,
  });

  // Fetch top verified agents
  const topAgents = await prisma.agentProfile.findMany({
    where: { verificationStatus: "VERIFIED" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          city: true,
          currentSchool: true,
          listings: {
            where: { isAvailable: true },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { rating: "desc" },
    take: 3,
  });

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-brand-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-emerald-500/10 blur-2xl pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-emerald-400 shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The &quot;Zillow + Upwork&quot; Hybrid for Student Relocation</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Find a trusted student home <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              before you even land on campus.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
            Relocating to UNILAG, YabaTech, or a new city? Stop trusting random roadside agents.
            Browse verified listings with video walkthroughs, or post your housing request and let accredited agents pitch matching cribs to you.
          </p>

          {/* Quick Search & Filter Widget */}
          <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 p-3 sm:p-4 rounded-2xl max-w-4xl mx-auto shadow-2xl text-left">
            <form action="/listings" method="GET" className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Neighborhood
                </label>
                <select
                  name="neighborhood"
                  defaultValue="ALL"
                  className="w-full bg-slate-800/90 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Property Type
                </label>
                <select
                  name="propertyType"
                  defaultValue="ALL"
                  className="w-full bg-slate-800/90 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="ALL">All Property Types</option>
                  <option value="SELF_CONTAIN">Self-Contain (Studio)</option>
                  <option value="ONE_BED">1-Bedroom Apartment</option>
                  <option value="TWO_BED">2-Bedroom (Shared Flat)</option>
                  <option value="STUDIO">Serviced Studio with AC</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Max Annual Budget
                </label>
                <select
                  name="maxPrice"
                  defaultValue="1000000"
                  className="w-full bg-slate-800/90 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="500000">Under ₦500,000 / yr</option>
                  <option value="750000">Under ₦750,000 / yr</option>
                  <option value="1000000">Under ₦1,000,000 / yr</option>
                  <option value="1500000">Up to ₦1,500,000 / yr</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                >
                  <Search className="w-4 h-4" />
                  <span>Explore Rentals</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Stats Trust Badges */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-center border-t border-slate-800/80">
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">100%</div>
              <div className="text-[11px] text-slate-400">NIN & ID Verified Agents</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400">0%</div>
              <div className="text-[11px] text-slate-400">Fake Listing Tolerance</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">&lt; 10 Mins</div>
              <div className="text-[11px] text-slate-400">Average Walk to Campus</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400">₦0</div>
              <div className="text-[11px] text-slate-400">To Post Housing Request</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works: The Upwork for Housing Model */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <span className="text-xs uppercase tracking-wider font-extrabold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
            The Innovation
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            How CribConnect Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Traditional platforms only list houses. We put verified local agents at your service with structured proposals and transparent fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative group">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm mb-4 group-hover:scale-110 transition-transform">
              1
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1.5">
              Post Your Housing Request
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Describe what you need: &quot;Self-contain near UNILAG New Hall Gate, budget ₦500k, moving Oct 1.&quot;
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative group">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm mb-4 group-hover:scale-110 transition-transform">
              2
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1.5">
              Agents Submit Structured Pitches
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Verified agents respond with matching properties, transparent fee breakdowns (Rent, Agent, Caution), and custom notes.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative group">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm mb-4 group-hover:scale-110 transition-transform">
              3
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1.5">
              Virtual Video Walkthroughs
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Inspect water pressure, generator setup, kitchen tiled floors, and compound security without traveling.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative group">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm mb-4 group-hover:scale-110 transition-transform">
              4
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1.5">
              Move In Scam-Free
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Compare proposals, inspect agent ratings & reviews, and chat in-app or directly on WhatsApp with certified locals.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Handpicked Near UNILAG & Yaba
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Featured Student Cribs
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Verified accommodations within walking distance or direct shuttle to campus gates.
            </p>
          </div>

          <Link
            href="/listings"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 group"
          >
            <span>View All Properties & Map</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredListings.map((listing: any) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* Reverse Marketplace Callout: Active Housing Requests */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-10 text-white border border-slate-700 relative overflow-hidden shadow-xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs uppercase tracking-wider font-extrabold text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                Reverse Marketplace • Upwork for Rentals
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Can&apos;t find what you need? Post a request.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Over 10+ verified student relocation agents are actively monitoring the board. Tell them your budget and preferred campus gate, and let them bring the houses to you!
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/requests"
                className="px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs shadow-lg transition-all hover:scale-105"
              >
                + Post Your Housing Need
              </Link>
              <Link
                href="/requests"
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600 transition-colors"
              >
                Browse All Student Requests ({activeRequests.length}+ active)
              </Link>
            </div>
          </div>

          {/* Sample Requests Carousel / Cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {activeRequests.map((req: any) => (
              <div
                key={req.id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 hover:border-brand-500/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={req.student.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                      alt={req.student.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-600"
                    />
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        {req.student.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {req.student.city || "Relocating Fresher"}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                    Max ₦{(req.maxBudget).toLocaleString()} / yr
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-100 line-clamp-1">
                  {req.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  {req.description}
                </p>
                <div className="pt-3 mt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 font-medium">
                    ⚡ {req.proposals.length} Agent Proposal{req.proposals.length === 1 ? "" : "s"} Submitted
                  </span>
                  <Link
                    href={`/requests/${req.id}`}
                    className="text-white hover:text-brand-400 font-semibold flex items-center gap-1"
                  >
                    <span>View Pitches</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Verified Agents Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <span className="text-xs uppercase tracking-wider font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Accreditation & Trust
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Meet Verified Local Housing Agents
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Every verified agent has their National Identity (NIN), broker credentials, and physical local office inspected by our compliance team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topAgents.map((profile: any) => {
            let badgesArray: string[] = [];
            try {
              badgesArray = JSON.parse(profile.badges);
            } catch {
              badgesArray = [];
            }

            return (
              <div
                key={profile.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={
                        profile.user.avatar ||
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"
                      }
                      alt={profile.user.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-slate-900">
                          {profile.user.name}
                        </h3>
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {profile.agencyName || "Certified Rental Agent"}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-amber-600 font-bold mt-0.5">
                        <span>★ {profile.rating.toFixed(1)}</span>
                        <span className="text-slate-400 font-normal">
                          ({profile.reviewCount} student reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                    {profile.bio || "Specialist in student rentals near campus gates."}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {badgesArray.slice(0, 3).map((b: string, i: number) => (
                      <span
                        key={i}
                        className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold"
                      >
                        ✓ {b}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {profile.user.listings.length} Available Cribs
                  </span>
                  <Link
                    href={`/agents/${profile.user.id}`}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-brand-600 text-white font-semibold transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust & Safety Zero-Scam Guarantee */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-emerald-950 text-white rounded-3xl p-8 sm:p-12 border border-emerald-800 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 text-emerald-300 text-xs font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>Student Protection Protocol</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Never fall victim to &quot;inspection fee&quot; scams again.
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200 leading-relaxed">
                In many student hubs, unscrupled middlemen collect &quot;non-refundable mobilization fees&quot; and disappear. On CribConnect, every agent is documented, listings feature live walkthrough video evidence, and you can report suspicious accounts straight to platform administrators.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> NIMC / NIN Identity Match
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Transparent Fee Itemization
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Direct WhatsApp & In-App Chat
                </span>
              </div>
            </div>

            <div className="text-center md:text-right">
              <Link
                href="/listings"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-emerald-950 hover:bg-emerald-100 font-extrabold text-sm shadow-xl transition-all hover:scale-105"
              >
                <span>Find Your Campus Crib</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
