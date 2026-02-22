"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://web-production-16d69.up.railway.app";

type Message = {
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type Conversation = {
  session_id: number;
  anon_id: string;
  created_at: string;
  message_count: number;
  messages: Message[];
};

export default function AdminPage() {
  const [apiKey, setApiKey] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState(false);
  const [openSession, setOpenSession] = useState<number | null>(null);

  const fetchConversations = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/admin/conversations`, {
        headers: { "x-admin-key": apiKey },
      });
      if (res.status === 403) {
        setError("Wrong API key");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setConversations(data.conversations);
      setTotal(data.total_sessions);
      setAuthed(true);
    } catch {
      setError("Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!authed) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm border border-gray-700">
          <h1 className="text-white font-bold text-xl mb-1">Admin</h1>
          <p className="text-gray-500 text-sm mb-6">Enter your admin API key</p>
          <input
            type="password"
            placeholder="API key"
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none placeholder-gray-600 mb-3"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchConversations()}
          />
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button
            onClick={fetchConversations}
            disabled={!apiKey || loading}
            className="w-full bg-pink-500 hover:bg-pink-400 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition"
          >
            {loading ? "Loading..." : "View conversations"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white font-bold text-2xl">Conversations</h1>
            <p className="text-gray-500 text-sm mt-1">{total} total sessions</p>
          </div>
          <button
            onClick={() => { setAuthed(false); setConversations([]); setApiKey(""); }}
            className="text-gray-500 hover:text-gray-300 text-sm transition"
          >
            Log out
          </button>
        </div>

        {/* Session list */}
        <div className="space-y-3">
          {conversations.length === 0 && (
            <p className="text-gray-600 text-center py-12">No conversations yet</p>
          )}
          {conversations.map((conv) => (
            <div key={conv.session_id} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              {/* Session header */}
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800 transition text-left"
                onClick={() => setOpenSession(openSession === conv.session_id ? null : conv.session_id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs font-mono">
                    #{conv.session_id}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {conv.anon_id?.slice(0, 8) ?? "anonymous"}...
                    </p>
                    <p className="text-gray-500 text-xs">{formatDate(conv.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs">{conv.message_count} messages</span>
                  <span className="text-gray-500 text-sm">{openSession === conv.session_id ? "▲" : "▼"}</span>
                </div>
              </button>

              {/* Messages */}
              {openSession === conv.session_id && (
                <div className="border-t border-gray-800 px-5 py-4 space-y-3 max-h-[500px] overflow-y-auto">
                  {conv.messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[80%]">
                        <div
                          className={`px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                            m.role === "user"
                              ? "bg-pink-500 text-white rounded-br-sm"
                              : "bg-gray-700 text-gray-100 rounded-bl-sm"
                          }`}
                        >
                          {m.content}
                        </div>
                        <p className={`text-xs text-gray-600 mt-1 ${m.role === "user" ? "text-right" : "text-left"}`}>
                          {m.role === "user" ? "user" : "Mia"} · {formatDate(m.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
