import type { AiRequestMode, AiTutorResponse } from "../types/aiTutor";

/** True when the model (or proxy) returned something too thin to trust as the only guidance. */
export function isWeakAiResponse(r: AiTutorResponse | Partial<AiTutorResponse> | null | undefined): boolean {
  if (!r || typeof r.answer !== "string") return true;
  const a = r.answer.trim();
  if (a.length < 28) return true;
  if (/^(error|sorry|i cannot|i can't|as an ai)/i.test(a) && a.length < 100) return true;
  const kp = Array.isArray(r.keyPoints) ? r.keyPoints.filter((x) => String(x).trim().length > 0) : [];
  if (kp.length < 1) return true;
  const na = r.nextAction != null ? String(r.nextAction).trim() : "";
  if (na.length < 10) return true;
  return false;
}

/**
 * Ensures every response has actionable structure. Call after a successful HTTP parse;
 * does not invent long prose — fills gaps with exam-shaped defaults.
 */
export function enforceStructuredAiResponse(r: AiTutorResponse, _mode: AiRequestMode): AiTutorResponse {
  const defaults = {
    examTip: "Match the stem’s trigger word to the tightest definition — eliminate the longest story answers first.",
    nextAction: "Say the correct rule out loud in one sentence, then retry one question without rushing.",
    kp: [
      "State the governing rule in one line (include an exam keyword).",
      "Name the distractor pattern you almost picked.",
      "Do one concrete action in the next 2 minutes (quiz, flashcard, or PDF search).",
    ],
  };
  let answer = (r.answer ?? "").trim();
  if (answer.length < 28) {
    answer = `${answer}\n\nHere’s a structured take while the model output was thin: use the key points below as your ground truth, then verify against the lesson or quiz explanation.`.trim();
  }
  let keyPoints = [...(r.keyPoints ?? [])].map((x) => String(x).trim()).filter(Boolean);
  if (keyPoints.length < 1) keyPoints = [...defaults.kp];
  if (keyPoints.length === 1) keyPoints = [...keyPoints, defaults.kp[1]!];
  let examTip = (r.examTip ?? "").trim();
  if (examTip.length < 12) examTip = defaults.examTip;
  let nextAction = (r.nextAction ?? "").trim();
  if (nextAction.length < 10) nextAction = defaults.nextAction;
  let confidence = r.confidence ?? "medium";
  if (confidence === "high" && keyPoints.length < 2) confidence = "medium";

  return { answer, keyPoints, examTip, nextAction, confidence };
}
