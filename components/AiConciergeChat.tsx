"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MessageSquare, X, Send, ArrowRight } from "lucide-react";

interface ChatMessage {
  role: "assistant" | "user";
  text: string;
  matches?: any[];
}

export default function AiConciergeChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Type an area (Choba, Aluu, Ozuoba, Rumuola) or question about Escrow to find available rooms.",
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
            text: "When you reserve a room with the ₦10,000 holding deposit, the room is held for 48 hours and you receive a 4-digit Release PIN. The agent is only paid after you inspect the house and provide the PIN.",
          },
        ]);
        setLoading(false);
        return;
      }

      const res = await fetch("/api/listings", { cache: "no-store" });
      const data = await res.json();
      const allListings: any[] = data.listings || [];

      const matches = allListings
        .filter((l) => {
          if (lower.includes("choba") && !l.neighborhood?.toLowerCase().includes("choba"))
            return false;
          if (lower.includes("aluu") && !l.neighborhood?.toLowerCase().includes("aluu"))
            return false;
          if (lower.includes("ozuoba") && !l.neighborhood?.toLowerCase().includes("ozuoba"))
            return false;
          if (lower.includes("rumuola") && !l.neighborhood?.toLowerCase().includes("rumuola"))
            return false;
          return true;
        })
        .slice(0, 3);

      if (matches.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `Found ${matches.length} available ${
              matches.length === 1 ? "property" : "properties"
            }:`,
            matches,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "No exact match in that filter yet. You can post a housing request on the Connect board.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Browse all listings under Browse.",
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
        <div className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:right-auto sm:w-80 z-50 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden flex flex-col max-h-[68vh]">
          <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-semibold">Property Finder</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => handleSend(undefined, "Show me apartments in Choba")}
              className="px-2.5 py-1 rounded-md bg-white border border-gray-200 text-[11px] font-medium text-gray-700 hover:border-gray-400 shrink-0"
            >
              Choba
            </button>
            <button
              type="button"
              onClick={() => handleSend(undefined, "Apartments in Aluu")}
              className="px-2.5 py-1 rounded-md bg-white border border-gray-200 text-[11px] font-medium text-gray-700 hover:border-gray-400 shrink-0"
            >
              Aluu
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
            {loading && (
              <div className="text-[11px] text-gray-400">Searching...</div>
            )}
          </div>

          <form
            onSubmit={(e) => handleSend(e)}
            className="p-2.5 border-t border-gray-100 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Search area or budget..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:border-gray-900 focus:outline-none"
            />
            <button
              type="submit"
              className="p-2 rounded-lg bg-gray-900 hover:bg-emerald-700 text-white transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
