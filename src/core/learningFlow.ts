/**
 * Master pipeline: every feature routes through this order.
 * Lesson UI uses LESSON_BLOCK_ORDER; coach + stepper use PIPELINE.
 */

import type { LessonProgress } from "../types/beginner";

export const LEARNING_PIPELINE = [
  { id: "watch", order: 1, label: "Watch", blurb: "Messer video + mark watched" },
  { id: "highlight", order: 2, label: "Highlight", blurb: "3–8 hooks in your notes" },
  { id: "understand", order: 3, label: "Understand", blurb: "Plain English + what to listen for" },
  { id: "apply", order: 4, label: "Apply", blurb: "Hands-on (quick action + optional lab)" },
  { id: "test", order: 5, label: "Test", blurb: "Mini-quiz" },
  { id: "recall", order: 6, label: "Recall", blurb: "Flashcards" },
  { id: "track", order: 7, label: "Track", blurb: "Brain Book + teach-back" },
  { id: "coach", order: 8, label: "Coach feedback", blurb: "Dashboard + next best move" },
] as const;

/** One place for lesson screen section titles (order enforced in LessonPage). */
export const LESSON_BLOCK_ORDER = [
  { key: "watch", emoji: "🎥", title: "Watch Video" },
  { key: "highlight", emoji: "🟡", title: "What to Highlight" },
  { key: "understand", emoji: "🧠", title: "Understand" },
  { key: "hackers", emoji: "⚔️", title: "Why Hackers Care" },
  { key: "defend", emoji: "🛡️", title: "How It’s Defended" },
  { key: "handsOn", emoji: "⚡", title: "Do This Now" },
  { key: "quiz", emoji: "🧪", title: "Quick Quiz" },
  { key: "flashcards", emoji: "🔁", title: "Flashcard Recall" },
  { key: "examIntel", emoji: "🎯", title: "Exam Intelligence" },
  { key: "complete", emoji: "✅", title: "Complete & Next" },
] as const;

export type LessonBlockKey = (typeof LESSON_BLOCK_ORDER)[number]["key"];

/** What to prioritize on the lesson screen — drives the “Do this now” banner. */
export function getLessonDoNowHint(
  p: LessonProgress,
  opts: { hasLab: boolean; handsOnComplete?: boolean },
): { headline: string; detail: string; then: string } {
  const ho = opts.handsOnComplete ?? true;
  if (!p.videoWatched) {
    return {
      headline: "Watch the video",
      detail: "Start the embed below. Pausing to jot hooks is expected — perfection isn’t.",
      then: "After that, capture highlights (step 2).",
    };
  }
  if (!p.highlightsDone) {
    return {
      headline: "Save your hooks",
      detail: "In step 2, paste 3–8 short bullets into your notes — not paragraphs.",
      then: "Then add one Brain Book row.",
    };
  }
  if (!p.notesSaved) {
    return {
      headline: "One Brain Book row",
      detail: "Topic + plain meaning + one exam keyword from the MUST list.",
      then: "Next: acknowledge the quick action.",
    };
  }
  if (!p.quickActionDone) {
    return {
      headline: "Do the quick action",
      detail: "The small hands-on cue in Apply — stays on your machine; follow the checklist.",
      then: ho ? "Then open the quiz block." : "Hands-on training still needs labs / sims / decision below.",
    };
  }
  if (!ho) {
    return {
      headline: "Finish hands-on training",
      detail: "Scroll to Hands-on: complete two labs, two branching sims, and the decision checkpoint.",
      then: "The quiz stays easier once your fingers have done the work.",
    };
  }
  if (opts.hasLab && !p.labDone) {
    return {
      headline: "Optional lab checkpoint",
      detail: "If this lesson surfaced a standalone lab pill, knock it out while the video is fresh.",
      then: "Then take the quiz while patterns are vivid.",
    };
  }
  if (!p.quizCompleted) {
    return {
      headline: "Run the quiz",
      detail: "Lesson quiz reinforces trap patterns — read explanations even when you’re right.",
      then: "Flashcards come next.",
    };
  }
  if (!p.flashcardsReviewed) {
    return {
      headline: "Clear flashcards",
      detail: "Hit the Recall block until today’s reps feel boring.",
      then: "Finish the teach-back line if prompted.",
    };
  }
  if (!p.teachBackDone) {
    return {
      headline: "Say it aloud",
      detail: "One breath summary in the teach-back box locks transfer.",
      then: "Mark lesson complete → Home refreshes your next move.",
    };
  }
  return {
    headline: "Wrap up",
    detail: "You’ve ticked each pipeline step — polish anything that still feels fuzzy.",
    then: "Tap Complete, then Do this next on Home picks your next Messer-aligned move.",
  };
}

/** Short labels for “Step N: …” — matches `StepSection` stepIndex 1–10. */
export const LESSON_STEP_FOCUS: Record<number, string> = {
  1: "Watch",
  2: "Highlight",
  3: "Understand",
  4: "Why it matters",
  5: "How it’s defended",
  6: "Hands-on practice",
  7: "Quick quiz",
  8: "Flashcards",
  9: "Exam intelligence",
  10: "Complete and next",
};
