"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Zap,
  X,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  CreditCard,
  TrendingUp,
  Award,
} from "lucide-react";

export default function ProUpgradeModal() {
  const { isUpgradeModalOpen, closeUpgradeModal, refreshUser, formatMoney } = useApp();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isUpgradeModalOpen) return null;

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/agent/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: billingCycle,
          paymentReference: `PSTK_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        await refreshUser();
        setTimeout(() => {
          setSuccess(false);
          closeUpgradeModal();
          window.location.reload();
        }, 1800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const monthlyPriceNgn = 5000;
  const yearlyPriceNgn = 48000; // 20% discount

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 p-6 text-white relative">
          <button
            onClick={closeUpgradeModal}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-xl bg-white/20 backdrop-blur">
              <Zap className="w-6 h-6 text-yellow-200 fill-yellow-200" />
            </span>
            <span className="text-xs uppercase tracking-wider font-extrabold text-yellow-100 bg-white/20 px-2.5 py-0.5 rounded-full">
              Agent Growth Tier
            </span>
          </div>
          <h2 className="text-2xl font-bold">CribConnect Pro Agent</h2>
          <p className="text-amber-100 text-xs mt-1">
            Unlock unlimited property listings, priority request pitch placement, and direct student lead inquiries.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Upgrade Successful!</h3>
              <p className="text-xs text-slate-600">
                You are now a <strong>CribConnect Pro Agent</strong>. Unlimited listings and featured placement badges have been activated.
              </p>
            </div>
          ) : (
            <>
              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-3 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    billingCycle === "monthly"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  Monthly: {formatMoney(monthlyPriceNgn)} / mo
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1 ${
                    billingCycle === "yearly"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  <span>Annual: {formatMoney(yearlyPriceNgn)} / yr</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                    Save 20%
                  </span>
                </button>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-2.5 text-xs text-slate-700 bg-amber-50/60 p-4 rounded-xl border border-amber-100">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Unlimited Property Listings</strong> (Free tier capped at 2)
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>3 Included &quot;Featured Listing&quot; Spotlights</strong> on the homepage and top search results
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Instant Student Request Alerts</strong>: Pitch fresh incoming student housing posts first
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Lead Analytics Dashboard</strong>: Track listing impressions, direct WhatsApp clicks, and proposal win rate
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Verified Pro Badge</strong> on your profile and listings
                  </div>
                </div>
              </div>

              {/* Paystack Simulation CTA */}
              <button
                type="button"
                disabled={isLoading}
                onClick={handleUpgrade}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-sm shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <span>Processing Secure Checkout...</span>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay {formatMoney(billingCycle === "monthly" ? monthlyPriceNgn : yearlyPriceNgn)} via Paystack</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400">
                Secured 256-bit simulated escrow & payment gateway. Cancel anytime from agent dashboard.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
