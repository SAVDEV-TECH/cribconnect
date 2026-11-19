"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MessageSquare, X, Send, ArrowRight } from "lucide-react";

interface ChatMessage {
  role: "assistant" | "user";
  text: string;
  matches?: any[];
  ctaHref?: string;
  ctaLabel?: string;
}

const NEIGHBORHOOD_KEYWORDS: { key: string; match: string }[] = [
  { key: "choba", match: "choba" },
  { key: "aluu", match: "aluu" },
  { key: "ozuoba", match: "ozuoba" },
  { key: "rumuola", match: "rumuola" },
  { key: "rumuokoro", match: "rumuokoro" },
  { key: "rumuigbo", match: "rumuigbo" },
  { key: "gra", match: "gra" },
];

function extractMaxBudget(lower: string): number | null {
  const mMillion = lower.match(/(?:under|below|max|<=|budget|around)?\s*₦?\s*(\d+(?:\.\d+)?)\s*(?:m|million)\b/);
  if (mMillion) return Math.round(parseFloat(mMillion[1]) * 1_000_000);

  const mThousand = lower.match(/(?:under|below|max|<=|budget|around)?\s*₦?\s*(\d{2,4})\s*k\b/);
  if (mThousand) return parseInt(mThousand[1], 10) * 1000;

  const mRaw = lower.match(/(?:under|below|max|<=|budget)\s*₦?\s*(\d{5,7})\b/);
  if (mRaw) return parseInt(mRaw[1], 10);

  return null;
}

export default function AiConciergeChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Try an area (Choba, Ozuoba, Aluu, Rumuola, Rumuokoro, Rumuigbo, GRA), a budget (e.g. \"under 250k\"), or ask how Escrow works.",
    },
  ]);

  const handleSend = async (e?: React.FormEvent, presetText?: string) => {
    if (e) e.preventDefault();
    const query = (presetText ?? input).trim();
    if (!query) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: query }]);
    setLoading(true);

    try {
      const lower = query.toLowerCase();

      if (lower.includes("escrow") || lower.includes("pin") || lower.includes("safe")) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "When you reserve a room with the ₦10,000 holding deposit, the room is held for 48 hours and you receive a private 4-digit Release PIN once payment is verified. Only share the PIN after physically inspecting the apartment.",
            ctaHref: "/escrow",
            ctaLabel: "Open Escrow Tracker",
          },
        ]);
        setLoading(false);
        return;
      }

      const res = await fetch("/api/listings", { cache: "no-store" });
      const data = await res.json();
      const allListings: any[] = data.listings || [];

      const matchedAreas = NEIGHBORHOOD_KEYWORDS.filter((n) => lower.includes(n.key)).map(
        (n) => n.match
      );
      const maxBudget = extractMaxBudget(lower);
      const wantsSelfCon = /self[\s-]?con/.test(lower);
      const wantsOneBed = /\b1[\s-]?bed|one[\s-]?bed/.test(lower);
      const wantsTwoBed = /\b2[\s-]?bed|two[\s-]?bed/.test(lower);
      const wantsStudio = /\bstudio\b/.test(lower);

      const matches = allListings
        .filter((l) => {
          if (matchedAreas.length > 0) {
            const area = (l.neighborhood || "").toLowerCase();
            if (!matchedAreas.some((m) => area.includes(m))) return false;
          }
          if (maxBudget !== null && Number(l.price || 0) > maxBudget) {
            return false;
          }
          if (wantsSelfCon && l.propertyType !== "SELF_CONTAIN") return false;
          if (wantsOneBed && l.propertyType !== "ONE_BED") return false;
          if (wantsTwoBed && l.propertyType !== "TWO_BED") return false;
          if (wantsStudio && l.propertyType !== "STUDIO") return false;
          return true;
        })
        .slice(0, 3);

      if (matches.length > 0) {
        const summaryParts: string[] = [];
        if (matchedAreas.length > 0) summaryParts.push(matchedAreas.join("/").toUpperCase());
        if (maxBudget !== null) summaryParts.push(`≤ ₦${maxBudget.toLocaleString()}`);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `Found ${matches.length} available ${
              matches.length === 1 ? "property" : "properties"
            }${summaryParts.length ? ` (${summaryParts.join(", ")})` : ""}:`,
            matches,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "No exact match in that filter yet. Post your exact budget and preferred gate so local UNIPORT agents can pitch matching rooms.",
            ctaHref: "/requests?new=1",
            ctaLabel: "Post Housing Request",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Could not load live listings right now. You can browse all listings directly.",
          ctaHref: "/listings",
          ctaLabel: "Browse Listings",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-6 left-4 z-40 px-3.5 py-2 rounded-lg bg-gray-900 hover:bg-emerald-700 text-white shadow-md border border-gray-800 flex items-center gap-2 text-xs font-medium transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Quick Find</span>
        </button>
      )}

      {isOpen && (
        <div
          className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:right-auto sm:w-80 z-50 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden flex flex-col max-h-[68vh]"
          role="dialog"
          aria-label="Quick property finder"
        >
          <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-semibold">Property Finder</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-gray-400 hover:text-white"
              aria-label="Close property finder"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => handleSend(undefined, "Choba under 300k")}
              className="px-2.5 py-1 rounded-md bg-white border border-gray-200 text-[11px] font-medium text-gray-700 hover:border-gray-400 shrink-0"
            >
              Choba &lt; 300k
            </button>
            <button
              type="button"
              onClick={() => handleSend(undefined, "Self-contain in Aluu")}
              className="px-2.5 py-1 rounded-md bg-white border border-gray-200 text-[11px] font-medium text-gray-700 hover:border-gray-400 shrink-0"
            >
              Aluu
            </button>
            <button
              type="button"
              onClick={() => handleSend(undefined, "Apartments in Rumuigbo")}
              className="px-2.5 py-1 rounded-md bg-white border border-gray-200 text-[11px] font-medium text-gray-700 hover:border-gray-400 shrink-0"
            >
              Rumuigbo
            </button>
            <button
              type="button"
              onClick={() => handleSend(undefined, "How does Escrow work?")}
              className="px-2.5 py-1 rounded-md bg-white border border-gray-200 text-[11px] font-medium text-gray-700 hover:border-gray-400 shrink-0"
            >
              Escrow Info
            </button>
          </div>

          <div className="p-3.5 space-y-2.5 overflow-y-auto flex-1 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`px-3 py-2 rounded-lg max-w-[88%] leading-relaxed ${
                    m.role === "user"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {m.text}
                </div>

                {m.ctaHref && m.ctaLabel && (
                  <Link
                    href={m.ctaHref}
                    onClick={() => setIsOpen(false)}
                    className="mt-1.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold"
                  >
                    <span>{m.ctaLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}

                {m.matches && m.matches.length > 0 && (
                  <div className="mt-2 w-full space-y-1.5">
                    {m.matches.map((item) => (
                      <Link
                        key={item.id}
                        href={`/listings/${item.id}`}
                        onClick={() => setIsOpen(false)}
                        className="block p-2.5 rounded-lg bg-white border border-gray-200 hover:border-gray-400 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-gray-900 truncate text-xs">
                            {item.title}
                          </span>
                          <span className="text-emerald-700 font-semibold shrink-0">
                            ₦{(item.price || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                          <span>{item.neighborhood}</span>
                          <span className="text-gray-800 font-medium flex items-center gap-0.5">
                            View <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="text-[11px] text-gray-400">Searching...</div>}
          </div>

          <form
            onSubmit={(e) => handleSend(e)}
            className="p-2.5 border-t border-gray-100 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="e.g. Choba under 250k..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:border-gray-900 focus:outline-none"
            />
            <button
              type="submit"
              className="p-2 rounded-lg bg-gray-900 hover:bg-emerald-700 text-white transition-colors"
              aria-label="Send query"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
