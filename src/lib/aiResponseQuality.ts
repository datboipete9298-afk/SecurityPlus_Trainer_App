import type { AiRequestMode, AiTutorResponse } from "../types/aiTutor";

/**
 * True when the model (or proxy) returned something too thin, generic, or
 * tautological to trust as the only guidance. Triggers fallback to coach.
 */
export function isWeakAiResponse(r: AiTutorResponse | Partial<AiTutorResponse> | null | undefined): boolean {
  if (!r || typeof r.answer !== "string") return true;
  const a = r.answer.trim();

  // 1) Too short to be useful.
  if (a.length < 28) return true;

  // 2) Refusal / scaffold templates. Short refusal — fall back; long refusal — let it through.
  if (/^(error|sorry|i cannot|i can't|as an ai|i'm just|i'm sorry)/i.test(a) && a.length < 100) return true;

  // 3) Empty / whitespace-only text after stripping markdown fences.
  const stripped = a.replace(/```[\s\S]*?```/g, "").replace(/[*_`>#-]+/g, " ").replace(/\s+/g, " ").trim();
  if (stripped.length < 24) return true;

  // 4) Generic platitudes that add no exam value (sample patterns).
  const lc = stripped.toLowerCase();
  const platitudes = [
    "study harder",
    "you should study more",
    "good luck",
    "review the lesson",
    "consult a teacher",
    "this is a great question",
    "it depends",
  ];
  if (platitudes.some((p) => lc === p || lc.startsWith(p + ".") || lc === p + ".")) return true;

  // 5) Key points sanity: must have ≥ 2 distinct, non-trivial bullets.
  const kp = Array.isArray(r.keyPoints) ? r.keyPoints.map((x) => String(x).trim()).filter(Boolean) : [];
  if (kp.length < 2) return true;
  const distinctKp = new Set(kp.map((k) => k.toLowerCase().replace(/\s+/g, " ")));
  if (distinctKp.size < 2) return true; // duplicates collapsed → weak
  if (kp.every((k) => k.length < 12)) return true; // all bullets too short to teach anything

  // 6) Next-action must be present and non-trivial (10+ chars).
  const na = r.nextAction != null ? String(r.nextAction).trim() : "";
  if (na.length < 10) return true;

  // 7) Tautological answer: > 60% of the words in `answer` repeat across `keyPoints` —
  //    the response is just rehashing itself. (Cheap word-set Jaccard.)
  const ansSet = new Set(stripped.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const kpAll = kp.join(" ").toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  const overlap = kpAll.filter((w) => ansSet.has(w)).length;
  if (kpAll.length >= 8 && overlap / kpAll.length > 0.85) return true;

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
  // Snapshot ORIGINAL strength signals BEFORE we pad — used to downgrade an
  // over-confident response that didn't actually supply enough structure.
  const originalKeyPointCount = Array.isArray(r.keyPoints)
    ? r.keyPoints.map((x) => String(x).trim()).filter(Boolean).length
    : 0;
  const originalExamTipLen = (r.examTip ?? "").trim().length;
  const originalNextActionLen = (r.nextAction ?? "").trim().length;

  let keyPoints = [...(r.keyPoints ?? [])].map((x) => String(x).trim()).filter(Boolean);
  if (keyPoints.length < 1) keyPoints = [...defaults.kp];
  if (keyPoints.length === 1) keyPoints = [...keyPoints, defaults.kp[1]!];
  let examTip = (r.examTip ?? "").trim();
  if (examTip.length < 12) examTip = defaults.examTip;
  let nextAction = (r.nextAction ?? "").trim();
  if (nextAction.length < 10) nextAction = defaults.nextAction;
  let confidence = r.confidence ?? "medium";
  // If the model claimed "high" but the ORIGINAL response was thin in any way,
  // demote — the enforced fields are scaffolding, not the model's signal.
  if (
    confidence === "high" &&
    (originalKeyPointCount < 2 || originalExamTipLen < 12 || originalNextActionLen < 10)
  ) {
    confidence = "medium";
  }

  return { answer, keyPoints, examTip, nextAction, confidence };
}
