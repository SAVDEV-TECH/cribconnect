"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Building2,
  CheckCircle2,
  PlusCircle,
  Eye,
  Calendar,
  MessageCircle,
  Phone,
  ShieldCheck,
  Lock,
  KeyRound,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
  DollarSign,
  AlertCircle,
  Edit,
  XCircle,
  Check,
  Send,
} from "lucide-react";

export default function AgentDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [rentalsHistory, setRentalsHistory] = useState<any[]>([]);
  const [tenantsHousedCount, setTenantsHousedCount] = useState(0);

  // Escrow Reservations state
  const [escrows, setEscrows] = useState<any[]>([]);
  const [claimPin, setClaimPin] = useState<{ [id: string]: string }>({});
  const [claimingEscrowId, setClaimingEscrowId] = useState<string | null>(null);

  // Inspection Bookings state
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingFilter, setBookingFilter] = useState<"ALL" | "PENDING" | "CONFIRMED">("ALL");
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);

  // "Record a Rental / Tenant Housed" modal state
  const [showRentModal, setShowRentModal] = useState(false);
  const [selectedListingForRent, setSelectedListingForRent] = useState<any | null>(null);
  const [rentalTenantName, setRentalTenantName] = useState("");
  const [rentalAmount, setRentalAmount] = useState("");
  const [rentalDate, setRentalDate] = useState(new Date().toISOString().split("T")[0]);
  const [recordingRent, setRecordingRent] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/agent/profile");
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      const data = await res.json();
      if (data && data.profile) {
        setProfile(data.profile);
        setListings(data.profile.listings || []);
        setRentalsHistory(data.profile.rentalsHistory || []);
        setTenantsHousedCount(data.profile.tenantsHousedCount || 0);
      }

      // Fetch escrow deposits
      const eRes = await fetch("/api/escrow");
      if (eRes.ok) {
        const eData = await eRes.json();
        setEscrows(eData.escrows || []);
      }

      // Fetch inspections
      const bRes = await fetch("/api/bookings");
      if (bRes.ok) {
        const bData = await bRes.json();
        setBookings(bData.bookings || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimEscrow = async (escrowId: string) => {
    const pin = claimPin[escrowId];
    if (!pin) {
      alert("Please enter the 4-digit Inspection Release PIN given to you by the tenant.");
      return;
    }
    setClaimingEscrowId(escrowId);
    try {
      const res = await fetch("/api/escrow/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: escrowId, action: "RELEASE", pin }),
      });
      const data = await res.json();
      if (res.ok) {
        setEscrows((prev) => prev.map((e) => (e.id === escrowId ? data.escrow : e)));
        setSuccessMessage(data.message || "Escrow funds successfully released!");
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        alert(data.error || "Failed to release escrow");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClaimingEscrowId(null);
    }
  };

  const handleUpdateBookingStatus = async (
    id: string,
    status: "PENDING" | "CONFIRMED" | "DECLINED" | "COMPLETED",
    tenantPhone?: string,
    tenantName?: string,
    listingTitle?: string,
    preferredDate?: string,
    preferredTime?: string
  ) => {
    setUpdatingBookingId(id);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (res.ok) {
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
        setSuccessMessage(`Inspection status updated to ${status}!`);
        setTimeout(() => setSuccessMessage(null), 4000);

        // If confirming, launch WhatsApp to confirm time with student
        if (status === "CONFIRMED" && tenantPhone) {
          const cleanPhone = tenantPhone.replace(/\D/g, "");
          const intlPhone = cleanPhone.startsWith("0") ? "234" + cleanPhone.slice(1) : cleanPhone;
          const msg = encodeURIComponent(
            `Hello ${tenantName || "there"}! Your physical walkthrough for "${listingTitle || "the apartment"}" on CribConnect has been confirmed for ${preferredDate || "your requested date"} (${preferredTime || "scheduled time"}). See you then!`
          );
          window.open(`https://wa.me/${intlPhone}?text=${msg}`, "_blank");
        }
      }
    } catch (err) {
      console.error("Failed to update booking status:", err);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const handleConvertBookingToRental = (b: any) => {
    setRentalTenantName(b.tenantName);
    const matchingListing = listings.find((l) => l.id === b.listingId);
    setSelectedListingForRent(matchingListing || { id: b.listingId, title: b.listingTitle });
    setRentalAmount(matchingListing ? String(matchingListing.price) : "450000");
    setShowRentModal(true);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRecordRental = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecordingRent(true);

    try {
      const res = await fetch("/api/agent/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: selectedListingForRent?.id,
          propertyTitle: selectedListingForRent?.title || "Rental Accommodation",
          neighborhood: selectedListingForRent?.neighborhood || "Choba",
          tenantName: rentalTenantName,
          amount: parseFloat(rentalAmount) || selectedListingForRent?.price || 450000,
          date: rentalDate,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setTenantsHousedCount(data.tenantsHousedCount);
        setRentalsHistory(data.rentalsHistory || []);
        setShowRentModal(false);
        setRentalTenantName("");
        setRentalAmount("");
        setSelectedListingForRent(null);
        setSuccessMessage("🎉 Congratulations! Another student/tenant successfully housed!");
        setTimeout(() => setSuccessMessage(null), 5000);

        // Update local listings state
        if (selectedListingForRent) {
          setListings((prev) =>
            prev.map((l) => (l.id === selectedListingForRent.id ? { ...l, isAvailable: false } : l))
          );
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRecordingRent(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const activeListingsCount = listings.filter((l) => l.isAvailable).length;
  const totalDealVolume = rentalsHistory.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const pendingBookingsCount = bookings.filter((b) => b.status === "PENDING").length;
  const confirmedBookingsCount = bookings.filter((b) => b.status === "CONFIRMED").length;

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === "PENDING") return b.status === "PENDING";
    if (bookingFilter === "CONFIRMED") return b.status === "CONFIRMED";
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner & Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={profile?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"}
            alt={profile?.name}
            className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{profile?.name}</h1>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium">
              {profile?.agencyName || "Verified Housing Specialist"} • {profile?.role}
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              📍 Specialization: {profile?.specializations || "UNIPORT, Choba, Rumuola"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/agent/profile"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile & Photo</span>
          </Link>

          <Link
            href="/list-property"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ List New Crib</span>
          </Link>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* KPI METRICS (Including Tenants Housed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Main Metric: How many people they have rented house for */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Primary Achievement
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {tenantsHousedCount}
            </h3>
            <p className="text-xs text-gray-500">
              Tenants & Students Housed
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between text-[11px] text-emerald-700 font-medium border-t border-gray-100 mt-2">
            <span>Verified Rentals Completed</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        {/* Total Deal Volume */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Total Volume Closed
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
              ₦{totalDealVolume.toLocaleString()}
            </h3>
            <p className="text-xs text-gray-500 font-medium">Rental payments facilitated</p>
          </div>
          <div className="pt-4 flex items-center justify-between text-[11px] text-gray-400 font-medium">
            <span>Annual Rent Handled</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        {/* Active Listings */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Current Inventory
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {activeListingsCount}
            </h3>
            <p className="text-xs text-gray-500 font-medium">Active Cribs live on site</p>
          </div>
          <div className="pt-4 flex items-center justify-between text-[11px] text-gray-400 font-medium">
            <span>Available for inspection</span>
            <Building2 className="w-4 h-4 text-gray-500" />
          </div>
        </div>

        {/* Rating & Trust */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Student Trust Score
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
              4.9 / 5.0
            </h3>
            <p className="text-xs text-gray-500 font-medium">100% Zero-Scam Record</p>
          </div>
          <div className="pt-4 flex items-center justify-between text-[11px] text-emerald-700 font-bold">
            <span>NIN Verified Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* QUICK ACTION: Record a Completed Rental */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
            <Sparkles className="w-3 h-3" />
            <span>Increase Your Credibility Badge</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Did you just rent a house to a student or newcomer?
          </h2>
          <p className="text-xs text-gray-600">
            Log the completed rental to update your public <strong>&quot;Tenants Housed&quot;</strong> counter and attract more clients.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedListingForRent(null);
            setShowRentModal(true);
          }}
          className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/30 flex items-center gap-2 shrink-0 transition-all"
        >
          <UserCheck className="w-4 h-4" />
          <span>+ Log Housed Tenant</span>
        </button>
      </div>

            {/* SECTION: Escrow Room Reservations & Holding Deposits */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                Escrow Reservations &amp; Holding Deposits ({escrows.length})
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                100% Protected
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Tenants who paid ₦10,000 to reserve your apartment for 48h physical inspection.
            </p>
          </div>
        </div>

        {escrows.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100 p-6 space-y-2">
            <Lock className="w-8 h-8 text-gray-400 mx-auto" />
            <h4 className="text-xs font-bold text-gray-800">No active escrow reservations yet</h4>
            <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
              When students lock your accommodation online with a ₦10,000 holding deposit, they appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {escrows.map((escrow) => {
              const isHeld = escrow.status === "HELD_IN_ESCROW";
              const isReleased = escrow.status === "RELEASED_TO_AGENT";

              return (
                <div
                  key={escrow.id}
                  className="p-5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-all space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold uppercase text-emerald-700 block">
                          Locked Property
                        </span>
                        <h4 className="font-bold text-sm text-gray-900 truncate">
                          {escrow.listingTitle}
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                          isHeld
                            ? "bg-amber-100 text-amber-800"
                            : isReleased
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {isHeld ? "Held in Escrow" : isReleased ? "Released to You" : "Refunded"}
                      </span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tenant:</span>
                        <span className="font-semibold text-gray-800">{escrow.studentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Inspection Time:</span>
                        <span className="font-semibold text-gray-800">{escrow.inspectionDate} ({escrow.inspectionTime})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Your Payout upon Approval:</span>
                        <span className="font-bold text-emerald-700">₦{(escrow.agentPayout || 9000).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {isHeld && (
                    <div className="pt-2 border-t border-gray-100 space-y-2">
                      <span className="text-[11px] text-gray-500 block">
                        Ask tenant for their <strong>4-digit Inspection Release PIN</strong> after they approve the room:
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="4-digit PIN"
                          value={claimPin[escrow.id] || ""}
                          onChange={(e) => setClaimPin({ ...claimPin, [escrow.id]: e.target.value })}
                          className="w-28 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-center tracking-widest focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={claimingEscrowId === escrow.id || !claimPin[escrow.id]}
                          onClick={() => handleClaimEscrow(escrow.id)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors disabled:opacity-50"
                        >
                          {claimingEscrowId === escrow.id ? "Verifying..." : "Claim ₦9,000"}
                        </button>
                      </div>
                    </div>
                  )}

                  {isReleased && (
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Funds Released &bull; Credited to tenant's annual rent.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION: Physical Inspection Inquiries & Walkthroughs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                Physical Inspection Inquiries ({bookings.length})
              </h2>
              {pendingBookingsCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                  {pendingBookingsCount} Action Needed
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Verified students and relocators requesting on-site apartment walkthroughs.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setBookingFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                bookingFilter === "ALL"
                  ? "bg-white text-emerald-800 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setBookingFilter("PENDING")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                bookingFilter === "PENDING"
                  ? "bg-white text-amber-800 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Pending ({pendingBookingsCount})
            </button>
            <button
              onClick={() => setBookingFilter("CONFIRMED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                bookingFilter === "CONFIRMED"
                  ? "bg-white text-emerald-800 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Confirmed ({confirmedBookingsCount})
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-gray-50 border border-gray-100 space-y-2">
            <Calendar className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-600">No inspection bookings in this filter.</p>
            <p className="text-[11px] text-gray-400">
              When students book walkthroughs on your listings, they will show up here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBookings.map((b) => {
              const cleanPhone = (b.tenantPhone || "").replace(/\D/g, "");
              const intlPhone = cleanPhone.startsWith("0") ? "234" + cleanPhone.slice(1) : cleanPhone;
              const waLink = `https://wa.me/${intlPhone}?text=${encodeURIComponent(
                `Hello ${b.tenantName}! Reaching out regarding your inspection request on CribConnect for "${b.listingTitle}".`
              )}`;

              return (
                <div
                  key={b.id}
                  className="p-5 rounded-xl border border-gray-200/90 hover:border-emerald-300 bg-white shadow-2xs transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Student Name + Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-sm flex items-center justify-center shrink-0 border border-emerald-200">
                          {b.tenantName ? b.tenantName.charAt(0).toUpperCase() : "S"}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-gray-900 leading-tight">
                            {b.tenantName}
                          </h3>
                          <span className="text-[11px] text-gray-500 font-medium">
                            📞 {b.tenantPhone}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          b.status === "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : b.status === "PENDING"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : b.status === "COMPLETED"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    {/* Listing Title */}
                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Requested Property
                      </span>
                      <Link
                        href={`/listings/${b.listingId}`}
                        className="text-xs font-bold text-gray-900 hover:text-emerald-700 line-clamp-1 block"
                      >
                        {b.listingTitle}
                      </Link>
                    </div>

                    {/* Inspection Date & Time */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 text-gray-700 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{b.preferredDate || "Any Day"}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 text-gray-700 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{b.preferredTime || "11am - 1pm"}</span>
                      </div>
                    </div>

                    {/* Student Message/Note */}
                    {b.message && (
                      <p className="text-xs text-gray-600 italic bg-gray-50/70 p-2.5 rounded-xl border border-gray-100/80">
                        &quot;{b.message}&quot;
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-2">
                    {b.status === "PENDING" ? (
                      <>
                        <button
                          disabled={updatingBookingId === b.id}
                          onClick={() =>
                            handleUpdateBookingStatus(
                              b.id,
                              "CONFIRMED",
                              b.tenantPhone,
                              b.tenantName,
                              b.listingTitle,
                              b.preferredDate,
                              b.preferredTime
                            )
                          }
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Confirm & Chat</span>
                        </button>

                        <button
                          disabled={updatingBookingId === b.id}
                          onClick={() => handleUpdateBookingStatus(b.id, "DECLINED")}
                          className="py-2 px-3 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-700 font-bold text-xs transition-colors"
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Chat on WhatsApp</span>
                        </a>

                        <button
                          onClick={() => handleConvertBookingToRental(b)}
                          className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors flex items-center gap-1"
                          title="If this student rented the apartment, log it to increase your housed tenants count"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Log Housed</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TWO COLUMN SECTION: Listings Manager + Housed Tenants History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Manage Properties (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              My Rental Listings ({listings.length})
            </h2>
            <Link
              href="/list-property"
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>+ Add Another</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-3">
              <Building2 className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-500">You haven&apos;t listed any properties yet.</p>
              <Link
                href="/list-property"
                className="inline-flex px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                List Your First Property
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((l) => (
                <div
                  key={l.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={
                        Array.isArray(l.photos) && l.photos[0]
                          ? l.photos[0]
                          : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200"
                      }
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover border border-gray-100 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            l.isAvailable
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {l.isAvailable ? "Available" : "Rented Out"}
                        </span>
                        <span className="text-xs font-bold text-gray-900">
                          ₦{(l.price || 0).toLocaleString()} / yr
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-gray-900 mt-1 line-clamp-1">
                        {l.title}
                      </h3>
                      <span className="text-[11px] text-gray-400 block">
                        📍 {l.neighborhood} • 🚶 {l.distanceDescription || "5m to Gate"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
                    {l.isAvailable && (
                      <button
                        onClick={() => {
                          setSelectedListingForRent(l);
                          setRentalAmount(String(l.price || ""));
                          setShowRentModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-bold transition-all"
                      >
                        Mark as Rented
                      </button>
                    )}
                    <Link
                      href={`/listings/${l.id}`}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                      title="View public listing"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Tenants Housed History (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <span>Tenants Housed ({rentalsHistory.length})</span>
            </h2>
          </div>

          {rentalsHistory.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-2">
              <Users className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-500">No completed rentals logged yet.</p>
              <button
                onClick={() => setShowRentModal(true)}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Log your first rental
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rentalsHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-900">{item.tenantName}</span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      ₦{(item.amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 font-medium">
                    🏠 {item.propertyTitle} ({item.neighborhood})
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                    <span>Housed on {item.date}</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Successfully Moved In
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Record a Tenant Housed */}
      {showRentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Record Housed Tenant</h3>
                <p className="text-xs text-gray-500">Boosts your Verified Agent public score</p>
              </div>
              <button
                onClick={() => setShowRentModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordRental} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tenant Name & Details *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chisom Okereke (UNIPORT Fresher)"
                  value={rentalTenantName}
                  onChange={(e) => setRentalTenantName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Property Housed *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Self-Contain on Jaja Street"
                  value={selectedListingForRent?.title || "Self-Contain in Choba"}
                  onChange={(e) => {
                    if (selectedListingForRent) {
                      setSelectedListingForRent({ ...selectedListingForRent, title: e.target.value });
                    }
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Annual Rent (₦) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 450000"
                    value={rentalAmount}
                    onChange={(e) => setRentalAmount(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Date Housed *
                  </label>
                  <input
                    type="date"
                    required
                    value={rentalDate}
                    onChange={(e) => setRentalDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={recordingRent}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all"
              >
                <span>{recordingRent ? "Recording..." : "Save Completed Rental"}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

