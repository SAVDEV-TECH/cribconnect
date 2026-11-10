"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Lock,
  Landmark,
  MessageCircle,
  Eye,
  Calendar,
  ArrowRight,
  RefreshCw,
  Award,
  KeyRound,
  PlusCircle,
} from "lucide-react";

export default function AdminPage() {
  const { currentUser } = useApp();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"providers" | "payouts" | "properties">("providers");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Optional passcode gate if not signed in
  const [unlocked, setUnlocked] = useState(true);
  const [passcode, setPasscode] = useState("");

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load founder overview", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [currentUser]);

  const showNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleDisburseEscrow = async (escrowId: string, agentName: string, amount: number) => {
    setActionLoading(escrowId);
    try {
      const res = await fetch("/api/admin/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DISBURSE_ESCROW", escrowId }),
      });
      if (res.ok) {
        showNotice(`Marked ₦${amount.toLocaleString()} escrow payout as sent to ${agentName}'s bank!`);
        await fetchOverview();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisburseRental = async (
    userId: string,
    rentalId: string,
    agentName: string,
    amount: number
  ) => {
    setActionLoading(rentalId);
    try {
      const res = await fetch("/api/admin/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DISBURSE_RENTAL", userId, rentalId }),
      });
      if (res.ok) {
        showNotice(`Marked ₦${amount.toLocaleString()} agency commission as paid to ${agentName}!`);
        await fetchOverview();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleVerify = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_VERIFY_USER",
          userId,
          isVerified: !currentStatus,
        }),
      });
      if (res.ok) {
        showNotice(`Updated verification badge!`);
        await fetchOverview();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    setActionLoading(listingId);
    try {
      const res = await fetch("/api/admin/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_LISTING", listingId }),
      });
      if (res.ok) {
        showNotice("Property listing removed.");
        await fetchOverview();
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (!unlocked && !currentUser) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Founder Command Center</h1>
        <p className="text-xs text-gray-500">
          Sign in with your Google account or enter your Founder PIN to view platform metrics and payouts.
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="Founder PIN (e.g. 2026)"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
          />
          <button
            onClick={() => setUnlocked(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {
    totalAgentsCount: 0,
    totalOwnersCount: 0,
    totalProvidersCount: 0,
    totalPropertiesCount: 0,
    totalRequestsCount: 0,
    totalViews: 0,
    totalWhatsappClicks: 0,
    totalInspections: 0,
    totalEscrows: 0,
    totalConnects: 0,
    escrowVaultBalance: 0,
    platformEscrowRevenue: 0,
    platformAgencyRevenue: 0,
    totalPlatformRevenue: 0,
    totalPendingPayouts: 0,
    totalDisbursedPayouts: 0,
  };

  const providers: any[] = data?.providers || [];
  const listings: any[] = data?.listings || [];
  const escrows: any[] = data?.escrows || [];
  const rentalCommissions: any[] = data?.rentalCommissions || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg border border-gray-700 flex items-center gap-2.5 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Founder Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>CribConnect Founder & Admin Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Agents, House Owners, Connects & Commissions
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
            Monitor every registered Agent and House Owner, track real-time student Connects across UNIPORT, and manage 90/10 Escrow and 80/20 Agency Commission bank payouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={fetchOverview}
            className="px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </button>
          <Link
            href="/agent/dashboard"
            className="px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
          >
            My Realtor Dashboard
          </Link>
          <Link
            href="/list-property"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Upload Property</span>
          </Link>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Agents & House Owners */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Agents & House Owners
            </span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {kpis.totalProvidersCount}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold">
              {kpis.totalAgentsCount} Agents
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold">
              {kpis.totalOwnersCount} House Owners
            </span>
          </div>
        </div>

        {/* Card 2: Total Student Connects */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Total Student Connects
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {kpis.totalConnects.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-500">
            {kpis.totalViews} Views · {kpis.totalWhatsappClicks} WhatsApp · {kpis.totalInspections} Inspections · {kpis.totalEscrows} Escrows
          </p>
        </div>

        {/* Card 3: CribConnect Platform Commission */}
        <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase">
              CribConnect Net Revenue
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-emerald-700">
            ₦{kpis.totalPlatformRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-800/80">
            ₦{kpis.platformEscrowRevenue.toLocaleString()} Escrow (10%) + ₦{kpis.platformAgencyRevenue.toLocaleString()} Agency Cut (20%)
          </p>
        </div>

        {/* Card 4: Escrow Vault & Pending Agent Payouts */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Agent/Owner Bank Payouts
            </span>
            <Landmark className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            ₦{kpis.totalPendingPayouts.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-500">
            Awaiting transfer · ₦{kpis.escrowVaultBalance.toLocaleString()} currently locked in Escrow
          </p>
        </div>
      </div>

      {/* How Commission Split Works Banner */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
            1
          </div>
          <div>
            <p className="font-bold text-gray-900">48h Escrow Reservation (₦10,000)</p>
            <p className="text-gray-500 mt-0.5">
              When a student enters the 4-digit release PIN after inspection, <strong>CribConnect keeps 10% (₦1,000)</strong> and <strong>₦9,000 (90%)</strong> is approved for the Agent/Owner's bank.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
            2
          </div>
          <div>
            <p className="font-bold text-gray-900">Closed Rental Agency Fee (80/20 Split)</p>
            <p className="text-gray-500 mt-0.5">
              On every completed house rental (10% Agency Fee), <strong>CribConnect earns 20% of the Agency Fee</strong> and the <strong>Agent/Owner receives 80%</strong>.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
            3
          </div>
          <div>
            <p className="font-bold text-gray-900">Direct Bank Payout Ledger</p>
            <p className="text-gray-500 mt-0.5">
              Agents & Owners save their 10-digit Nigerian NUBAN on their dashboard. Once released, you transfer to their bank and click <strong>Mark Paid to Bank</strong> below.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab("providers")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "providers"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Agents & House Owners ({providers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("payouts")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "payouts"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>Commission & Payout Ledger ({escrows.length + rentalCommissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("properties")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "properties"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>All Uploaded Properties ({listings.length})</span>
        </button>
      </div>

      {/* TAB 1: AGENTS & HOUSE OWNERS DIRECTORY */}
      {activeTab === "providers" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Registered Agents & House Owners
              </h2>
              <p className="text-xs text-gray-500">
                Track every partner's uploaded houses, student connects, bank account, and commissions.
              </p>
            </div>
          </div>

          {providers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-900">No Agents or House Owners registered yet</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                As soon as you or another agent/landlord signs in or uploads a property, their full profile, connect counts, and bank details will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Agent / Owner</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Properties</th>
                    <th className="py-3.5 px-4">Student Connects Funnel</th>
                    <th className="py-3.5 px-4">Payout Bank Account</th>
                    <th className="py-3.5 px-4">Commission & Payouts</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {providers.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/60">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              p.avatar ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                                p.name
                              )}`
                            }
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-1">
                              <span>{p.name}</span>
                              {p.isVerified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500">{p.agencyName}</div>
                            <div className="text-[11px] text-gray-400">{p.phone || p.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.role === "LANDLORD"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {p.role === "LANDLORD" ? "HOUSE OWNER" : "AGENT"}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-bold text-gray-900">
                        {p.listingsCount} {p.listingsCount === 1 ? "Crib" : "Cribs"}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900">
                          {p.totalConnects} Total Connects
                        </div>
                        <div className="text-[11px] text-gray-500 flex flex-wrap gap-2 mt-0.5">
                          <span>👁 {p.viewsCount} Views</span>
                          <span>💬 {p.whatsappConnects} WhatsApp</span>
                          <span>📅 {p.inspectionsCount} Inspections</span>
                          <span>🔒 {p.escrowsCount} Escrows</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {p.bankAccountNumber ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-gray-900">{p.bankName}</div>
                            <div className="font-mono text-xs text-emerald-700 font-semibold">
                              {p.bankAccountNumber}
                            </div>
                            <div className="text-[10px] text-gray-500">{p.bankAccountName}</div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            Bank not added yet
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900">
                          Earned: ₦{(p.earnedTotal || 0).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-amber-700 font-semibold">
                          Pending Bank Transfer: ₦{(p.pendingBankPayout || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-emerald-700">
                          Paid Out: ₦{(p.paidBankPayout || 0).toLocaleString()}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          disabled={actionLoading === p.id}
                          onClick={() => handleToggleVerify(p.id, p.isVerified)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                            p.isVerified
                              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          {p.isVerified ? "Verified ✓" : "Approve Badge"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMMISSION & BANK PAYOUT LEDGER */}
      {activeTab === "payouts" && (
        <div className="space-y-6">
          {/* Section A: Escrow Holding Payouts (90/10 Split) */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                1. Escrow Reservation Payouts (₦10,000 Hold → ₦1,000 CribConnect / ₦9,000 Agent or Owner)
              </h2>
              <p className="text-xs text-gray-500">
                Once a student inspects the property and enters their 4-digit release PIN, transfer ₦9,000 to the Agent/Owner's bank and mark it Paid.
              </p>
            </div>

            {escrows.length === 0 ? (
              <div className="p-10 text-center text-xs text-gray-500">
                No escrow reservations placed yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold text-gray-500 uppercase">
                      <th className="py-3 px-4">Property & Student</th>
                      <th className="py-3 px-4">Agent / Owner</th>
                      <th className="py-3 px-4">Bank Account</th>
                      <th className="py-3 px-4">Split Breakdown</th>
                      <th className="py-3 px-4">Escrow Status</th>
                      <th className="py-3 px-4 text-right">Bank Disbursement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {escrows.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50/60">
                        <td className="py-4 px-4">
                          <div className="font-bold text-gray-900">{e.listingTitle}</div>
                          <div className="text-[11px] text-gray-500">
                            Student: {e.studentName} ({e.studentPhone})
                          </div>
                          <div className="text-[10px] text-gray-400">
                            Ref: {e.paystackReference}
                          </div>
                        </td>

                        <td className="py-4 px-4 font-semibold text-gray-900">
                          {e.agentName}
                        </td>

                        <td className="py-4 px-4">
                          {e.bankAccountNumber ? (
                            <div>
                              <div className="font-bold text-gray-900">{e.bankName}</div>
                              <div className="font-mono text-emerald-700 font-bold">
                                {e.bankAccountNumber}
                              </div>
                              <div className="text-[10px] text-gray-500">{e.bankAccountName}</div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400">No bank saved</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <div>Total Deposit: <strong>₦{(e.amount || 10000).toLocaleString()}</strong></div>
                          <div className="text-emerald-700 font-semibold">
                            CribConnect (10%): ₦{(e.platformFee || 1000).toLocaleString()}
                          </div>
                          <div className="text-gray-900 font-bold">
                            Agent Net (90%): ₦{(e.agentPayout || 9000).toLocaleString()}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              e.status === "RELEASED_TO_AGENT"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : e.status === "REFUNDED_TO_STUDENT"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {e.status === "RELEASED_TO_AGENT"
                              ? "PIN VERIFIED · RELEASED"
                              : e.status === "REFUNDED_TO_STUDENT"
                              ? "REFUNDED TO STUDENT"
                              : "LOCKED IN ESCROW (48H)"}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right">
                          {e.status === "RELEASED_TO_AGENT" ? (
                            e.payoutStatus === "PAID_TO_BANK" ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Paid to Bank
                              </span>
                            ) : (
                              <button
                                disabled={actionLoading === e.id}
                                onClick={() =>
                                  handleDisburseEscrow(e.id, e.agentName, e.agentPayout || 9000)
                                }
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                              >
                                Mark ₦{(e.agentPayout || 9000).toLocaleString()} Paid to Bank
                              </button>
                            )
                          ) : (
                            <span className="text-[11px] text-gray-400">
                              Awaiting student PIN release
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section B: Closed Rental Agency Commissions (80/20 Split) */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                2. Closed Rental Agency Fee Commissions (20% CribConnect / 80% Agent or Owner)
              </h2>
              <p className="text-xs text-gray-500">
                Tracks every completed student rental and the 80/20 commission split on the 10% Agency Fee.
              </p>
            </div>

            {rentalCommissions.length === 0 ? (
              <div className="p-10 text-center text-xs text-gray-500">
                No closed rentals recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold text-gray-500 uppercase">
                      <th className="py-3 px-4">Property & Tenant</th>
                      <th className="py-3 px-4">Agent / Owner</th>
                      <th className="py-3 px-4">Annual Rent & 10% Fee</th>
                      <th className="py-3 px-4">Commission Split (80/20)</th>
                      <th className="py-3 px-4 text-right">Settlement Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {rentalCommissions.map((rc) => (
                      <tr key={rc.id} className="hover:bg-gray-50/60">
                        <td className="py-4 px-4">
                          <div className="font-bold text-gray-900">{rc.propertyTitle}</div>
                          <div className="text-[11px] text-gray-500">
                            Tenant: {rc.tenantName} · {rc.neighborhood}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-bold text-gray-900">{rc.agentName}</div>
                          {rc.bankAccountNumber && (
                            <div className="text-[11px] text-emerald-700 font-mono">
                              {rc.bankName} · {rc.bankAccountNumber}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <div>Rent: <strong>₦{(rc.amount || 0).toLocaleString()}</strong></div>
                          <div className="text-[11px] text-gray-500">
                            10% Agency Fee: ₦{(rc.agencyFeeTotal || 0).toLocaleString()}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="text-emerald-700 font-semibold">
                            CribConnect (20%): ₦{(rc.platformCommission || 0).toLocaleString()}
                          </div>
                          <div className="text-gray-900 font-bold">
                            Agent Net (80%): ₦{(rc.agentNetCommission || 0).toLocaleString()}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right">
                          {rc.payoutStatus === "PAID_TO_BANK" ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                            </span>
                          ) : (
                            <button
                              disabled={actionLoading === rc.id}
                              onClick={() =>
                                handleDisburseRental(
                                  rc.userId,
                                  rc.id,
                                  rc.agentName,
                                  rc.agentNetCommission || 0
                                )
                              }
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                            >
                              Mark Settled
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ALL UPLOADED PROPERTIES & CONNECTS */}
      {activeTab === "properties" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                All Uploaded Properties ({listings.length})
              </h2>
              <p className="text-xs text-gray-500">
                Every live property uploaded to CribConnect and its real-time student Connect metrics.
              </p>
            </div>
            <Link
              href="/list-property"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
            >
              + Upload Property
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Building2 className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-900">No properties uploaded yet</p>
              <Link
                href="/list-property"
                className="inline-block px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Upload First Property
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold text-gray-500 uppercase">
                    <th className="py-3 px-4">Property</th>
                    <th className="py-3 px-4">Uploaded By</th>
                    <th className="py-3 px-4">Annual Rent</th>
                    <th className="py-3 px-4">Connects (Views / WhatsApp)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {listings.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50/60">
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900">{l.title}</div>
                        <div className="text-[11px] text-gray-500">
                          {l.neighborhood} · {l.propertyType}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900">{l.agentName}</div>
                        <div className="text-[11px] text-gray-500">{l.agencyName}</div>
                      </td>
                      <td className="py-4 px-4 font-bold text-gray-900">
                        ₦{(l.price || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-900">
                          👁 {l.viewsCount || 1} Views
                        </span>
                        <span className="mx-2 text-gray-300">·</span>
                        <span className="font-semibold text-emerald-700">
                          💬 {l.whatsappClicksCount || 0} WhatsApp Connects
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            l.isAvailable
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {l.isAvailable ? "Available" : "Rented"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <Link
                          href={`/listings/${l.id}`}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDeleteListing(l.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-semibold"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
