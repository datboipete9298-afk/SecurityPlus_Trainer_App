import type { AiTutorResponse } from "../types/aiTutor";

export type FallbackHints = {
  coachLines?: string[];
  lessonTitle?: string;
  sectionId?: string;
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
      `\n\n**PDF focus:** you’re anchored to “${hints.pdfSectionTitle}”${hints.pdfLessonId ? ` (lesson ${hints.pdfLessonId})` : ""}. Search that exact phrase, mark one MUST line, mirror it into Brain Book — that’s deliberate exam prep, not busywork.`
    : "";

  const baseKp =
    lines.length >= 3 ?
      [lines[0]!, lines[1]!, lines[2]!, lines[3] ?? "Close the loop — one retrieval action (quiz, flashcard, or PDF line) in the next 3 minutes."]
    : [
        "Name the one rule the exam would bold-face (don’t paraphrase into mush).",
        "Give the fastest wrong answer people pick — and the five-word fix.",
        "Pick your next move: PDF search, one flashcard, or one quiz retry (choose one, finish it).",
        `Stay inside ${where} so today’s reps stack instead of drifting topics.`,
      ];

  return {
    answer:
      `**Guided coach (offline link)** — the live assistant is paused, but you’re still on-script.\n\n` +
      `**Why you’re seeing this:** the app refuses to silently fail — structured steps beat empty chatter until the connection returns.` +
      pdfAnchor +
      `\n\n**Trust this rhythm:** skim → retrieve → explain once → tiny write — same loop Security+ rewards.`,
    keyPoints: baseKp,
    examTip: "Stem keyword → shortest defensible definition → eliminate trap answers that introduce new nouns.",
    nextAction: `Spend the next six minutes entirely on ${where}: one honest retrieval, one note line, zero tab-hopping.`,
    confidence: "medium",
  };
}

export function rateLimitedAiResponse(): AiTutorResponse {
  return {
    answer:
      "**Rate limit:** the tutor will refresh in about a minute — that protects quality (and tokens) so answers stay purposeful instead of sprayed.\n\n**Use this pause:** rehearse the last explanation aloud, then try the same stem without peeking.",
    keyPoints: [
      "Treat the throttle as spaced retrieval — boredom here is rehearsal for exam pacing.",
      "Re-read the on-screen explanation — it is always available and exam-shaped.",
      "Jot one exam keyword you almost ignored; that’s the fix you’ll remember.",
    ],
    examTip: "If you feel rushed, slow the stem read — CompTIA hides traps in adjectives and scopes.",
    nextAction: "Walk through the last wrong answer’s logic in one breath, then retry when the button unblocks.",
    confidence: "high",
  };
}

export function examModeAiLockedResponse(): AiTutorResponse {
  return {
    answer:
      "**Exam mode discipline:** AI stays dark until you finish — same constraint as test day, so you practice choosing under uncertainty.\n\n**After submit:** unlock explanations, AI, and flashcards for repair — that’s when coaching matters most.",
    keyPoints: [
      "Mark uncertain items and move on — time strategy is part of the score.",
      "Post-review: turn each miss into one flashcard front/back.",
      "Switch to Study mode anytime you need line-by-line help before the next attempt.",
    ],
    examTip: "Flag + skip beats staring — you can return if time allows; the real exam punishes blank bubbles more than educated guesses.",
    nextAction: "Finish the attempt, then attack review like a second pass exam.",
    confidence: "high",
  };
}
