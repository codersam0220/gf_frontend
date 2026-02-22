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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ persona_id: personaId, user_gender: userGender, anon_id: anonId }),
  });
  return res.json();
}

export async function sendMessage(sessionId: number, text: string) {
  const res = await fetch(`${API_URL}/v1/sessions/${sessionId}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return res.json();
}
