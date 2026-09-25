"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  MessageSquare,
  Send,
  ShieldAlert,
  MessageCircle,
  Phone,
  ShieldCheck,
  User,
  CheckCheck,
} from "lucide-react";

export default function MessagesPage() {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activePartnerId, setActivePartnerId] = useState<string>("agent-kolawole");
  const [partnerUser, setPartnerUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [currentUser]);

  // Determine partner profile
  useEffect(() => {
    if (currentUser?.role === "AGENT") {
      setActivePartnerId("student-chidi");
    } else {
      setActivePartnerId("agent-kolawole");
    }
  }, [currentUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: activePartnerId,
          content: newMessage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewMessage("");
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const activeThread = messages.filter(
    (m) =>
      (m.senderId === currentUser?.id && m.recipientId === activePartnerId) ||
      (m.senderId === activePartnerId && m.recipientId === currentUser?.id)
  );

  const partnerName =
    activePartnerId === "agent-kolawole"
      ? "Kolawole Adebayo (Verified Agent)"
      : activePartnerId === "student-chidi"
      ? "Chidi Nwosu (Student)"
      : "Contact";

  const partnerAvatar =
    activePartnerId === "agent-kolawole"
      ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120"
      : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[700px]">
        {/* Left Sidebar: Conversations list */}
        <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-600" />
              <span>In-App Messages</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Encrypted & anti-scam monitored channel
            </p>
          </div>

          <div className="p-2 space-y-1 flex-1 overflow-y-auto">
            {/* Conversation 1: Kolawole */}
            <button
              onClick={() => setActivePartnerId("agent-kolawole")}
              className={`w-full p-3 rounded-2xl text-left flex items-center gap-3 transition-colors ${
                activePartnerId === "agent-kolawole"
                  ? "bg-white shadow-xs border border-slate-200 ring-1 ring-brand-500/20"
                  : "hover:bg-slate-100"
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
                alt="Kolawole"
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 truncate">
                    Kolawole Adebayo
                  </span>
                  <span className="text-[9px] text-slate-400">Active</span>
                </div>
                <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified UNILAG Agent</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Check out the proposal for St. Finbarr&apos;s...
                </p>
              </div>
            </button>

            {/* Conversation 2: Chidi */}
            <button
              onClick={() => setActivePartnerId("student-chidi")}
              className={`w-full p-3 rounded-2xl text-left flex items-center gap-3 transition-colors ${
                activePartnerId === "student-chidi"
                  ? "bg-white shadow-xs border border-slate-200 ring-1 ring-brand-500/20"
                  : "hover:bg-slate-100"
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100"
                alt="Chidi"
                className="w-10 h-10 rounded-full object-cover border border-slate-300 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 truncate">
                    Chidi Nwosu
                  </span>
                  <span className="text-[9px] text-slate-400">Today</span>
                </div>
                <div className="text-[10px] text-blue-600 font-medium">
                  UNILAG Computer Science Fresher
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Is generator fuel included in service charge?
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Right Area: Active Chat */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Thread Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-white">
            <div className="flex items-center gap-3">
              <img
                src={partnerAvatar}
                alt={partnerName}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-slate-900">{partnerName}</h3>
                </div>
                <span className="text-[11px] text-emerald-600 font-medium">
                  Verified Contact • Online
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/2348034452299?text=${encodeURIComponent(
                  `Hi ${partnerName}, continuing our chat from CribConnect!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Continue on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Anti-Scam Security Banner */}
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-[11px]">
              <strong>Trust & Safety Tip:</strong> Never pay inspection charges or transfer rental funds until you or a trusted friend physically inspects the accommodation and validates landlady tenancy documents.
            </span>
          </div>

          {/* Message History */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {activeThread.length === 0 ? (
              <div className="text-center py-20 text-xs text-slate-400">
                No messages yet. Send a greeting to start chatting!
              </div>
            ) : (
              activeThread.map((m) => {
                const isMe = m.senderId === currentUser?.id;
                return (
                  <div
                    key={m.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed space-y-1 ${
                        isMe
                          ? "bg-brand-600 text-white rounded-br-xs"
                          : "bg-slate-100 text-slate-900 rounded-bl-xs"
                      }`}
                    >
                      <p>{m.content}</p>
                      <div
                        className={`text-[9px] flex items-center justify-end gap-1 ${
                          isMe ? "text-brand-200" : "text-slate-400"
                        }`}
                      >
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isMe && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-200 flex items-center gap-2 bg-slate-50"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Write a message to ${partnerName.split(" ")[0]}...`}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
