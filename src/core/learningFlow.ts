/**
 * Master pipeline: every feature routes through this order.
 * Lesson UI uses LESSON_BLOCK_ORDER; coach + stepper use PIPELINE.
 */

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
