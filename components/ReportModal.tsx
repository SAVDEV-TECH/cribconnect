"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "LISTING" | "AGENT";
  targetId: string;
  targetTitle: string;
}

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}: ReportModalProps) {
  const [reason, setReason] = useState("Suspicious or fake property");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setNeedsLogin(false);

    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          details,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setNeedsLogin(true);
        setError("Please sign in to submit a safety report so our team can follow up.");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Could not submit safety report.");
        return;
      }
      setSubmitted(true);
      setDetails("");
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1800);
    } catch {
      setError("Network error submitting report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reportReasons = [
    "Suspicious or fake property",
    "Agent requested unverified upfront inspection payment",
    "Inaccurate photos or price mismatch",
    "Agent has no official accreditation or valid ID",
    "Unprofessional or abusive conduct",
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm"
    >
      <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-200">
        <div className="bg-red-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-200" />
            <h3 id="report-modal-title" className="font-bold text-base">
              Community Trust &amp; Safety Report
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report dialog"
            className="p-1 rounded hover:bg-red-700 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-gray-900">Report Submitted</h4>
              <p className="text-xs text-gray-500">
                Our trust &amp; safety team has flagged this item for administrative review. Thank
                you for helping keep UNIPORT housing safe!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                  {needsLogin && (
                    <Link
                      href="/auth/login"
                      onClick={onClose}
                      className="inline-block px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-[11px]"
                    >
                      Sign In Now
                    </Link>
                  )}
                </div>
              )}

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                <span className="text-gray-500">Reporting {targetType.toLowerCase()}:</span>
                <p className="font-semibold text-gray-800 truncate">{targetTitle}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Reason for Flagging
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-red-500"
                >
                  {reportReasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Additional Details / Evidence (Optional)
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe what occurred..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Safety Report"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
