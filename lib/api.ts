const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://web-production-16d69.up.railway.app";

const PERSONA_CONFIG = {
  female: {
    name: "Mia",
    personality: "sweet, bold, and playful",
    speech_style: "warm, flirty, and direct",
  },
  male: {
    name: "Kai",
    personality: "calm, warm, and perceptive",
    speech_style: "thoughtful, genuine, and steady",
  },
};

function authHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export async function register(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Registration failed");
  }
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

export async function getMe() {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { ...authHeader() },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function addCredits(userId: number, amount: number) {
  const res = await fetch(`${API_URL}/admin/users/${userId}/credits`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ amount }),
  });
  return res.json();
}

// ── Personas & Sessions ────────────────────────────────────────────────────────

export async function createPersona(anonId: string, gender: "female" | "male") {
  const config = PERSONA_CONFIG[gender];
  const res = await fetch(`${API_URL}/v1/personas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: config.name,
      persona_gender: gender,
      personality: config.personality,
      speech_style: config.speech_style,
      anon_id: anonId,
    }),
  });
  return res.json();
}

export async function createSession(
  personaId: number,
  anonId: string,
  userGender: "male" | "female"
) {
  const res = await fetch(`${API_URL}/v1/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ persona_id: personaId, user_gender: userGender, anon_id: anonId }),
  });
  return res.json();
}

export async function sendMessage(sessionId: number, text: string) {
  const res = await fetch(`${API_URL}/v1/sessions/${sessionId}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ text }),
  });
  if (res.status === 402) {
    throw Object.assign(new Error("크레딧이 부족합니다"), { code: 402 });
  }
  return res.json();
}
