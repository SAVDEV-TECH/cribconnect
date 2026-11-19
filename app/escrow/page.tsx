"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  RotateCcw,
  RefreshCw,
  KeyRound,
  AlertCircle,
  Lock,
  ArrowRight,
  Flag,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getSavedEscrowReceipts, SavedEscrowReceipt } from "@/lib/client-auth";

interface TrackedEscrow {
  id: string;
  lookupToken?: string;
  listingId: string;
  listingTitle: string;
  neighborhood: string;
  agentName: string;
  studentName: string;
  amount: number;
  status: string;
  releasePin?: string;
  inspectionDate: string;
  inspectionTime?: string;
  expiresAt?: string;
  paystackReference: string;
  senderBankName?: string;
  transferSessionId?: string;
}

export default function EscrowTrackerPage() {
  const { currentUser, sessionReady } = useApp();
  const [escrows, setEscrows] = useState<TrackedEscrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinInputs, setPinInputs] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; isError?: boolean } | null>(null);

  const loadEscrows = useCallback(async () => {
    setLoading(true);
    try {
      const merged = new Map<string, TrackedEscrow>();
      const localReceipts: SavedEscrowReceipt[] = getSavedEscrowReceipts();

      // 1. Fetch live status for each locally saved receipt using its lookupToken
      await Promise.all(
        localReceipts.map(async (receipt) => {
          try {
            const qs = new URLSearchParams({ id: receipt.id, token: receipt.lookupToken });
            const res = await fetch(`/api/escrow/reserve?${qs.toString()}`, {
              cache: "no-store",
            });
            if (res.ok) {
              const data = await res.json();
              if (data.escrow) {
                merged.set(data.escrow.id, {
                  ...data.escrow,
                  lookupToken: receipt.lookupToken,
                });
              }
            }
          } catch {
            // Skip unavailable receipt
          }
        })
      );

      // 2. Also load escrows linked to the signed-in account
      if (currentUser) {
        try {
          const res = await fetch("/api/escrow", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.escrows)) {
              for (const item of data.escrows) {
                const existing = merged.get(item.id);
                merged.set(item.id, {
                  ...item,
                  lookupToken: existing?.lookupToken,
                  releasePin: existing?.releasePin || item.releasePin,
                });
              }
            }
          }
        } catch {
          // Ignore
        }
      }

      setEscrows(Array.from(merged.values()));
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (sessionReady) {
      loadEscrows();
    }
  }, [sessionReady, loadEscrows]);

  const handleAction = async (
    escrow: TrackedEscrow,
    action: "RELEASE" | "REFUND" | "DISPUTE"
  ) => {
    setNotice(null);
    const pin = (pinInputs[escrow.id] || "").trim();

    if (action === "RELEASE" && pin.length !== 4) {
      setNotice({ text: "Please enter your 4-digit Release PIN.", isError: true });
      return;
    }

    if (
      action === "REFUND" &&
      !window.confirm("Reject this property and request a 100% escrow refund?")
    ) {
      return;
    }

    setBusyId(escrow.id);
    try {
      const res = await fetch("/api/escrow/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: escrow.id,
          lookupToken: escrow.lookupToken,
          action,
          pin: action === "RELEASE" ? pin : undefined,
          reason:
            action === "REFUND"
              ? "Student requested 100% refund from Escrow Tracker."
              : action === "DISPUTE"
              ? "Student raised an escrow dispute for admin review."
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ text: data.error || "Could not complete escrow action.", isError: true });
      } else {
        setNotice({ text: data.message || "Escrow status updated." });
        await loadEscrows();
      }
    } catch {
      setNotice({ text: "Network error communicating with Escrow Vault.", isError: true });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>48-Hour Holding Escrow Vault</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">My Escrow Reservations</h1>
          <p className="text-xs text-gray-500">
            Track your bank transfer verification, view your unlocked 4-digit Release PIN, or
            request a 100% refund after inspection.
          </p>
        </div>

        <button
          type="button"
          onClick={loadEscrows}
          disabled={loading}
          className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            notice.isError
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {notice.isError ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-xs text-gray-500">
          Checking CribConnect Escrow Vault...
        </div>
      ) : escrows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h2 className="text-base font-bold text-gray-900">No Active Escrow Deposits Found</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              When you lock a room with our ₦10,000 48-hour holding deposit, your receipt and
              private Release PIN are saved automatically on this device and linked to your account.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/listings"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <span>Browse Apartments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            {!currentUser && (
              <Link
                href="/auth/login?next=/escrow"
                className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold"
              >
                Sign In to Sync Account
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {escrows.map((escrow) => (
            <div
              key={escrow.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/listings/${escrow.listingId}`}
                    className="text-base font-bold text-gray-900 hover:text-emerald-700"
                  >
                    {escrow.listingTitle}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {escrow.neighborhood} · Agent: {escrow.agentName} · Inspection:{" "}
                    {escrow.inspectionDate} {escrow.inspectionTime ? `(${escrow.inspectionTime})` : ""}
                  </p>
                  <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                    Ref: {escrow.paystackReference}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold self-start ${
                    escrow.status === "HELD_IN_ESCROW"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : escrow.status === "AWAITING_PAYMENT_CONFIRMATION"
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : escrow.status === "RELEASED_TO_AGENT"
                      ? "bg-blue-50 text-blue-800 border border-blue-200"
                      : escrow.status === "REFUNDED_TO_STUDENT"
                      ? "bg-gray-100 text-gray-700 border border-gray-200"
                      : "bg-orange-50 text-orange-800 border border-orange-200"
                  }`}
                >
                  {escrow.status.replace(/_/g, " ")}
                </span>
              </div>

              {/* Status & PIN box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-500 block">
                    Escrow Holding Deposit
                  </span>
                  <span className="text-lg font-extrabold text-gray-900">
                    ₦{(escrow.amount || 10000).toLocaleString()}
                  </span>
                  {escrow.expiresAt && escrow.status === "HELD_IN_ESCROW" && (
                    <span className="text-[11px] text-gray-500 block mt-0.5">
                      48h hold expires: {new Date(escrow.expiresAt).toLocaleString()}
                    </span>
                  )}
                </div>

                {escrow.releasePin && (
                  <div className="sm:text-right">
                    <span className="text-[10px] font-bold uppercase text-gray-500 block">
                      Your Secret Release PIN
                    </span>
                    <span className="inline-block mt-1 px-3 py-1 rounded-lg bg-white border border-gray-200 font-mono text-lg font-bold tracking-widest text-emerald-700">
                      {escrow.releasePin}
                    </span>
                  </div>
                )}
              </div>

              {escrow.status === "AWAITING_PAYMENT_CONFIRMATION" && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Waiting for CribConnect Escrow Vault to confirm your bank transfer. Click{" "}
                    <strong>Refresh Status</strong> above once verified to unlock your PIN.
                  </span>
                </div>
              )}

              {escrow.status === "HELD_IN_ESCROW" && (
                <div className="pt-3 border-t border-gray-100 space-y-2.5">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <KeyRound className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="Enter 4-digit Release PIN"
                        value={pinInputs[escrow.id] || ""}
                        onChange={(e) =>
                          setPinInputs((prev) => ({ ...prev, [escrow.id]: e.target.value }))
                        }
                        className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={busyId === escrow.id}
                      onClick={() => handleAction(escrow, "RELEASE")}
                      className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Approve &amp; Release to Agent</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === escrow.id}
                      onClick={() => handleAction(escrow, "REFUND")}
                      className="flex-1 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reject Property &amp; Request 100% Refund</span>
                    </button>
                    <button
                      type="button"
                      disabled={busyId === escrow.id}
                      onClick={() => handleAction(escrow, "DISPUTE")}
                      className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Raise Dispute</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
