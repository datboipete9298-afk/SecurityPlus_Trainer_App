import type { AiRequestMode, AiTutorResponse } from "../src/types/aiTutor";

export function isPdfGuideContextPresent(c: unknown): boolean {
  if (c == null || typeof c !== "object" || Array.isArray(c)) return false;
  return Object.keys(c as Record<string, unknown>).length > 0;
}

/**
 * Post-process model output when pdfGuideContext was sent: minimum structure,
 * anchor to section/lesson, highlight/write-down shapes.
 */
export function normalizePdfGuideAiResponse(
  r: AiTutorResponse,
  pdf: Record<string, unknown> | null | undefined,
  mode: AiRequestMode,
  userQuestion: string | undefined,
): AiTutorResponse {
  if (!isPdfGuideContextPresent(pdf)) return r;

  const sectionTitle = typeof pdf!.sectionTitle === "string" ? pdf!.sectionTitle.trim() : "";
  const lessonId = typeof pdf!.lessonId === "string" ? pdf!.lessonId.trim() : "";
  const summary = typeof pdf!.summary === "string" ? pdf!.summary.trim() : "";
  const mustHighlight = Array.isArray(pdf!.mustHighlight)
    ? (pdf!.mustHighlight as unknown[]).filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];

  const anchorShort = (sectionTitle || lessonId || "this section").slice(0, 72);

  const referencesAnchor = (text: string): boolean => {
    const t = text.toLowerCase();
    if (sectionTitle) {
      const frag = sectionTitle.toLowerCase().slice(0, Math.min(28, sectionTitle.length));
      if (frag.length >= 4 && t.includes(frag)) return true;
    }
    if (lessonId && t.includes(lessonId.toLowerCase())) return true;
    return false;
  };

  let answer = (r.answer ?? "").trim();
  let keyPoints = (r.keyPoints ?? []).map((s) => String(s).trim()).filter(Boolean);
  let nextAction = (r.nextAction ?? "").trim();
  let examTip = (r.examTip ?? "").trim();
  let confidence = r.confidence;

  const q = (userQuestion ?? "").toLowerCase();

  if (!referencesAnchor(answer) && !keyPoints.some(referencesAnchor)) {
    answer = `[${sectionTitle || lessonId || "PDF guide"}] ${answer}`.trim();
  }

  while (keyPoints.length < 2) {
    const mh = mustHighlight[keyPoints.length];
    if (mh) keyPoints.push(`Must-highlight: ${mh.length > 100 ? `${mh.slice(0, 97)}…` : mh}`);
    else if (summary)
      keyPoints.push(`Section gist: ${summary.length > 100 ? `${summary.slice(0, 97)}…` : summary}`);
    else keyPoints.push(`SY0-701: In your PDF for “${anchorShort}”, mark one definition the exam could quote.`);
  }

  if (nextAction.length < 12) {
    nextAction = `Open your notes PDF to “${anchorShort}”, search that heading, save one highlight hook, then one Brain Book row with an exam keyword.`;
  }

  if (examTip.length < 10) {
    examTip = "Match stem trigger words to the tightest SY0-701 definition or control—eliminate long story answers first.";
  }

  if (mode === "tutor" && (q.includes("highlight") || q.includes("what should i highlight") || q.includes("hooks"))) {
    const words = answer.split(/\s+/).length;
    if (words > 85) {
      const parts = answer.split(/(?<=[.!?])\s+/).filter(Boolean);
      answer = `${parts.slice(0, 2).join(" ")} Use the bullets only as your in-PDF mark list.`.trim();
    }
    keyPoints = keyPoints.map((k) => (k.length > 110 ? `${k.slice(0, 107)}…` : k));
  }

  if (
    mode === "tutor" &&
    ((q.includes("write") && (q.includes("down") || q.includes("brain"))) ||
      q.includes("brain book") ||
      q.includes("what should i write"))
  ) {
    const hasLabeledBlock =
      keyPoints.some((k) => /^topic\s*:/i.test(k)) &&
      keyPoints.some((k) => /^simple meaning\s*:/i.test(k)) &&
      keyPoints.some((k) => /^exam keyword\s*:/i.test(k)) &&
      keyPoints.some((k) => /^memory trick\s*:/i.test(k));
    if (!hasLabeledBlock) {
      const topic0 = sectionTitle || lessonId || mustHighlight[0] || "This objective";
      keyPoints = [
        `Topic: ${topic0.length > 70 ? `${topic0.slice(0, 67)}…` : topic0}`,
        `Simple meaning: One line in your own words—state the rule the exam would test (not a PDF quote).`,
        `Exam keyword: One word or short phrase CompTIA would put in the stem.`,
        `Memory trick: One short mnemonic tied to “${anchorShort}”.`,
        ...keyPoints.slice(0, 2),
      ];
    }
  }

  const citesMust =
    mustHighlight.length > 0 &&
    keyPoints.some((k) =>
      mustHighlight.some((m) => k.toLowerCase().includes(m.toLowerCase().slice(0, Math.min(14, m.length)))),
    );

  if (confidence === "high" && !citesMust && !referencesAnchor(answer)) {
    confidence = "medium";
  }

  return { answer, keyPoints, examTip, nextAction, confidence };
}
