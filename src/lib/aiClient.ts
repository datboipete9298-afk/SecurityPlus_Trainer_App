import type { AiRequestMode, AiTutorRequestBody, AiTutorResponse } from "../types/aiTutor";

function apiBase(): string {
  const b = import.meta.env.VITE_AI_API_BASE;
  return typeof b === "string" ? b.replace(/\/$/, "") : "";
}

/** True when `VITE_AI_API_BASE` is set (client may still be offline or misconfigured). */
export function isAiApiBaseConfigured(): boolean {
  return apiBase().length > 0;
}

const PATH_BY_MODE: Record<AiRequestMode, string> = {
  tutor: "/api/ai/tutor",
  explain: "/api/ai/explain",
  "note-feedback": "/api/ai/note-feedback",
  "quiz-help": "/api/ai/quiz-help",
  "lab-coach": "/api/ai/lab-coach",
};

export async function postAi(
  mode: AiRequestMode,
  body: Omit<AiTutorRequestBody, "mode"> & { pdfGuideContext?: Record<string, unknown> | null },
): Promise<AiTutorResponse> {
  const path = PATH_BY_MODE[mode];
  const url = `${apiBase()}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, ...body } satisfies AiTutorRequestBody),
  });
  if (res.status === 429) {
    throw new Error("rate_limited");
  }
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `http_${res.status}`);
  }
  return (await res.json()) as AiTutorResponse;
}

export async function checkAiHealth(): Promise<{ ok: boolean; hasKey: boolean } | null> {
  if (!apiBase()) return null;
  try {
    const url = `${apiBase()}/api/ai/health`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as { ok: boolean; hasKey: boolean };
  } catch {
    return null;
  }
}
