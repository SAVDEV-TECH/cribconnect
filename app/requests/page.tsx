"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { buildWhatsAppUrl } from "@/lib/types";
import {
  MessageSquare,
  PlusCircle,
  MapPin,
  Calendar,
  CheckCircle2,
  MessageCircle,
  ArrowRight,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function HousingRequestsPage() {
  const { currentUser } = useApp();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    tenantName: "",
    tenantPhone: "",
    tenantSchool: "UNIPORT Student",
    title: "",
    preferredArea: "Choba / Ozuoba",
    maxBudget: "450000",
    propertyType: "SELF_CONTAIN",
    moveInDate: "Next 2 Weeks",
    description: "",
  });

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/requests", { cache: "no-store" });
      const data = await res.json();
      if (data.requests) {
        setRequests(data.requests);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const area = params.get("neighborhood") || params.get("area");
      const budget = params.get("budget");
      const type = params.get("type");
      if (params.get("new") === "1") {
        setShowModal(true);
      }
      if (area || budget || type) {
        setFormData((prev) => ({
          ...prev,
          preferredArea: area || prev.preferredArea,
          maxBudget: budget || prev.maxBudget,
          propertyType: type || prev.propertyType,
        }));
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        tenantName: prev.tenantName || currentUser.name || "",
        tenantPhone: prev.tenantPhone || currentUser.phone || currentUser.whatsapp || "",
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (!showModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorNotice(null);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.request) {
        setRequests((prev) => [data.request, ...prev]);
        setShowModal(false);
        setSuccessNotice(
          "Your housing request has been published! Verified Port Harcourt agents can now submit proposals or reach you on WhatsApp."
        );
        setTimeout(() => setSuccessNotice(null), 6000);
        setFormData({
          tenantName: currentUser?.name || "",
          tenantPhone: currentUser?.phone || currentUser?.whatsapp || "",
          tenantSchool: "UNIPORT Student",
          title: "",
          preferredArea: "Choba / Ozuoba",
          maxBudget: "450000",
          propertyType: "SELF_CONTAIN",
          moveInDate: "Next 2 Weeks",
          description: "",
        });
      } else {
        setErrorNotice(data.error || "Could not publish your housing request. Please check your details.");
      }
    } catch {
      setErrorNotice("Network error while posting request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="border-b border-gray-100 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 inline-block">
              Reverse Rental Marketplace
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
              Can&apos;t find a crib? Post what you need.
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
              Tell local verified UNIPORT &amp; Port Harcourt agents your budget, preferred campus gate, and move-in date. Agents can submit structured proposals or send matching properties directly to your WhatsApp.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setErrorNotice(null);
              setShowModal(true);
            }}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center gap-2 shrink-0 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Housing Need</span>
          </button>
        </div>
      </div>

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Requests Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Active Tenant Requests ({requests.length})
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            Real-time feed updated by students &amp; relocators
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 h-44 rounded-2xl" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-3">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="font-bold text-gray-700">No requests posted yet</h3>
            <p className="text-xs text-gray-500">Be the first to post what you need!</p>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
            >
              Post Housing Need
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req) => {
              const whatsappPitchUrl = buildWhatsAppUrl(
                req.tenantWhatsapp || req.tenantPhone,
                `Hello ${req.tenantName}! I saw your request on CribConnect for "${req.title}" (Budget: ₦${(req.maxBudget || 0).toLocaleString()}). I am an agent with a matching property.`
              );

              return (
                <div
                  key={req.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">
                          {req.tenantName}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">
                          {req.tenantSchool || "Port Harcourt Relocator"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            req.status === "MATCHED"
                              ? "bg-emerald-100 text-emerald-800"
                              : req.status === "CLOSED"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {req.status || "OPEN"}
                        </span>
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                          Max ₦{(req.maxBudget || 0).toLocaleString()} / yr
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/requests/${req.id}`}
                      className="text-sm font-bold text-gray-900 hover:text-emerald-700 leading-snug block transition-colors"
                    >
                      {req.title}
                    </Link>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                      {req.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3 text-gray-500 text-[11px] font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        {req.preferredArea}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        Move-in: {req.moveInDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/requests/${req.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors"
                      >
                        <span>View Proposals</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      {whatsappPitchUrl && (
                        <a
                          href={whatsappPitchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-bold transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Post Housing Need */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="post-request-title"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 id="post-request-title" className="text-xl font-black text-gray-900">
                  Post Housing Request
                </h3>
                <p className="text-xs text-gray-500">
                  Verified Port Harcourt agents will respond with matching houses
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            {errorNotice && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chidi Nwosu"
                  value={formData.tenantName}
                  onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp / Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 08023348812"
                    value={formData.tenantPhone}
                    onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">School / Faculty</label>
                  <input
                    type="text"
                    placeholder="e.g. UNIPORT 100L Engineering"
                    value={formData.tenantSchool}
                    onChange={(e) => setFormData({ ...formData, tenantSchool: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">What are you looking for? *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Self-contain within 5 mins walk of UNIPORT Choba Main Gate"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Max Annual Budget (₦) *</label>
                  <input
                    type="number"
                    required
                    min={10000}
                    placeholder="e.g. 450000"
                    value={formData.maxBudget}
                    onChange={(e) => setFormData({ ...formData, maxBudget: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Preferred Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Choba, Ozuoba, Aluu, Rumuola, Rumuigbo"
                    value={formData.preferredArea}
                    onChange={(e) => setFormData({ ...formData, preferredArea: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Property Type</label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="SELF_CONTAIN">Self-Contain</option>
                    <option value="SINGLE_ROOM">Single Room</option>
                    <option value="SHARED_ROOM">Shared Room / Hostel</option>
                    <option value="ONE_BEDROOM">1-Bedroom Flat</option>
                    <option value="TWO_BEDROOM">2-Bedroom Flat</option>
                    <option value="STUDIO">Studio Apartment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Target Move-in</label>
                  <input
                    type="text"
                    placeholder="e.g. Next 2 Weeks / January"
                    value={formData.moveInDate}
                    onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Specific Needs (Water, power, quiet compound...)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Water must run daily, quiet environment for studying, personal prepaid meter..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>{submitting ? "Posting Request..." : "Post Housing Request"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}