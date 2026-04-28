import type { AiRequestMode, AiTutorRequestBody, AiTutorResponse } from "../types/aiTutor";

/** Browser fetch timeout — prevents “checking forever” when API host is unreachable. */
const POST_AI_TIMEOUT_MS = 18_000;
const HEALTH_CHECK_TIMEOUT_MS = 7_500;

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

async function timedFetch(input: RequestInfo | URL, init: RequestInit | undefined, ms: number): Promise<Response> {
  const AnySignal = (
    globalThis as typeof globalThis & {
      AbortSignal?: typeof AbortSignal & { timeout?: (n: number) => AbortSignal };
    }
  ).AbortSignal;
  if (AnySignal?.timeout) {
    return fetch(input, { ...init, signal: AnySignal.timeout(ms) });
  }
  const c = new AbortController();
  const t = window.setTimeout(() => c.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: c.signal });
  } finally {
    window.clearTimeout(t);
  }
}

export async function postAi(
  mode: AiRequestMode,
  body: Omit<AiTutorRequestBody, "mode"> & { pdfGuideContext?: Record<string, unknown> | null },
): Promise<AiTutorResponse> {
  const path = PATH_BY_MODE[mode];
  const url = `${apiBase()}${path}`;
  try {
    const res = await timedFetch(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, ...body } satisfies AiTutorRequestBody),
      },
      POST_AI_TIMEOUT_MS,
    );
    if (res.status === 429) {
      throw new Error("rate_limited");
    }
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || `http_${res.status}`);
    }
    return (await res.json()) as AiTutorResponse;
  } catch (e) {
    const abort = e instanceof Error && (e.name === "AbortError" || e.message.includes("timed out"));
    if (abort) throw new Error("ai_network_timeout");
    throw e instanceof Error ? e : new Error("ai_unknown");
  }
}

export async function checkAiHealth(): Promise<{ ok: boolean; hasKey: boolean } | null> {
  if (!apiBase()) return null;
  try {
    const url = `${apiBase()}/api/ai/health`;
    const res = await timedFetch(url, undefined, HEALTH_CHECK_TIMEOUT_MS);
    if (!res.ok) return null;
    return (await res.json()) as { ok: boolean; hasKey: boolean };
  } catch {
    return null;
  }
}
