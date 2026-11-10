"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  X,
  Send,
  ShieldCheck,
  Building2,
  ArrowRight,
  Lock,
} from "lucide-react";

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
      text: "Hi! I’m your CribConnect UNIPORT AI Assistant. Tell me your budget and area (e.g. 'Self-contain in Choba under ₦300k' or 'How does Escrow work?') and I’ll match you instantly.",
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
            text: "CribConnect Escrow protects 100% of your money: when you pay the ₦10,000 holding deposit (via Bank Transfer or Paystack), the apartment is locked for you for 48 hours and you receive a secret 4-digit Release PIN. The agent only gets paid AFTER you physically inspect the house and enter your 4-digit PIN. If the house doesn't match, you click 1 button for a 100% refund.",
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
            text: `I found ${matches.length} verified UNIPORT ${
              matches.length === 1 ? "property" : "properties"
            } matching your request. You can inspect or lock any of them for 48 hours with Escrow:`,
            matches,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "No exact match in that filter yet — you can post a custom Housing Request on our Connect board so verified UNIPORT landlords and agents pitch directly to you, or upload a property if you're an agent!",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "You can browse all verified UNIPORT apartments under Browse or lock any room with 48-hour Escrow protection.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-6 left-4 z-40 px-3.5 py-2.5 rounded-full bg-gray-900 hover:bg-black text-white shadow-xl border border-gray-800 flex items-center gap-2 text-xs font-bold transition-transform hover:scale-105"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Ask AI Concierge</span>
        </button>
      )}

      {/* Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:right-auto sm:w-88 z-50 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[72vh]">
          <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-bold">CribConnect AI Concierge</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Instant UNIPORT Matcher
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => handleSend(undefined, "Show me apartments in Choba")}
              className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-[10px] font-semibold text-gray-700 hover:border-emerald-400 shrink-0"
            >
              🏠 Choba Cribs
            </button>
            <button
              type="button"
              onClick={() => handleSend(undefined, "How does Escrow work?")}
              className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-[10px] font-semibold text-gray-700 hover:border-emerald-400 shrink-0"
            >
              🔒 How Escrow Works
            </button>
            <button
              type="button"
              onClick={() => handleSend(undefined, "Apartments in Aluu")}
              className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-[10px] font-semibold text-gray-700 hover:border-emerald-400 shrink-0"
            >
              🎓 Aluu Back Gate
            </button>
          </div>

          {/* Messages */}
          <div className="p-3.5 space-y-3 overflow-y-auto flex-1 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`px-3 py-2 rounded-2xl max-w-[88%] leading-relaxed ${
                    m.role === "user"
                      ? "bg-emerald-600 text-white rounded-br-xs"
                      : "bg-gray-100 text-gray-800 rounded-bl-xs"
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
                        className="block p-2.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-500 transition-colors shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-gray-900 truncate text-xs">
                            {item.title}
                          </span>
                          <span className="text-emerald-700 font-bold shrink-0">
                            ₦{(item.price || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1">
                          <span>{item.neighborhood}</span>
                          <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                            Inspect / Lock <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="text-[11px] text-gray-400 italic">Searching verified cribs...</div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => handleSend(e)}
            className="p-2.5 border-t border-gray-100 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about Choba, Aluu, budget, or Escrow..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
