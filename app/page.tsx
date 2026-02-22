"use client";

import { useEffect, useRef, useState } from "react";
import { createPersona, createSession, sendMessage } from "@/lib/api";

const FREE_SECONDS = 180;

type Message = { role: "user" | "assistant"; content: string };

function getAnonId() {
  let id = localStorage.getItem("anon_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("anon_id", id);
  }
  return id;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(FREE_SECONDS);
  const [timeUp, setTimeUp] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function init() {
      const anonId = getAnonId();
      const persona = await createPersona(anonId);
      const session = await createSession(persona.id, anonId);
      setSessionId(session.session_id);
    }
    init();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!started || timeUp) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          setTimeUp(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [started, timeUp]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId || loading || timeUp) return;
    if (!started) setStarted(true);

    const text = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const data = await sendMessage(sessionId, text);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong 😢" }]);
    } finally {
      setLoading(false);
    }
  };

  const timerColor = secondsLeft <= 30 ? "text-red-400" : "text-pink-300";

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-md flex flex-col h-[85vh] bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-lg">
              M
            </div>
            <div>
              <p className="text-white font-semibold">Mia</p>
              <p className="text-green-400 text-xs">online</p>
            </div>
          </div>
          {started && (
            <div className={`text-sm font-mono font-bold ${timerColor}`}>
              {timeUp ? "⏰ Time&apos;s up" : `⏱ ${formatTime(secondsLeft)}`}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
              <p className="text-4xl mb-3">💕</p>
              <p className="text-sm">Say hi to Mia!</p>
              <p className="text-xs mt-1 text-gray-600">3 minutes free · no signup needed</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-pink-500 text-white rounded-br-sm"
                    : "bg-gray-700 text-gray-100 rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Paywall overlay */}
        {timeUp && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-gray-900 rounded-2xl p-6 mx-6 text-center shadow-2xl border border-pink-500/30">
              <p className="text-4xl mb-3">💝</p>
              <h2 className="text-white font-bold text-lg mb-1">Keep chatting with Mia</h2>
              <p className="text-gray-400 text-sm mb-5">
                Your free 3 minutes are up. Sign up to continue.
              </p>
              <button className="w-full bg-pink-500 hover:bg-pink-400 text-white font-semibold py-3 rounded-xl transition mb-2">
                Sign up — Get 100 credits free
              </button>
              <button className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-2 rounded-xl transition text-sm">
                Log in
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-3 bg-gray-800 border-t border-gray-700 flex gap-2">
          <input
            className="flex-1 bg-gray-700 text-white rounded-xl px-4 py-2 text-sm outline-none placeholder-gray-500 disabled:opacity-50"
            placeholder={timeUp ? "Sign up to keep chatting..." : "Type a message..."}
            value={input}
            disabled={timeUp}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || timeUp}
            className="bg-pink-500 hover:bg-pink-400 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            Send
          </button>
        </div>
      </div>

      <p className="text-gray-600 text-xs mt-3">3 minutes free · No credit card needed</p>
    </main>
  );
}
