"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { buildWhatsAppUrl } from "@/lib/types";
import {
  PlusCircle,
  Lock,
  ArrowRight,
  Trash2,
  Check,
  X,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

export default function AgentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"listings" | "bookings" | "escrow">("listings");
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [escrows, setEscrows] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [claimPin, setClaimPin] = useState<{ [id: string]: string }>({});
  const [claimingEscrowId, setClaimingEscrowId] = useState<string | null>(null);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setErrorMessage(null);
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/profile", { cache: "no-store" });
      if (res.status === 401) {
        setProfile(null);
        return;
      }
      const data = await res.json();
      if (res.ok && data?.profile) {
        setProfile(data.profile);
        setListings(data.profile.listings || []);
      }

      const [eRes, bRes] = await Promise.all([
        fetch("/api/escrow", { cache: "no-store" }),
        fetch("/api/bookings", { cache: "no-store" }),
      ]);

      if (eRes.ok) {
        const eData = await eRes.json();
        setEscrows(eData.escrows || []);
      }
      if (bRes.ok) {
        const bData = await bRes.json();
        setBookings(bData.bookings || []);
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("Could not load dashboard data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleClaimEscrow = async (escrowId: string) => {
    const pin = (claimPin[escrowId] || "").trim();
    if (!/^\d{4}$/.test(pin)) {
      setErrorMessage("Please enter the student's 4-digit Release PIN.");
      return;
    }
    setClaimingEscrowId(escrowId);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/escrow/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: escrowId, action: "RELEASE", pin }),
      });
      const data = await res.json();
      if (res.ok && data.escrow) {
        setEscrows((prev) => prev.map((e) => (e.id === escrowId ? data.escrow : e)));
        setClaimPin((prev) => ({ ...prev, [escrowId]: "" }));
        showNotice("Escrow PIN verified! Payout is queued for disbursement.");
      } else {
        setErrorMessage(data.error || "Invalid PIN or escrow cannot be released.");
      }
    } catch {
      setErrorMessage("Network error while verifying escrow PIN.");
    } finally {
      setClaimingEscrowId(null);
    }
  };

  const handleDeleteListing = async (listingId: string, title: string) => {
    if (!window.confirm(`Remove "${title}" permanently? This cannot be undone.`)) {
      return;
    }
    setDeletingListingId(listingId);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setListings((prev) => prev.filter((item) => item.id !== listingId));
        showNotice("Listing removed.");
      } else {
        setErrorMessage(data.error || "Could not delete listing.");
      }
    } catch {
      setErrorMessage("Network error while removing listing.");
    } finally {
      setDeletingListingId(null);
    }
  };

  const handleUpdateBookingStatus = async (
    id: string,
    status: "CONFIRMED" | "DECLINED",
    tenantPhone?: string,
    tenantName?: string,
    listingTitle?: string,
    preferredDate?: string
  ) => {
    setUpdatingBookingId(id);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
        showNotice(
          status === "CONFIRMED" ? "Inspection confirmed." : "Inspection request declined."
        );
        if (status === "CONFIRMED" && tenantPhone) {
          const waUrl = buildWhatsAppUrl(
            tenantPhone,
            `Hello ${tenantName || ""}, your inspection for "${
              listingTitle || "the property"
            }" on CribConnect is confirmed for ${preferredDate || "the scheduled date"}.`
          );
          if (waUrl) window.open(waUrl, "_blank", "noopener,noreferrer");
        }
      } else {
        setErrorMessage(data.error || "Could not update inspection status.");
      }
    } catch {
      setErrorMessage("Network error while updating booking.");
    } finally {
      setUpdatingBookingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center space-y-4">
          <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-800 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-base font-bold text-gray-900">Sign In Required</h1>
          <p className="text-xs text-gray-600">
            Sign in with your Agent or Landlord account to manage your listings, inspections, and escrow holds.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/auth/login"
              className="w-full py-2.5 px-4 rounded-lg bg-gray-900 hover:bg-emerald-700 text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/auth/register"
              className="w-full py-2 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium transition-colors"
            >
              Create Agent Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Compact Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={
              profile.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                profile.name || "A"
              )}&backgroundColor=63482E`
            }
            alt={profile.name}
            className="w-11 h-11 rounded-full object-cover border border-gray-300 bg-gray-100 shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-gray-900">{profile.name}</h1>
              {profile.isVerified && (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <p className="text-xs text-gray-500">
              {profile.agencyName || "Property Partner"} · {profile.phone || profile.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/agent/profile"
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium transition-colors"
          >
            Edit Profile
          </Link>
          <Link
            href="/list-property"
            className="px-3.5 py-2 rounded-lg bg-gray-900 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Property</span>
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Simple 3-Tab Switcher */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("listings")}
          className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "listings"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Listings ({listings.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("bookings")}
          className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "bookings"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Inspections ({bookings.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("escrow")}
          className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "escrow"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Escrow ({escrows.length})
        </button>
      </div>

      {/* Tab 1: My Listings */}
      {activeTab === "listings" && (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {listings.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm font-medium text-gray-800">
                No properties listed yet.
              </p>
              <Link
                href="/list-property"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-medium"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Post Your First Property</span>
              </Link>
            </div>
          ) : (
            listings.map((l) => (
              <div
                key={l.id}
                className="p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/listings/${l.id}`}
                    className="text-sm font-semibold text-gray-900 hover:underline truncate block"
                  >
                    {l.title}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {l.neighborhood} · ₦{(l.price || 0).toLocaleString()}/yr
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/listings/${l.id}`}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                    title="View"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    disabled={deletingListingId === l.id}
                    onClick={() => handleDeleteListing(l.id, l.title)}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 disabled:opacity-50"
                    title="Delete listing"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Inspections */}
      {activeTab === "bookings" && (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {bookings.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              No inspection requests yet.
            </div>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-gray-900">
                    {b.tenantName} · {b.tenantPhone}
                  </p>
                  <p className="text-xs text-gray-600">{b.listingTitle}</p>
                  <p className="text-xs text-gray-400">
                    {b.preferredDate} ({b.preferredTime}) · Status: {b.status}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {b.status === "PENDING" && (
                    <>
                      <button
                        type="button"
                        disabled={updatingBookingId === b.id}
                        onClick={() =>
                          handleUpdateBookingStatus(
                            b.id,
                            "CONFIRMED",
                            b.tenantPhone,
                            b.tenantName,
                            b.listingTitle,
                            b.preferredDate
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm</span>
                      </button>
                      <button
                        type="button"
                        disabled={updatingBookingId === b.id}
                        onClick={() => handleUpdateBookingStatus(b.id, "DECLINED")}
                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-700 text-xs font-medium flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Escrow Holds */}
      {activeTab === "escrow" && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
            <strong>How Escrow Release Works:</strong> Once you physically inspect the apartment with the student, ask them for their 4-digit Release PIN from their Escrow Tracker and enter it below to unlock disbursement.
          </div>

          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {escrows.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                No active escrow reservations yet.
              </div>
            ) : (
              escrows.map((e) => (
                <div
                  key={e.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-gray-900">
                      {e.listingTitle}
                    </p>
                    <p className="text-xs text-gray-600">
                      Tenant: {e.studentName} ({e.studentPhone}) · ₦
                      {(e.amount || 10000).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      Status: {e.status}
                      {e.expiresAt
                        ? ` · Window ends ${new Date(e.expiresAt).toLocaleString()}`
                        : ""}
                    </p>
                  </div>

                  {e.status === "HELD_IN_ESCROW" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="4-digit PIN"
                        value={claimPin[e.id] || ""}
                        onChange={(ev) =>
                          setClaimPin({
                            ...claimPin,
                            [e.id]: ev.target.value.replace(/\D/g, "").slice(0, 4),
                          })
                        }
                        className="w-24 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 text-center font-mono"
                      />
                      <button
                        type="button"
                        disabled={claimingEscrowId === e.id}
                        onClick={() => handleClaimEscrow(e.id)}
                        className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium"
                      >
                        {claimingEscrowId === e.id ? "Checking..." : "Claim Payout"}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
