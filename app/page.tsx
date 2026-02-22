"use client";

import { useEffect, useRef, useState } from "react";
import { createPersona, createSession, sendMessage } from "@/lib/api";

const FREE_SECONDS = 30;

type Screen = "select" | "chat";
type PersonaGender = "female" | "male";
type Message = { role: "user" | "assistant"; content: string };

const PERSONA = {
  female: {
    name: "Mia",
    avatar: "M",
    accent: "pink",
    avatarBg: "bg-pink-500",
    sendBtn: "bg-pink-500 hover:bg-pink-400",
    userBubble: "bg-pink-500",
    cardBorder: "border-pink-500/40 hover:border-pink-400",
    cardGlow: "hover:shadow-pink-500/20",
    cardBg: "from-pink-950/60 to-gray-900",
    icon: "♀",
    tagline: "A bold, warm companion",
  },
  male: {
    name: "Kai",
    avatar: "K",
    accent: "indigo",
    avatarBg: "bg-indigo-500",
    sendBtn: "bg-indigo-500 hover:bg-indigo-400",
    userBubble: "bg-indigo-500",
    cardBorder: "border-indigo-500/40 hover:border-indigo-400",
    cardGlow: "hover:shadow-indigo-500/20",
    cardBg: "from-indigo-950/60 to-gray-900",
    icon: "♂",
    tagline: "A calm, perceptive companion",
  },
};

function getAnonId() {
  let id = localStorage.getItem("anon_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("anon_id", id);
  }
  return id;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("select");
  const [personaGender, setPersonaGender] = useState<PersonaGender>("female");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(FREE_SECONDS);
  const [timeUp, setTimeUp] = useState(false);
  const [started, setStarted] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const handleSelect = async (gender: PersonaGender) => {
    setPersonaGender(gender);
    setInitializing(true);
    try {
      const anonId = getAnonId();
      // opposite gender as default user_gender for the most natural pronoun pairing
      const userGender = gender === "female" ? "male" : "female";
      const persona = await createPersona(anonId, gender);
      const session = await createSession(persona.id, anonId, userGender);
      setSessionId(session.session_id);
      setScreen("chat");
    } finally {
      setInitializing(false);
    }
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

  const formatTime = (s: number) => `0:${s.toString().padStart(2, "0")}`;

  const p = PERSONA[personaGender];

  // ── Selection screen ─────────────────────────────────────────────────────────
  if (screen === "select") {
    return (
      <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-10">
            <p className="text-5xl mb-4">💬</p>
            <h1 className="text-white text-2xl font-bold tracking-tight">Find your companion</h1>
            <p className="text-gray-400 text-sm mt-2">
              Someone to talk to — no judgment, no rush.
            </p>
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-4">
            {(["female", "male"] as PersonaGender[]).map((gender) => {
              const cfg = PERSONA[gender];
              return (
                <button
                  key={gender}
                  onClick={() => handleSelect(gender)}
                  disabled={initializing}
                  className={`
                    w-full text-left p-5 rounded-2xl border bg-gradient-to-br ${cfg.cardBg}
                    ${cfg.cardBorder} shadow-lg ${cfg.cardGlow}
                    hover:shadow-xl transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full ${cfg.avatarBg} flex items-center justify-center text-white font-bold text-2xl shrink-0`}>
                      {cfg.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold text-lg">{cfg.name}</p>
                        <span className="text-gray-400 text-sm">{cfg.icon}</span>
                      </div>
                      <p className="text-gray-400 text-sm mt-0.5">{cfg.tagline}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                        <span className="text-green-400 text-xs">online</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {initializing && (
            <p className="text-center text-gray-500 text-sm mt-6 animate-pulse">
              Connecting…
            </p>
          )}

          <p className="text-center text-gray-600 text-xs mt-8">
            30 seconds free · No signup needed
          </p>
        </div>
      </main>
    );
  }

  // ── Chat screen ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-md flex flex-col h-[85vh] bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-3">
            {/* Back button */}
            <button
              onClick={() => {
                setScreen("select");
                setMessages([]);
                setStarted(false);
                setTimeUp(false);
                setSecondsLeft(FREE_SECONDS);
                setSessionId(null);
              }}
              className="text-gray-400 hover:text-white transition text-lg leading-none mr-1"
              title="Back"
            >
              ←
            </button>
            <div className={`w-10 h-10 rounded-full ${p.avatarBg} flex items-center justify-center text-white font-bold text-lg`}>
              {p.avatar}
            </div>
            <div>
              <p className="text-white font-semibold">{p.name}</p>
              <p className="text-green-400 text-xs">online</p>
            </div>
          </div>
          {started && (
            <div className={`text-sm font-mono font-bold ${secondsLeft <= 10 ? "text-red-400" : "text-gray-300"}`}>
              {timeUp ? "⏰ Time&apos;s up" : `⏱ ${formatTime(secondsLeft)}`}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
              <p className="text-4xl mb-3">{personaGender === "female" ? "💕" : "💙"}</p>
              <p className="text-sm">Say hi to {p.name}!</p>
              <p className="text-xs mt-1 text-gray-600">30 seconds free · no signup needed</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? `${p.userBubble} text-white rounded-br-sm`
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
            <div className="bg-gray-900 rounded-2xl p-6 mx-6 text-center shadow-2xl border border-gray-700">
              <p className="text-4xl mb-3">{personaGender === "female" ? "💝" : "💙"}</p>
              <h2 className="text-white font-bold text-lg mb-1">Keep chatting with {p.name}</h2>
              <p className="text-gray-400 text-sm mb-5">
                Your free trial is up. Sign up to keep going.
              </p>
              <button className={`w-full ${p.sendBtn} text-white font-semibold py-3 rounded-xl transition mb-2`}>
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
            placeholder={timeUp ? "Sign up to keep chatting..." : `Message ${p.name}...`}
            value={input}
            disabled={timeUp}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || timeUp}
            className={`${p.sendBtn} disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-semibold transition`}
          >
            Send
          </button>
        </div>
      </div>

      <p className="text-gray-600 text-xs mt-3">30 seconds free · No credit card needed</p>
    </main>
  );
}
