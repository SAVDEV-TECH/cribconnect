"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { buildWhatsAppUrl } from "@/lib/types";
import {
  MessageSquare,
  Send,
  ShieldAlert,
  MessageCircle,
  Lock,
  ArrowRight,
  CheckCheck,
  AlertCircle,
  Plus,
} from "lucide-react";

interface PartnerInfo {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  phone?: string;
  whatsapp?: string;
  lastMessage?: string;
  lastAt?: string;
}

export default function MessagesPage() {
  const { currentUser, sessionReady } = useApp();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [selectedExternalPartner, setSelectedExternalPartner] = useState<PartnerInfo | null>(null);
  const [availableAgents, setAvailableAgents] = useState<PartnerInfo[]>([]);
  const [showNewChatPicker, setShowNewChatPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/messages", { cache: "no-store" });
      if (res.status === 401) {
        setMessages([]);
        return;
      }
      const data = await res.json();
      if (res.ok && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!sessionReady) return;
    fetchMessages();
  }, [sessionReady, fetchMessages]);

  // Support deep linking via /messages?to=<userId> and load agent directory for new chats
  useEffect(() => {
    if (!sessionReady || !currentUser) return;

    const params =
      typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const targetId = params?.get("to");

    if (targetId && targetId !== currentUser.id) {
      setActivePartnerId(targetId);
      fetch(`/api/agents/${encodeURIComponent(targetId)}`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const u = data?.profile?.user;
          if (u?.id) {
            setSelectedExternalPartner({
              id: u.id,
              name: u.name,
              avatar: u.avatar,
              role: "AGENT",
              phone: u.phone,
              whatsapp: u.whatsapp,
            });
          }
        })
        .catch(() => {});
    }

    fetch("/api/agents", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.agents)) {
          const list: PartnerInfo[] = data.agents
            .map((a: any) => ({
              id: a.user?.id,
              name: a.user?.name,
              avatar: a.user?.avatar,
              role: "AGENT",
              phone: a.user?.phone,
              whatsapp: a.user?.whatsapp,
            }))
            .filter((p: PartnerInfo) => p.id && p.id !== currentUser.id);
          setAvailableAgents(list);
        }
      })
      .catch(() => {});
  }, [sessionReady, currentUser]);

  const partners = useMemo(() => {
    const map = new Map<string, PartnerInfo>();

    if (currentUser) {
      for (const m of messages) {
        const isSender = m.senderId === currentUser.id;
        const other = isSender ? m.recipient : m.sender;
        const otherId = isSender ? m.recipientId : m.senderId;
        if (!otherId || otherId === currentUser.id) continue;

        const existing = map.get(otherId);
        const msgTime = m.createdAt || "";
        if (!existing || msgTime >= (existing.lastAt || "")) {
          map.set(otherId, {
            id: otherId,
            name: other?.name || "CribConnect Member",
            avatar: other?.avatar,
            role: other?.role,
            phone: existing?.phone,
            whatsapp: existing?.whatsapp,
            lastMessage: m.content,
            lastAt: msgTime,
          });
        }
      }
    }

    if (selectedExternalPartner && !map.has(selectedExternalPartner.id)) {
      map.set(selectedExternalPartner.id, selectedExternalPartner);
    }

    // Enrich phone/whatsapp from availableAgents when present
    for (const ag of availableAgents) {
      const existing = map.get(ag.id);
      if (existing) {
        existing.phone = existing.phone || ag.phone;
        existing.whatsapp = existing.whatsapp || ag.whatsapp;
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      (b.lastAt || "").localeCompare(a.lastAt || "")
    );
  }, [messages, currentUser, selectedExternalPartner, availableAgents]);

  useEffect(() => {
    if (!activePartnerId && partners.length > 0) {
      setActivePartnerId(partners[0].id);
    }
  }, [activePartnerId, partners]);

  const activePartner = useMemo(
    () =>
      partners.find((p) => p.id === activePartnerId) ||
      availableAgents.find((p) => p.id === activePartnerId) ||
      selectedExternalPartner ||
      null,
    [partners, availableAgents, activePartnerId, selectedExternalPartner]
  );

  const activeThread = useMemo(() => {
    if (!currentUser || !activePartnerId) return [];
    return messages.filter(
      (m) =>
        (m.senderId === currentUser.id && m.recipientId === activePartnerId) ||
        (m.senderId === activePartnerId && m.recipientId === currentUser.id)
    );
  }, [messages, currentUser, activePartnerId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePartnerId) return;
    setIsSending(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: activePartnerId,
          content: newMessage.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewMessage("");
        await fetchMessages();
      } else {
        setErrorMsg(data.error || "Could not send message.");
      }
    } catch {
      setErrorMsg("Network error while sending message.");
    } finally {
      setIsSending(false);
    }
  };

  if (!sessionReady || isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Sign In to View Messages</h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            In-app messaging is private to your CribConnect account so students and verified UNIPORT agents can coordinate inspections safely.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/auth/login"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/auth/register"
              className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const partnerWaUrl = activePartner
    ? buildWhatsAppUrl(
        activePartner.whatsapp || activePartner.phone,
        `Hi ${activePartner.name}, continuing our chat from CribConnect!`
      )
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[620px] md:h-[700px]">
        {/* Left Sidebar: Conversations list */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col bg-gray-50/50">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-2">
            <div>
              <h1 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>In-App Messages</span>
              </h1>
              <p className="text-[11px] text-gray-500">
                Direct student &amp; agent inbox
              </p>
            </div>
            {availableAgents.length > 0 && (
              <button
                type="button"
                onClick={() => setShowNewChatPicker((v) => !v)}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            )}
          </div>

          {showNewChatPicker && availableAgents.length > 0 && (
            <div className="p-3 border-b border-gray-200 bg-white space-y-2">
              <p className="text-[11px] font-semibold text-gray-600">
                Start a conversation with a Port Harcourt agent:
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {availableAgents.map((ag) => (
                  <button
                    key={ag.id}
                    type="button"
                    onClick={() => {
                      setSelectedExternalPartner(ag);
                      setActivePartnerId(ag.id);
                      setShowNewChatPicker(false);
                    }}
                    className="w-full p-2 rounded-lg hover:bg-emerald-50 text-left flex items-center gap-2 text-xs"
                  >
                    <img
                      src={
                        ag.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          ag.name
                        )}`
                      }
                      alt={ag.name}
                      className="w-7 h-7 rounded-full object-cover bg-gray-100"
                    />
                    <span className="font-semibold text-gray-900 truncate">{ag.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-2 space-y-1 flex-1 overflow-y-auto">
            {partners.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <p className="text-xs font-semibold text-gray-700">No conversations yet</p>
                <p className="text-[11px] text-gray-500">
                  Select an agent above or click &quot;Message In-App&quot; on any agent profile.
                </p>
              </div>
            ) : (
              partners.map((p) => {
                const isSelected = activePartnerId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePartnerId(p.id)}
                    className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-colors ${
                      isSelected
                        ? "bg-white shadow-sm border border-gray-200 ring-1 ring-emerald-500/20"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <img
                      src={
                        p.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          p.name
                        )}`
                      }
                      alt={p.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0 bg-gray-100"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-gray-900 truncate">
                          {p.name}
                        </span>
                        {p.role && (
                          <span className="text-[9px] uppercase font-semibold text-gray-400">
                            {p.role}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {p.lastMessage || "Start chatting"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Active Chat */}
        <div className="flex-1 flex flex-col bg-white">
          {activePartner ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4 bg-white">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      activePartner.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        activePartner.name
                      )}`
                    }
                    alt={activePartner.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 bg-gray-100"
                  />
                  <div>
                    <h2 className="font-bold text-sm text-gray-900">{activePartner.name}</h2>
                    <span className="text-[11px] text-gray-500 font-medium">
                      {activePartner.role || "CribConnect Member"}
                    </span>
                  </div>
                </div>

                {partnerWaUrl && (
                  <a
                    href={partnerWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Continue on WhatsApp</span>
                  </a>
                )}
              </div>

              {/* Anti-Scam Security Banner */}
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-xs text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[11px]">
                  <strong>Safety Reminder:</strong> Never pay rent or release your Escrow PIN before physically inspecting the accommodation and verifying landlord documents.
                </span>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {activeThread.length === 0 ? (
                  <div className="text-center py-20 text-xs text-gray-400">
                    No messages yet with {activePartner.name}. Send a greeting below to start chatting.
                  </div>
                ) : (
                  activeThread.map((m) => {
                    const isMe = m.senderId === currentUser.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-md rounded-xl px-4 py-2.5 text-xs leading-relaxed space-y-1 ${
                            isMe
                              ? "bg-emerald-600 text-white rounded-br-sm"
                              : "bg-gray-100 text-gray-900 rounded-bl-sm"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <div
                            className={`text-[9px] flex items-center justify-end gap-1 ${
                              isMe ? "text-emerald-200" : "text-gray-400"
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
                className="p-3 border-t border-gray-200 flex items-center gap-2 bg-gray-50"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Write a message to ${activePartner.name.split(" ")[0]}...`}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
                <button
                  type="submit"
                  disabled={isSending || !newMessage.trim()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? "Sending..." : "Send"}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-gray-300" />
              <h2 className="text-sm font-bold text-gray-800">Select a Conversation</h2>
              <p className="text-xs text-gray-500 max-w-sm">
                Choose an existing conversation on the left or click &quot;New&quot; to message a Port Harcourt agent directly.
              </p>
              <Link
                href="/agents"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                Browse Agents
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
