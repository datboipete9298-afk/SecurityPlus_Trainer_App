import "dotenv/config";
import type { AiRequestMode, AiTutorRequestBody } from "../../src/types/aiTutor";
import { askTutor } from "../../server/aiCore";
import { clientKey, rateLimitHit } from "../../server/rateLimit";

function isMode(x: unknown): x is AiRequestMode {
  return (
    x === "tutor" ||
    x === "explain" ||
    x === "note-feedback" ||
    x === "quiz-help" ||
    x === "lab-coach"
  );
}

type ReqLike = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  socket?: { remoteAddress?: string };
};

type ResLike = {
  status: (n: number) => ResLike;
  json: (x: unknown) => void;
  setHeader?: (k: string, v: string) => void;
};

function clientIp(req: ReqLike): string | undefined {
  const fwd = req.headers?.["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0]?.trim();
  if (Array.isArray(fwd) && fwd[0]) return fwd[0].split(",")[0]?.trim();
  return req.socket?.remoteAddress;
}

export async function handleAiPost(req: ReqLike, res: ResLike, defaultMode: AiRequestMode): Promise<void> {
  if (req.method && req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const ip = clientKey(clientIp(req));
  if (rateLimitHit(ip)) {
    res.status(429).json({ error: "Too many requests. Try again in a minute." });
    return;
  }

  const body = (req.body ?? {}) as Partial<AiTutorRequestBody>;
  const mergedMode = isMode(body.mode) ? body.mode : defaultMode;

  try {
    const out = await askTutor({
      mode: mergedMode,
      lesson: (body.lesson as Record<string, unknown> | null) ?? null,
      userQuestion: body.userQuestion,
      userProgress: (body.userProgress as Record<string, unknown> | null) ?? null,
      weakAreas: body.weakAreas,
      quizContext: (body.quizContext as Record<string, unknown> | null) ?? null,
      noteContext: (body.noteContext as Record<string, unknown> | null) ?? null,
      labContext: (body.labContext as Record<string, unknown> | null) ?? null,
      simpleMode: body.simpleMode === true,
    });
    res.status(200).json(out);
  } catch (e) {
    console.error("[vercel ai]", e);
    res.status(500).json({ error: "AI request failed" });
  }
}
