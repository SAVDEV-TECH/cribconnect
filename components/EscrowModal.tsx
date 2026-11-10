"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  Calendar,
  MessageCircle,
  RotateCcw,
  KeyRound,
} from "lucide-react";

declare global {
  interface Window {
    PaystackPop?: any;
  }
}

interface EscrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    id: string;
    title: string;
    price: number;
    neighborhood: string;
    agentName: string;
    agentPhone?: string;
    agentWhatsapp?: string;
  };
}

export default function EscrowModal({ isOpen, onClose, listing }: EscrowModalProps) {
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [inspectionDate, setInspectionDate] = useState(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().split("T")[0]
  );
  const [inspectionTime, setInspectionTime] = useState("11:00 AM - 1:00 PM");
  const [amount, setAmount] = useState(10000); // ₦10,000 holding deposit

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successEscrow, setSuccessEscrow] = useState<any | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  // Post-escrow action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

  const handleCreateEscrow = async (reference: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/escrow/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          studentName,
          studentEmail,
          studentPhone,
          inspectionDate,
          inspectionTime,
          amount,
          paystackReference: reference,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create escrow deposit");
      }

      setSuccessEscrow(data.escrow);
      setWhatsappUrl(data.whatsappUrl);
    } catch (err: any) {
      setError(err.message || "Failed to finalize escrow reservation");
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !studentEmail || !studentPhone || !inspectionDate) {
      setError("Please fill in all your inspection details.");
      return;
    }

    setLoading(true);
    setError(null);

    // If live Paystack public key is present and script loaded:
    if (typeof window !== "undefined" && window.PaystackPop && paystackKey) {
      try {
        const handler = window.PaystackPop.setup({
          key: paystackKey,
          email: studentEmail.trim(),
          amount: amount * 100, // amount in kobo
          currency: "NGN",
          ref: "CRIB_ESCROW_" + Date.now().toString(36).toUpperCase(),
          metadata: {
            custom_fields: [
              { display_name: "Listing", variable_name: "listing_title", value: listing.title },
              { display_name: "Student Name", variable_name: "student_name", value: studentName },
              { display_name: "Inspection Date", variable_name: "inspection_date", value: inspectionDate },
            ],
          },
          callback: function (response: any) {
            handleCreateEscrow(response.reference);
          },
          onClose: function () {
            setLoading(false);
          },
        });
        handler.openIframe();
      } catch (err: any) {
        console.warn("Paystack popup failed, falling back to direct escrow:", err);
        handleCreateEscrow("PAYSTACK_SANDBOX_" + Date.now());
      }
    } else {
      // Instant Sandbox / Direct Escrow checkout
      handleCreateEscrow("CRIB_ESCROW_DIR_" + Date.now().toString(36).toUpperCase());
    }
  };

  const handleEscrowAction = async (action: "RELEASE" | "REFUND") => {
    if (!successEscrow) return;
    setActionLoading(true);
    setActionNotice(null);

    try {
      const res = await fetch("/api/escrow/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: successEscrow.id,
          action,
          pin: successEscrow.releasePin,
          reason: action === "REFUND" ? "Tenant inspection was not satisfactory." : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      setSuccessEscrow(data.escrow);
      setActionNotice(data.message);
    } catch (err: any) {
      setError(err.message || "Failed to process escrow action");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 border border-gray-200 shadow-xl my-8">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Reserve with Escrow Protection
              </h2>
              <p className="text-xs text-gray-500">
                Lock property for 48 hours &middot; 100% money-back guarantee
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {actionNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
        )}

        {!successEscrow ? (
          /* STEP 1: Details & Paystack Holding Deposit Form */
          <form onSubmit={handlePaystackCheckout} className="space-y-4">
            {/* Listing Summary */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 block">
                Selected Accommodation:
              </span>
              <p className="text-sm font-bold text-gray-900 truncate">{listing.title}</p>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <span>Annual Rent: ₦{listing.price.toLocaleString()}/yr</span>
                <span>Area: {listing.neighborhood}</span>
              </div>
            </div>

            {/* How Holding Escrow Works */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 space-y-1.5 text-xs text-emerald-900">
              <span className="font-bold flex items-center gap-1.5 text-emerald-950">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                How Escrow Protection Works:
              </span>
              <ul className="space-y-1 text-[11px] text-emerald-800 pl-1">
                <li>• <strong>48-Hour Lock:</strong> Agent cannot rent or promise this room to any other student for 48 hours.</li>
                <li>• <strong>Money Held Safely:</strong> CribConnect holds your ₦10,000. It is <strong>NOT</strong> paid to the agent until you inspect.</li>
                <li>• <strong>100% Refundable:</strong> If the house is fake, unavailable, or doesn't match the photos, tap 1 button for a full refund.</li>
                <li>• <strong>Credited to Rent:</strong> If you accept the house, this ₦10,000 counts directly towards your rent.</li>
              </ul>
            </div>

            {/* Student Contact Information */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chisom Okereke"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="student@uniport.edu.ng"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    WhatsApp Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="08034452299"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Inspection Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Scheduled Inspection Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Preferred Time Window
                  </label>
                  <select
                    value={inspectionTime}
                    onChange={(e) => setInspectionTime(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="9:00 AM - 11:00 AM">Morning (9:00 AM - 11:00 AM)</option>
                    <option value="11:00 AM - 1:00 PM">Midday (11:00 AM - 1:00 PM)</option>
                    <option value="1:00 PM - 3:00 PM">Afternoon (1:00 PM - 3:00 PM)</option>
                    <option value="3:00 PM - 5:30 PM">Late Afternoon (3:00 PM - 5:30 PM)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Total Deposit Breakdown */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-600">Holding Escrow Deposit:</span>
              <span className="font-bold text-gray-900 text-sm">₦{amount.toLocaleString()}</span>
            </div>

            {/* Paystack Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? "Processing..." : `Pay ₦${amount.toLocaleString()} via Paystack (Escrow)`}</span>
            </button>
          </form>
        ) : (
          /* STEP 2: Active Escrow Pass & Release PIN */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-gray-900">
                Accommodation Locked for 48 Hours!
              </h3>
              <p className="text-xs text-gray-600">
                ₦{successEscrow.amount.toLocaleString()} is securely held in CribConnect Escrow.
              </p>
            </div>

            {/* Secret Release PIN */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center space-y-1.5">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Your Secret Inspection Release PIN:
              </span>
              <div className="text-2xl font-mono font-bold text-emerald-700 tracking-widest bg-white py-1.5 px-4 rounded-lg border border-gray-200 inline-block">
                {successEscrow.releasePin}
              </div>
              <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                ⚠️ <strong>Do NOT share this PIN yet.</strong> Only reveal this PIN or approve release after you have arrived and inspected the room physically.
              </p>
            </div>

            {/* Reservation Details */}
            <div className="text-xs text-gray-600 space-y-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Property:</span>
                <span className="font-semibold text-gray-800 truncate max-w-[200px]">{successEscrow.listingTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Agent:</span>
                <span className="font-semibold text-gray-800">{successEscrow.agentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Inspection:</span>
                <span className="font-semibold text-gray-800">{successEscrow.inspectionDate} ({successEscrow.inspectionTime})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-bold text-emerald-700">{successEscrow.status}</span>
              </div>
            </div>

            {/* WhatsApp notification button */}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Notify Agent on WhatsApp with Booking Code</span>
              </a>
            )}

            {/* Inspection Actions */}
            {successEscrow.status === "HELD_IN_ESCROW" && (
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <span className="text-xs font-semibold text-gray-700 block">
                  Post-Inspection Decision:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleEscrowAction("RELEASE")}
                    className="py-2.5 px-3 rounded-xl bg-gray-900 hover:bg-black text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Approve &amp; Release</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleEscrowAction("REFUND")}
                    className="py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Claim 100% Refund</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
