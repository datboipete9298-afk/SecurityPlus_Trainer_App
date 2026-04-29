import type { AiRequestMode, AiTutorResponse } from "../src/types/aiTutor";
import { getChatModel, getOpenAI } from "./openaiClient";
import { systemPromptForMode, userPayloadSummary, maxTokensForPrompt } from "./prompts";
import { sanitizeUserQuestion } from "./safety";
import { isPdfGuideContextPresent, normalizePdfGuideAiResponse } from "./pdfGuideAiGuards";

function emptyResponse(reason: string): AiTutorResponse {
  return {
    answer: reason,
    keyPoints: [],
    examTip: "Use Smart Coach tips in-app when AI is unavailable.",
    nextAction: "Review the lesson highlights and try one practice question.",
    confidence: "low",
  };
}

function tryParseAiJson(s: string): AiTutorResponse | null {
  try {
    const obj = JSON.parse(s) as Partial<AiTutorResponse>;
    if (!obj || typeof obj.answer !== "string") return null;
    const keyPoints = Array.isArray(obj.keyPoints)
      ? obj.keyPoints.filter((x): x is string => typeof x === "string")
      : [];
    const examTip = typeof obj.examTip === "string" ? obj.examTip : "";
    const nextAction = typeof obj.nextAction === "string" ? obj.nextAction : "";
    const conf =
      obj.confidence === "low" || obj.confidence === "medium" || obj.confidence === "high" ? obj.confidence : "medium";
    return { answer: obj.answer, keyPoints, examTip, nextAction, confidence: conf };
  } catch {
    return null;
  }
}

function parseJsonContent(content: string): AiTutorResponse | null {
  const trimmed = content.trim();
  const direct = tryParseAiJson(trimmed);
  if (direct) return direct;
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return tryParseAiJson(trimmed.slice(start, end + 1));
  return null;
}

export type AskTutorInput = {
  mode: AiRequestMode;
  lesson?: Record<string, unknown> | null;
  userQuestion?: string;
  userProgress?: Record<string, unknown> | null;
  weakAreas?: string[];
  quizContext?: Record<string, unknown> | null;
  noteContext?: Record<string, unknown> | null;
  labContext?: Record<string, unknown> | null;
  pdfGuideContext?: Record<string, unknown> | null;
  localPdfSnippets?: { fileName: string; pageIndex: number; excerpt: string }[] | null;
  simpleMode?: boolean;
};

export async function askTutor(input: AskTutorInput): Promise<AiTutorResponse> {
  const sq = sanitizeUserQuestion(input.userQuestion);
  const hasPdf = isPdfGuideContextPresent(input.pdfGuideContext);

  const client = getOpenAI();
  if (!client) {
    return normalizePdfGuideAiResponse(
      emptyResponse("AI is not configured (missing OPENAI_API_KEY)."),
      input.pdfGuideContext as Record<string, unknown> | undefined,
      input.mode,
      sq.text || undefined,
    );
  }

  if (!sq.ok) {
    return normalizePdfGuideAiResponse(
      emptyResponse(sq.reason ?? "Invalid question."),
      input.pdfGuideContext as Record<string, unknown> | undefined,
      input.mode,
      undefined,
    );
  }

  const payload: Record<string, unknown> = {
    lesson: input.lesson ?? undefined,
    userProgress: input.userProgress ?? undefined,
    weakAreas: input.weakAreas ?? undefined,
    quizContext: input.quizContext ?? undefined,
    noteContext: input.noteContext ?? undefined,
    labContext: input.labContext ?? undefined,
    pdfGuideContext: input.pdfGuideContext ?? undefined,
    localPdfSnippets: input.localPdfSnippets ?? undefined,
    userQuestion: sq.text || undefined,
  };

  const userContent =
    (sq.text ? `Learner question:\n${sq.text}\n\n` : "") +
    `Context JSON:\n${userPayloadSummary(input.mode, payload)}`;

  const simple = !!input.simpleMode;
  const completion = await client.chat.completions.create({
    model: getChatModel(),
    temperature: simple ? 0.3 : 0.35,
    max_tokens: maxTokensForPrompt(simple),
    messages: [
      { role: "system", content: systemPromptForMode(input.mode, { simple, hasPdfGuideContext: hasPdf }) },
      { role: "user", content: userContent },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim() ?? "";
  const parsed = parseJsonContent(content);
  if (parsed) {
    return normalizePdfGuideAiResponse(parsed, input.pdfGuideContext as Record<string, unknown> | undefined, input.mode, sq.text || undefined);
  }

  const rough: AiTutorResponse = {
    answer: content.slice(0, 2000) || "No response from model.",
    keyPoints: [],
    examTip: "Re-read the objective wording; Security+ loves precise definitions.",
    nextAction: "Try rewriting your question in one sentence.",
    confidence: "low",
  };
  return normalizePdfGuideAiResponse(rough, input.pdfGuideContext as Record<string, unknown> | undefined, input.mode, sq.text || undefined);
}
