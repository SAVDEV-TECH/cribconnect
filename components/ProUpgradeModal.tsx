"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Zap, X, CheckCircle2, CreditCard, AlertCircle } from "lucide-react";

export default function ProUpgradeModal() {
  const { isUpgradeModalOpen, closeUpgradeModal, refreshUser, formatMoney, currentUser } = useApp();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isUpgradeModalOpen) return null;

  const monthlyPriceNgn = 5000;
  const yearlyPriceNgn = 48000;
  const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

  const verifyUpgrade = async (paymentReference: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: billingCycle,
          paymentReference,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        await refreshUser();
        setTimeout(() => {
          setSuccess(false);
          closeUpgradeModal();
        }, 1800);
      } else {
        setError(data.error || "Payment verification failed.");
      }
    } catch {
      setError("Network error while verifying upgrade payment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = () => {
    setError(null);
    const amountNgn = billingCycle === "monthly" ? monthlyPriceNgn : yearlyPriceNgn;
    const paystack = (window as any).PaystackPop;

    if (!paystackPublicKey || !paystack) {
      setError(
        "Live Paystack billing is not configured on this environment yet. Please contact support@cribconnect.ng for manual Pro activation."
      );
      return;
    }

    if (!currentUser?.email) {
      setError("Please sign in before upgrading your account.");
      return;
    }

    const handler = paystack.setup({
      key: paystackPublicKey,
      email: currentUser.email,
      amount: amountNgn * 100,
      currency: "NGN",
      ref: `CCPRO-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      callback: (response: { reference: string }) => {
        verifyUpgrade(response.reference);
      },
      onClose: () => {
        setIsLoading(false);
      },
    });
    handler.openIframe();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-upgrade-title"
    >
      <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 p-6 text-white relative">
          <button
            type="button"
            onClick={closeUpgradeModal}
            aria-label="Close upgrade dialog"
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-xl bg-white/20 backdrop-blur">
              <Zap className="w-6 h-6 text-yellow-200 fill-yellow-200" />
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-yellow-100 bg-white/20 px-2.5 py-0.5 rounded-full">
              Agent Growth Tier
            </span>
          </div>
          <h2 id="pro-upgrade-title" className="text-2xl font-bold">
            CribConnect Pro Agent
          </h2>
          <p className="text-amber-100 text-xs mt-1">
            Unlock priority placement and featured badges across UNIPORT &amp; Port Harcourt searches.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Upgrade Successful!</h3>
              <p className="text-xs text-gray-600">
                You are now a <strong>CribConnect Pro Agent</strong>.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-3 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    billingCycle === "monthly"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600"
                  }`}
                >
                  Monthly: {formatMoney(monthlyPriceNgn)} / mo
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1 ${
                    billingCycle === "yearly"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600"
                  }`}
                >
                  <span>Annual: {formatMoney(yearlyPriceNgn)} / yr</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                    Save 20%
                  </span>
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-gray-700 bg-amber-50/60 p-4 rounded-xl border border-amber-100">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Featured Listing Priority</strong> on UNIPORT search results
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Verified Pro Badge</strong> on your profile and active listings
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Priority Reverse-Marketplace Access</strong> to pitch incoming student housing requests
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleUpgrade}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:opacity-60 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Verifying Paystack Payment...</span>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>
                      Pay {formatMoney(billingCycle === "monthly" ? monthlyPriceNgn : yearlyPriceNgn)} via Paystack
                    </span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-gray-400">
                Payments are verified directly with Paystack before Pro status is activated.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
