"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  X,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  RotateCcw,
  Landmark,
  CreditCard,
  Copy,
  RefreshCw,
  Clock,
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

const ESCROW_VAULT_BANK = {
  bankName: process.env.NEXT_PUBLIC_ESCROW_BANK_NAME || "Moniepoint MFB / OPay Digital Bank",
  accountNumber: process.env.NEXT_PUBLIC_ESCROW_ACCOUNT_NUMBER || "8063345521",
  accountName: process.env.NEXT_PUBLIC_ESCROW_ACCOUNT_NAME || "CRIBCONNECT ESCROW VAULT",
};

const NIGERIAN_BANKS = [
  "OPay",
  "PalmPay",
  "Moniepoint MFB",
  "Kuda Bank",
  "Access Bank",
  "GTBank (Guaranty Trust Bank)",
  "Zenith Bank",
  "United Bank for Africa (UBA)",
  "First Bank of Nigeria",
  "Fidelity Bank",
  "FCMB",
  "Stanbic IBTC Bank",
  "Sterling Bank",
  "Union Bank",
  "Wema Bank / ALAT",
  "Polaris Bank",
  "Ecobank Nigeria",
  "Keystone Bank",
];

export default function EscrowModal({ isOpen, onClose, listing }: EscrowModalProps) {
  const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [inspectionDate, setInspectionDate] = useState(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().split("T")[0]
  );
  const [inspectionTime, setInspectionTime] = useState("11:00 AM - 1:00 PM");
  const [amount] = useState(10000); // ₦10,000 holding deposit

  // Real Payment Verification States
  const [paymentMethod, setPaymentMethod] = useState<"BANK_TRANSFER" | "PAYSTACK">(
    paystackKey ? "PAYSTACK" : "BANK_TRANSFER"
  );
  const [senderBankName, setSenderBankName] = useState("");
  const [senderAccountName, setSenderAccountName] = useState("");
  const [transferSessionId, setTransferSessionId] = useState("");
  const [copiedAccount, setCopiedAccount] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successEscrow, setSuccessEscrow] = useState<any | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  // Post-escrow action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [enteredReleasePin, setEnteredReleasePin] = useState("");
  const [refreshingStatus, setRefreshingStatus] = useState(false);

  if (!isOpen) return null;

  const handleCopyAccount = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(ESCROW_VAULT_BANK.accountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2500);
    }
  };

  const submitEscrowToServer = async (payload: {
    paymentMethod: "PAYSTACK" | "BANK_TRANSFER";
    paystackReference?: string;
    senderBankName?: string;
    senderAccountName?: string;
    transferSessionId?: string;
  }) => {
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
          ...payload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify and create escrow deposit");
      }

      setSuccessEscrow(data.escrow);
      setWhatsappUrl(data.whatsappUrl);
      setActionNotice(data.message);
    } catch (err: any) {
      setError(err.message || "Failed to finalize escrow reservation");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!studentName || !studentEmail || !studentPhone || !inspectionDate) {
      setError("Please fill in all your contact and inspection details.");
      return;
    }

    if (paymentMethod === "BANK_TRANSFER") {
      if (!senderBankName || !senderAccountName || !transferSessionId) {
        setError(
          "Please complete the ₦10,000 bank transfer first, then enter your Sender Bank Name, Account Name, and Transfer Session ID / Reference."
        );
        return;
      }
      if (transferSessionId.trim().length < 6) {
        setError(
          "Please enter a valid NIP Session ID or Bank Transfer Reference (at least 6 characters/digits)."
        );
        return;
      }

      submitEscrowToServer({
        paymentMethod: "BANK_TRANSFER",
        senderBankName,
        senderAccountName,
        transferSessionId: transferSessionId.trim(),
      });
      return;
    }

    // Channel: Paystack Gateway
    if (!paystackKey) {
      setError(
        "Paystack live gateway key is not configured yet. Please switch to 'Direct Bank Transfer' above to pay into the CribConnect Escrow Vault."
      );
      setPaymentMethod("BANK_TRANSFER");
      return;
    }

    if (typeof window === "undefined" || !window.PaystackPop) {
      setError(
        "Paystack checkout script is still loading. Please try again in a moment or use Direct Bank Transfer."
      );
      return;
    }

    setLoading(true);
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
            {
              display_name: "Inspection Date",
              variable_name: "inspection_date",
              value: inspectionDate,
            },
          ],
        },
        callback: function (response: any) {
          submitEscrowToServer({
            paymentMethod: "PAYSTACK",
            paystackReference: response.reference,
          });
        },
        onClose: function () {
          setLoading(false);
        },
      });
      handler.openIframe();
    } catch (err: any) {
      setLoading(false);
      setError(
        "Could not open Paystack checkout window. Please use the Direct Bank Transfer option."
      );
    }
  };

  const handleRefreshVerification = async () => {
    if (!successEscrow?.id) return;
    setRefreshingStatus(true);
    setError(null);
    try {
      const res = await fetch(`/api/escrow/reserve?id=${encodeURIComponent(successEscrow.id)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data.escrow) {
        setSuccessEscrow(data.escrow);
        if (data.escrow.status === "HELD_IN_ESCROW") {
          setActionNotice(
            "Payment confirmed by CribConnect Escrow Vault! Your 4-digit Release PIN is now unlocked below."
          );
        } else {
          setActionNotice(
            "Your bank transfer is still awaiting confirmation by the CribConnect Escrow Vault."
          );
        }
      }
    } catch (err) {
      setError("Could not refresh verification status.");
    } finally {
      setRefreshingStatus(false);
    }
  };

  const handleEscrowAction = async (action: "RELEASE" | "REFUND") => {
    if (!successEscrow) return;
    if (action === "RELEASE" && (!enteredReleasePin || enteredReleasePin.trim().length !== 4)) {
      setError("Please enter your 4-digit Inspection Release PIN to authorize payout to the agent.");
      return;
    }

    setActionLoading(true);
    setActionNotice(null);
    setError(null);

    try {
      const res = await fetch("/api/escrow/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: successEscrow.id,
          action,
          pin: action === "RELEASE" ? enteredReleasePin.trim() : undefined,
          reason:
            action === "REFUND"
              ? "Tenant physical inspection was not satisfactory — refund requested."
              : undefined,
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-7 space-y-4 border border-gray-200 shadow-xl my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                CribConnect Verified Escrow Vault
              </h2>
              <p className="text-xs text-gray-500">
                48-Hour Property Lock &middot; Bank-Verified Holding Deposit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {actionNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{actionNotice}</span>
          </div>
        )}

        {!successEscrow ? (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Listing Summary */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Accommodation Being Locked:
              </span>
              <p className="text-sm font-bold text-gray-900 truncate">{listing.title}</p>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <span>Annual Rent: ₦{listing.price.toLocaleString()}/yr</span>
                <span>Area: {listing.neighborhood}</span>
              </div>
            </div>

            {/* Student Contact & Inspection Schedule */}
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

            {/* Payment Method Selector */}
            <div className="space-y-2.5 pt-2 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-800">
                Select Real Escrow Payment Method (₦{amount.toLocaleString()}):
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("BANK_TRANSFER")}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    paymentMethod === "BANK_TRANSFER"
                      ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Landmark className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Direct Bank Transfer</div>
                    <div className="text-[10px] text-gray-500">OPay, GTB, Access, Kuda</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("PAYSTACK")}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    paymentMethod === "PAYSTACK"
                      ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Paystack Gateway</div>
                    <div className="text-[10px] text-gray-500">ATM Card / USSD Instant</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Channel A: Direct Bank Transfer Escrow Vault Details & Verification Form */}
            {paymentMethod === "BANK_TRANSFER" && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                      Step 1: Transfer Exactly ₦{amount.toLocaleString()} To:
                    </span>
                    <div className="text-xs font-bold text-gray-900 mt-0.5">
                      {ESCROW_VAULT_BANK.bankName}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Account Name: <strong>{ESCROW_VAULT_BANK.accountName}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-mono font-bold text-emerald-700">
                      {ESCROW_VAULT_BANK.accountNumber}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAccount}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 mt-0.5"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedAccount ? "Copied!" : "Copy Account No"}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">
                    Step 2: Enter Your Bank Transfer Proof for Verification:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Bank You Transferred From *
                      </label>
                      <select
                        required
                        value={senderBankName}
                        onChange={(e) => setSenderBankName(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="">Select Sender Bank...</option>
                        {NIGERIAN_BANKS.map((bank) => (
                          <option key={bank} value={bank}>
                            {bank}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Sender Account Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Name on your bank account"
                        value={senderAccountName}
                        onChange={(e) => setSenderAccountName(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Transfer Reference / NIP Session ID (from your bank receipt) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 000013261110142055981234567890"
                      value={transferSessionId}
                      onChange={(e) => setTransferSessionId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      CribConnect verifies this Session ID against our Escrow Vault bank statement before unlocking your 4-digit Release PIN.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Channel B: Paystack Gateway Notice */}
            {paymentMethod === "PAYSTACK" && (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Instant Paystack Verification</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Pay securely with your Debit Card, USSD, or Paystack Transfer. Once Paystack confirms the ₦{amount.toLocaleString()} transaction, your 4-digit Inspection Release PIN is generated immediately.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>
                {loading
                  ? "Verifying Payment..."
                  : paymentMethod === "BANK_TRANSFER"
                  ? `Submit ₦${amount.toLocaleString()} Bank Transfer for Escrow Verification`
                  : `Pay ₦${amount.toLocaleString()} via Paystack Gateway`}
              </span>
            </button>
          </form>
        ) : (
          /* STEP 2: Escrow Verification Status & Secret Release PIN */
          <div className="space-y-4">
            {successEscrow.status === "AWAITING_PAYMENT_CONFIRMATION" ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-gray-900">
                  Awaiting Escrow Bank Alert Verification
                </h3>
                <p className="text-xs text-gray-600">
                  We have logged your ₦{successEscrow.amount.toLocaleString()} transfer from{" "}
                  <strong>{successEscrow.senderBankName}</strong> (Ref:{" "}
                  <span className="font-mono">{successEscrow.transferSessionId}</span>). As soon as
                  the CribConnect Escrow Vault confirms the bank alert, your 4-digit Release PIN
                  will unlock below.
                </p>
                <button
                  type="button"
                  disabled={refreshingStatus}
                  onClick={handleRefreshVerification}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingStatus ? "animate-spin" : ""}`} />
                  <span>
                    {refreshingStatus ? "Checking Vault..." : "Check Verification Status"}
                  </span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-gray-900">
                  Payment Verified &middot; Accommodation Locked for 48 Hours!
                </h3>
                <p className="text-xs text-gray-600">
                  ₦{successEscrow.amount.toLocaleString()} is verified and held in the CribConnect
                  Escrow Vault.
                </p>
              </div>
            )}

            {/* Secret Release PIN Box */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center space-y-1.5">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Your Secret Inspection Release PIN:
              </span>
              <div className="text-xl font-mono font-bold text-emerald-700 tracking-widest bg-white py-2 px-4 rounded-lg border border-gray-200 inline-block">
                {successEscrow.releasePin}
              </div>
              <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                {successEscrow.status === "AWAITING_PAYMENT_CONFIRMATION"
                  ? "Your 4-digit PIN is protected and will appear here as soon as CribConnect confirms your ₦10,000 bank transfer."
                  : "Do not share this PIN until you physically inspect the apartment and are 100% satisfied."}
              </p>
            </div>

            {/* Reservation Details */}
            <div className="text-xs text-gray-600 space-y-1.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Property:</span>
                <span className="font-semibold text-gray-800 truncate max-w-[220px]">
                  {successEscrow.listingTitle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Agent / Owner:</span>
                <span className="font-semibold text-gray-800">{successEscrow.agentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Inspection Schedule:</span>
                <span className="font-semibold text-gray-800">
                  {successEscrow.inspectionDate} ({successEscrow.inspectionTime})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Reference:</span>
                <span className="font-mono text-[11px] text-gray-800">
                  {successEscrow.paystackReference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Escrow Vault Status:</span>
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
                <span>Notify Agent on WhatsApp with Escrow Reference</span>
              </a>
            )}

            {/* Post-Inspection Decision (Only enabled once payment is verified & HELD_IN_ESCROW) */}
            {successEscrow.status === "HELD_IN_ESCROW" && (
              <div className="pt-3 border-t border-gray-100 space-y-2.5">
                <span className="text-xs font-bold text-gray-800 block">
                  Post-Inspection Settlement (Requires Your 4-Digit PIN):
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="Enter 4-digit PIN"
                      value={enteredReleasePin}
                      onChange={(e) => setEnteredReleasePin(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleEscrowAction("RELEASE")}
                    className="py-2 px-3.5 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Release Payout</span>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleEscrowAction("REFUND")}
                  className="w-full py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reject Property &amp; Request 100% Refund</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
