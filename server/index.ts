import "dotenv/config";
import cors from "cors";
import express from "express";
import type { AiRequestMode, AiTutorRequestBody } from "../src/types/aiTutor";
import { askTutor } from "./aiCore";
import { clientKey, rateLimitHit } from "./rateLimit";

const app = express();
const PORT = Number(process.env.AI_SERVER_PORT || 8787);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "512kb" }));

function isMode(x: unknown): x is AiRequestMode {
  return (
    x === "tutor" ||
    x === "explain" ||
    x === "note-feedback" ||
    x === "quiz-help" ||
    x === "lab-coach"
  );
}

async function handleAi(req: express.Request, res: express.Response, mode: AiRequestMode) {
  const ip = clientKey(req.ip || (req.socket?.remoteAddress as string | undefined));
  if (rateLimitHit(ip)) {
    res.status(429).json({ error: "Too many requests. Try again in a minute." });
    return;
  }

  const body = (req.body ?? {}) as Partial<AiTutorRequestBody>;
  const mergedMode = isMode(body.mode) ? body.mode : mode;

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
      pdfGuideContext: (body.pdfGuideContext as Record<string, unknown> | null) ?? null,
    });
    res.json(out);
  } catch (e) {
    console.error("[ai server]", e);
    res.status(500).json({ error: "AI request failed" });
  }
}

app.post("/api/ai/tutor", (req, res) => void handleAi(req, res, "tutor"));
app.post("/api/ai/explain", (req, res) => void handleAi(req, res, "explain"));
app.post("/api/ai/note-feedback", (req, res) => void handleAi(req, res, "note-feedback"));
app.post("/api/ai/quiz-help", (req, res) => void handleAi(req, res, "quiz-help"));
app.post("/api/ai/lab-coach", (req, res) => void handleAi(req, res, "lab-coach"));

app.get("/api/ai/health", (_req, res) => {
  res.json({ ok: true, hasKey: Boolean(process.env.OPENAI_API_KEY?.trim()) });
});

app.listen(PORT, () => {
  console.log(`AI server listening on http://localhost:${PORT}`);
});
