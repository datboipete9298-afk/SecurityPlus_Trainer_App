import type { AiTutorResponse } from "../types/aiTutor";

export type FallbackHints = {
  /** Short lines from deterministic coach / heuristics */
  coachLines?: string[];
  lessonTitle?: string;
  sectionId?: string;
  /** PDF guided study — keeps fallback anchored to the same section */
  pdfSectionTitle?: string;
  pdfLessonId?: string;
};

export function smartCoachOfflineResponse(hints: FallbackHints): AiTutorResponse {
  const lines = hints.coachLines?.filter(Boolean).slice(0, 4) ?? [];
  const where = hints.lessonTitle
    ? `${hints.lessonTitle}${hints.sectionId ? ` (${hints.sectionId})` : ""}`
    : hints.sectionId ?? "this section";
  const pdfAnchor =
    hints.pdfSectionTitle ?
      ` You’re in PDF guide “${hints.pdfSectionTitle}”${hints.pdfLessonId ? ` (lesson ${hints.pdfLessonId})` : ""} — search that phrase in your notes PDF, mark one MUST-highlight hook, then one Brain Book row.`
    : "";
  return {
    answer:
      "You’re still fully covered: this isn’t a broken app. The live AI model is unavailable, empty, or too thin — Smart Coach, lesson traps, quiz explanations, and flashcards still work without it. Use the bullets below as your guaranteed next moves; turn live AI back on when your server or key is ready." +
      pdfAnchor,
    keyPoints:
      lines.length > 0
        ? lines
        : [
            "Re-read the lesson MUST highlights (3–6 hooks, not paragraphs).",
            "Say the idea out loud in one sentence, then check the quiz explanation.",
            "Add one exam keyword you expect to see in a stem.",
          ],
    examTip: "Security+ rewards recognition: match the stem’s trigger word to the best definition, not the longest story.",
    nextAction: `Next 3 minutes on ${where}: one PDF search phrase, one highlight hook, one quiz retry (or one flashcard).`,
    confidence: "medium",
  };
}

export function rateLimitedAiResponse(): AiTutorResponse {
  return {
    answer:
      "Too many requests right now — the server is protecting itself. Wait a minute, then try again. Meanwhile, read the question explanation or use Smart Coach tips on this screen.",
    keyPoints: ["Take a short break — rate limits reset quickly.", "Study mode explanations are always available.", "One quiz miss reviewed beats ten rushed AI questions."],
    examTip: "On exam day there’s no tutor — practicing with explanations first builds real recall.",
    nextAction: "Review the last explanation out loud, then retry this question in two minutes.",
    confidence: "high",
  };
}

export function examModeAiLockedResponse(): AiTutorResponse {
  return {
    answer:
      "During Exam mode, AI help stays off until you submit the full attempt — same discipline as the real test. Finish the run, then use AI on the review screen or switch to Study mode.",
    keyPoints: ["No per-question AI during timed exam flow.", "After submit: review + AI explain is allowed.", "Use Study mode anytime for question-by-question help."],
    examTip: "On exam day you won’t get explanations mid-item — practice sitting with uncertainty here.",
    nextAction: "Submit the exam, then open a missed item in Study mode or ask AI on the review page.",
    confidence: "high",
  };
}
