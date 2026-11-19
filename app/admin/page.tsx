"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  ShieldCheck,
  CheckCircle2,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Lock,
  Landmark,
  RefreshCw,
  PlusCircle,
  AlertTriangle,
  Flag,
} from "lucide-react";

export default function AdminPage() {
  const { currentUser, sessionReady } = useApp();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<"unauthenticated" | "forbidden" | null>(null);
  const [activeTab, setActiveTab] = useState<"providers" | "payouts" | "properties" | "reports">(
    "providers"
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showNotice = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      if (res.status === 401) {
        setAuthError("unauthenticated");
        setData(null);
        return;
      }
      if (res.status === 403) {
        setAuthError("forbidden");
        setData(null);
        return;
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        showNotice(json.error || "Failed to load admin overview.", true);
      }
    } catch (err) {
      console.error("Failed to load founder overview", err);
      showNotice("Network error while loading admin overview.", true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionReady) {
      fetchOverview();
    }
  }, [sessionReady, currentUser, fetchOverview]);

  const runAdminAction = async (
    loadingKey: string,
    payload: Record<string, any>,
    successMsg: string
  ) => {
    setActionLoading(loadingKey);
    try {
      const res = await fetch("/api/admin/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        showNotice(successMsg);
        await fetchOverview();
      } else {
        showNotice(json.error || "Admin action failed.", true);
      }
    } catch {
      showNotice("Network error performing admin action.", true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteListing = async (listingId: string, title: string) => {
    if (!window.confirm(`Remove property "${title}"? This action cannot be undone.`)) {
      return;
    }
    await runAdminAction(
      listingId,
      { action: "DELETE_LISTING", listingId },
      "Property listing removed."
    );
  };

  if (authError === "unauthenticated") {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Admin Sign-In Required</h1>
        <p className="text-xs text-gray-500 leading-relaxed">
          The CribConnect Founder &amp; Admin Portal is restricted to verified administrators. Sign
          in with your administrator account to continue.
        </p>
        <Link
          href="/auth/login?next=/admin"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
        >
          Sign In as Admin
        </Link>
      </div>
    );
  }

  if (authError === "forbidden") {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-red-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Admin Access Restricted</h1>
        <p className="text-xs text-gray-500 leading-relaxed">
          Your signed-in account ({currentUser?.email}) does not have administrator privileges. If
          you are the platform founder, ensure your email is configured in{" "}
          <code className="bg-gray-100 px-1 py-0.5 rounded">ADMIN_EMAILS</code>.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-colors"
        >
          Return Home
        </Link>
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
    pendingReportsCount: 0,
  };

  const providers: any[] = data?.providers || [];
  const listings: any[] = data?.listings || [];
  const escrows: any[] = data?.escrows || [];
  const rentalCommissions: any[] = data?.rentalCommissions || [];
  const reports: any[] = data?.reports || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold ${
            toast.isError
              ? "bg-red-900 text-white border-red-700"
              : "bg-gray-900 text-white border-gray-700"
          }`}
        >
          {toast.isError ? (
            <AlertTriangle className="w-4 h-4 text-red-300 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Founder Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>CribConnect Founder &amp; Admin Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Agents, House Owners, Connects &amp; Commissions
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
            Monitor every registered Agent and House Owner, review scam reports, track real-time
            student Connects across UNIPORT, and manage 90/10 Escrow and 80/20 Agency Commission
            bank payouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
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
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Agents &amp; House Owners
            </span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{kpis.totalProvidersCount}</div>
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold">
              {kpis.totalAgentsCount} Agents
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold">
              {kpis.totalOwnersCount} House Owners
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
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
            {kpis.totalViews} Views · {kpis.totalWhatsappClicks} WhatsApp · {kpis.totalInspections}{" "}
            Inspections · {kpis.totalEscrows} Escrows
          </p>
        </div>

        <div className="bg-emerald-50/30 p-5 rounded-xl border border-emerald-200 shadow-sm space-y-2">
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
            ₦{kpis.platformEscrowRevenue.toLocaleString()} Escrow (10%) + ₦
            {kpis.platformAgencyRevenue.toLocaleString()} Agency Cut (20%)
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
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
            Awaiting transfer · ₦{kpis.escrowVaultBalance.toLocaleString()} currently locked in
            Escrow
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
              When a student enters the 4-digit release PIN after inspection,{" "}
              <strong>CribConnect keeps 10% (₦1,000)</strong> and{" "}
              <strong>₦9,000 (90%)</strong> is approved for the Agent/Owner&apos;s bank.
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
              On every completed house rental (10% Agency Fee),{" "}
              <strong>CribConnect earns 20% of the Agency Fee</strong> and the{" "}
              <strong>Agent/Owner receives 80%</strong>.
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
              Release PINs stay private to the student. Once released, transfer to the
              agent&apos;s saved NUBAN and click <strong>Mark Paid to Bank</strong> below.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("providers")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "providers"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Agents &amp; House Owners ({providers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payouts")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "payouts"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>Commission &amp; Payout Ledger ({escrows.length + rentalCommissions.length})</span>
        </button>

        <button
          type="button"
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

        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "reports"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Scam Reports ({reports.length})</span>
          {kpis.pendingReportsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px]">
              {kpis.pendingReportsCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: AGENTS & HOUSE OWNERS DIRECTORY */}
      {activeTab === "providers" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">
              Registered Agents &amp; House Owners
            </h2>
            <p className="text-xs text-gray-500">
              Approve or revoke verification badges, monitor student connects, and inspect bank
              payout accounts.
            </p>
          </div>

          {providers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-900">
                No Agents or House Owners registered yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Agent / Owner</th>
                    <th className="py-3.5 px-4">Role &amp; NIN</th>
                    <th className="py-3.5 px-4">Properties</th>
                    <th className="py-3.5 px-4">Student Connects Funnel</th>
                    <th className="py-3.5 px-4">Payout Bank Account</th>
                    <th className="py-3.5 px-4">Commission &amp; Payouts</th>
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

                      <td className="py-4 px-4 space-y-1">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.role === "LANDLORD"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {p.role === "LANDLORD" ? "HOUSE OWNER" : "AGENT"}
                        </span>
                        {p.ninOrLicense && (
                          <div className="text-[10px] font-mono text-gray-500">
                            ID: {p.ninOrLicense}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 font-bold text-gray-900">
                        {p.listingsCount} {p.listingsCount === 1 ? "Crib" : "Cribs"}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900">
                          {p.totalConnects} Total Connects
                        </div>
                        <div className="text-[11px] text-gray-500 flex flex-wrap gap-2 mt-0.5">
                          <span>{p.viewsCount} Views</span>
                          <span>· {p.whatsappConnects} WhatsApp</span>
                          <span>· {p.inspectionsCount} Inspections</span>
                          <span>· {p.escrowsCount} Escrows</span>
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
                          Pending Transfer: ₦{(p.pendingBankPayout || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-emerald-700">
                          Paid Out: ₦{(p.paidBankPayout || 0).toLocaleString()}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          disabled={actionLoading === p.id}
                          onClick={() =>
                            runAdminAction(
                              p.id,
                              {
                                action: "TOGGLE_VERIFY_USER",
                                userId: p.id,
                                isVerified: !p.isVerified,
                              },
                              p.isVerified
                                ? `Revoked verification badge for ${p.name}.`
                                : `Approved Verified badge for ${p.name}!`
                            )
                          }
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                            p.isVerified
                              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          {p.isVerified ? "Verified (Revoke)" : "Approve Badge"}
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                1. Escrow Reservation Payouts (₦10,000 Hold → ₦1,000 CribConnect / ₦9,000 Agent or
                Owner)
              </h2>
              <p className="text-xs text-gray-500">
                Confirm bank transfers when received, and mark payouts Paid once the student
                releases funds with their private 4-digit PIN.
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
                      <th className="py-3 px-4">Property &amp; Student</th>
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
                          <div className="text-[10px] font-mono text-gray-500">
                            Ref: {e.paystackReference}
                          </div>
                          {e.senderBankName && (
                            <div className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">
                              Sent from: <strong>{e.senderBankName}</strong> ({e.senderAccountName})
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 font-semibold text-gray-900">{e.agentName}</td>

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
                          <div>
                            Total Deposit: <strong>₦{(e.amount || 10000).toLocaleString()}</strong>
                          </div>
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
                                : e.status === "DISPUTED"
                                ? "bg-orange-50 text-orange-800 border border-orange-200"
                                : e.status === "AWAITING_PAYMENT_CONFIRMATION"
                                ? "bg-blue-50 text-blue-800 border border-blue-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {e.status === "RELEASED_TO_AGENT"
                              ? "PIN VERIFIED · RELEASED"
                              : e.status === "REFUNDED_TO_STUDENT"
                              ? "REFUNDED TO STUDENT"
                              : e.status === "DISPUTED"
                              ? "DISPUTED · UNDER REVIEW"
                              : e.status === "AWAITING_PAYMENT_CONFIRMATION"
                              ? "AWAITING BANK RECEIPT VERIFICATION"
                              : "LOCKED IN ESCROW · AWAITING STUDENT PIN"}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right">
                          {e.status === "AWAITING_PAYMENT_CONFIRMATION" ? (
                            <button
                              type="button"
                              disabled={actionLoading === e.id}
                              onClick={() =>
                                runAdminAction(
                                  e.id,
                                  { action: "CONFIRM_ESCROW_PAYMENT", escrowId: e.id },
                                  `Confirmed bank receipt from ${e.studentName}! Their 4-digit Release PIN is now unlocked.`
                                )
                              }
                              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                            >
                              Confirm ₦{(e.amount || 10000).toLocaleString()} Bank Receipt
                            </button>
                          ) : e.status === "RELEASED_TO_AGENT" ? (
                            e.payoutStatus === "PAID_TO_BANK" ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Paid to Bank
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={actionLoading === e.id}
                                onClick={() =>
                                  runAdminAction(
                                    e.id,
                                    { action: "DISBURSE_ESCROW", escrowId: e.id },
                                    `Marked ₦${(e.agentPayout || 9000).toLocaleString()} escrow payout as sent to ${e.agentName}'s bank.`
                                  )
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

          {/* Section B: Closed Rental Agency Commissions */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                2. Closed Rental Agency Fee Commissions (20% CribConnect / 80% Agent or Owner)
              </h2>
              <p className="text-xs text-gray-500">
                Tracks every completed student rental and the 80/20 commission split on the 10%
                Agency Fee.
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
                      <th className="py-3 px-4">Property &amp; Tenant</th>
                      <th className="py-3 px-4">Agent / Owner</th>
                      <th className="py-3 px-4">Annual Rent &amp; 10% Fee</th>
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
                          <div>
                            Rent: <strong>₦{(rc.amount || 0).toLocaleString()}</strong>
                          </div>
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
                              type="button"
                              disabled={actionLoading === rc.id}
                              onClick={() =>
                                runAdminAction(
                                  rc.id,
                                  {
                                    action: "DISBURSE_RENTAL",
                                    userId: rc.userId,
                                    rentalId: rc.id,
                                  },
                                  `Marked ₦${(rc.agentNetCommission || 0).toLocaleString()} agency commission as settled for ${rc.agentName}.`
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

      {/* TAB 3: ALL UPLOADED PROPERTIES */}
      {activeTab === "properties" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                All Uploaded Properties ({listings.length})
              </h2>
              <p className="text-xs text-gray-500">
                Every live property uploaded to CribConnect and its real-time student Connect
                metrics.
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
                          {l.viewsCount ?? 0} Views
                        </span>
                        <span className="mx-2 text-gray-300">·</span>
                        <span className="font-semibold text-emerald-700">
                          {l.whatsappClicksCount ?? 0} WhatsApp Connects
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
                          type="button"
                          disabled={actionLoading === l.id}
                          onClick={() => handleDeleteListing(l.id, l.title)}
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

      {/* TAB 4: SCAM & SAFETY REPORTS */}
      {activeTab === "reports" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">
              Scam &amp; Safety Reports ({reports.length})
            </h2>
            <p className="text-xs text-gray-500">
              Review flagged listings and suspicious agent accounts reported by students.
            </p>
          </div>

          {reports.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Flag className="w-9 h-9 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-900">No scam reports filed</p>
              <p className="text-xs text-gray-500">All clear across the marketplace.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold text-gray-500 uppercase">
                    <th className="py-3 px-4">Target</th>
                    <th className="py-3 px-4">Reason &amp; Details</th>
                    <th className="py-3 px-4">Reporter</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/60">
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-bold">
                          {r.targetType}
                        </span>
                        <div className="font-mono text-[11px] text-gray-600 mt-1">
                          {r.targetType === "LISTING" ? (
                            <Link
                              href={`/listings/${r.targetId}`}
                              className="text-emerald-700 hover:underline"
                            >
                              {r.targetId}
                            </Link>
                          ) : (
                            <Link
                              href={`/agents/${r.targetId}`}
                              className="text-emerald-700 hover:underline"
                            >
                              {r.targetId}
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 max-w-sm">
                        <div className="font-bold text-gray-900">{r.reason}</div>
                        {r.details && (
                          <div className="text-[11px] text-gray-500 mt-0.5">{r.details}</div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900">{r.reporterName}</div>
                        <div className="text-[11px] text-gray-500">{r.reporterEmail}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === "RESOLVED"
                              ? "bg-emerald-50 text-emerald-700"
                              : r.status === "DISMISSED"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        {r.status === "PENDING" ? (
                          <>
                            <button
                              type="button"
                              disabled={actionLoading === r.id}
                              onClick={() =>
                                runAdminAction(
                                  r.id,
                                  { action: "UPDATE_REPORT", reportId: r.id, status: "RESOLVED" },
                                  "Report marked as resolved."
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            >
                              Resolve
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === r.id}
                              onClick={() =>
                                runAdminAction(
                                  r.id,
                                  { action: "UPDATE_REPORT", reportId: r.id, status: "DISMISSED" },
                                  "Report dismissed."
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                            >
                              Dismiss
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-gray-400">Reviewed</span>
                        )}
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
