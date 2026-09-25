"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  UserCheck,
  FileText,
  Clock,
  ExternalLink,
  ShieldAlert,
  Users,
} from "lucide-react";

export default function AdminPage() {
  const { currentUser, switchPersona } = useApp();

  const [agents, setAgents] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [resAgents, resReports] = await Promise.all([
        fetch("/api/admin/agents"),
        fetch("/api/admin/reports"),
      ]);
      const dataAgents = await resAgents.json();
      const dataReports = await resReports.json();
      if (dataAgents.agents) setAgents(dataAgents.agents);
      if (dataReports.reports) setReports(dataReports.reports);
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [currentUser]);

  const handleVerifyAgent = async (
    agentProfileId: string,
    action: "APPROVE" | "REJECT"
  ) => {
    setActionLoadingId(agentProfileId);
    try {
      const res = await fetch("/api/admin/verify-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentProfileId,
          action,
          notes:
            action === "APPROVE"
              ? "Official government NIN & photo ID checked and approved by platform admin."
              : "Insufficient proof of physical office in Akoka/Yaba.",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateReport = async (reportId: string, status: string) => {
    setActionLoadingId(reportId);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          status,
          adminNotes: "Moderated by CribConnect Trust & Safety Lead.",
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // If current persona is not admin, show helper card
  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">
          Admin Portal Access Restricted
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
          You are currently signed in as <strong>{currentUser?.name}</strong> ({currentUser?.role}).
          To test agent document approval, listing moderation, and dispute screening, click the button below to switch to the Platform Admin persona.
        </p>
        <button
          onClick={() => switchPersona("admin-tola")}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          Switch to Tola Balogun (Trust & Safety Admin)
        </button>
      </div>
    );
  }

  const pendingAgents = agents.filter((a) => a.verificationStatus === "PENDING");
  const verifiedAgents = agents.filter((a) => a.verificationStatus === "VERIFIED");
  const pendingReports = reports.filter((r) => r.status === "PENDING");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 rounded-3xl p-6 sm:p-10 text-white border border-red-900/40 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Trust & Safety Compliance Panel</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
          Platform Administration & Moderation
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Screen incoming real estate agent credentials, inspect submitted government NIN identity records, validate student scam reports, and ensure quality control across all campus rental listings.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-400 text-xs font-semibold uppercase">
            Pending Agent Approvals
          </span>
          <div className="text-2xl font-black text-amber-600">
            {pendingAgents.length}
          </div>
          <span className="text-[11px] text-slate-500">Awaiting document inspection</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-400 text-xs font-semibold uppercase">
            Verified Agents
          </span>
          <div className="text-2xl font-black text-emerald-600">
            {verifiedAgents.length}
          </div>
          <span className="text-[11px] text-slate-500">ID & NIN confirmed</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-400 text-xs font-semibold uppercase">
            Trust & Safety Reports
          </span>
          <div className="text-2xl font-black text-red-600">
            {pendingReports.length}
          </div>
          <span className="text-[11px] text-slate-500">Community safety flags</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-400 text-xs font-semibold uppercase">
            Total Agents Onboarded
          </span>
          <div className="text-2xl font-black text-slate-900">
            {agents.length}
          </div>
          <span className="text-[11px] text-slate-500">UNILAG / Yaba hub</span>
        </div>
      </div>

      {/* Queue 1: Pending Agent Verification Approvals */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Agent ID Verification Queue</span>
              {pendingAgents.length > 0 && (
                <span className="text-xs bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full">
                  {pendingAgents.length} Pending
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Inspect submitted National Identity Number (NIN) and government ID photo proofs before conferring official verified badges.
            </p>
          </div>
        </div>

        {pendingAgents.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <div className="font-bold text-slate-800">All agent applications processed</div>
            <p className="text-[11px]">No pending verification requests in the queue.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingAgents.map((prof) => (
              <div
                key={prof.id}
                className="p-5 rounded-2xl border border-amber-200 bg-amber-50/20 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        prof.user.avatar ||
                        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120"
                      }
                      alt={prof.user.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-300"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        {prof.user.name}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {prof.agencyName || "Independent Realtor"} • {prof.user.email}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full self-start sm:self-auto">
                    Awaiting Compliance Inspection
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Submitted NIN
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {prof.ninNumber || "NIN-99128374655"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Coverage Axis
                    </span>
                    <span className="font-medium text-slate-800">
                      {prof.campusSpecialization || "UNILAG / Yaba"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      ID Document Scanned Proof
                    </span>
                    <a
                      href={prof.idDocumentUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Inspect Scanned ID</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {prof.bio && (
                  <p className="text-xs text-slate-600 italic">
                    &quot;{prof.bio}&quot;
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-amber-200/60">
                  <button
                    type="button"
                    disabled={actionLoadingId === prof.id}
                    onClick={() => handleVerifyAgent(prof.id, "REJECT")}
                    className="px-4 py-2 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Application</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionLoadingId === prof.id}
                    onClick={() => handleVerifyAgent(prof.id, "APPROVE")}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Grant Verified Badge</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Queue 2: Trust & Safety Reports Queue */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Community Trust & Scam Reports</span>
              {pendingReports.length > 0 && (
                <span className="text-xs bg-red-100 text-red-800 font-extrabold px-2 py-0.5 rounded-full">
                  {pendingReports.length} Active Flag
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Student complaints regarding inspection fee requests, fake photos, or unverified agents.
            </p>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500">
            No community reports submitted.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      Reported: {rep.targetType} ({rep.targetId})
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        rep.status === "PENDING"
                          ? "bg-red-100 text-red-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>
                  <div className="font-semibold text-red-700">
                    Reason: {rep.reason}
                  </div>
                  {rep.details && (
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      &quot;{rep.details}&quot;
                    </p>
                  )}
                  <div className="text-[10px] text-slate-400">
                    Flagged by {rep.reporter?.name || "Student"} on{" "}
                    {new Date(rep.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {rep.status === "PENDING" && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      disabled={actionLoadingId === rep.id}
                      onClick={() => handleUpdateReport(rep.id, "DISMISSED")}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      disabled={actionLoadingId === rep.id}
                      onClick={() => handleUpdateReport(rep.id, "RESOLVED")}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                    >
                      Mark Resolved
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registered Agents Overview Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          All Platform Agents ({agents.length})
        </h2>
        <div className="divide-y divide-slate-100 text-xs">
          {agents.map((ag) => (
            <div
              key={ag.id}
              className="py-3 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    ag.user?.avatar ||
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80"
                  }
                  alt={ag.user?.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <span className="font-bold text-slate-900">{ag.user?.name}</span>
                  <span className="text-[11px] text-slate-500 block">
                    {ag.agencyName || "Independent"} • Tier: <strong>{ag.tier}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                    ag.verificationStatus === "VERIFIED"
                      ? "bg-emerald-100 text-emerald-800"
                      : ag.verificationStatus === "PENDING"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {ag.verificationStatus}
                </span>
                <span className="text-[11px] text-amber-600 font-bold">
                  ★ {ag.rating.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
