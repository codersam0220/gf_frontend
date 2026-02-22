const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://web-production-16d69.up.railway.app";

export async function createPersona(anonId: string) {
  const res = await fetch(`${API_URL}/v1/personas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Mia",
      persona_gender: "female",
      personality: "sweet, caring, and fun",
      speech_style: "playful and warm",
      anon_id: anonId,
    }),
  });
  return res.json();
}

export async function createSession(personaId: number, anonId: string) {
  const res = await fetch(`${API_URL}/v1/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ persona_id: personaId, user_gender: "male", anon_id: anonId }),
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
