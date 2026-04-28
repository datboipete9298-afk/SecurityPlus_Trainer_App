/**
 * Micro-encouragement copy — short, deterministic, never spammy.
 *
 * Pulled at meaningful moments only (lesson complete, note saved, quiz finish).
 * Deterministic via a numeric seed so the same context picks the same line.
 */

const CONFIDENCE_LINES = [
  "You’re making real progress.",
  "This is exactly how you improve.",
  "You’re getting closer to passing.",
  "Steady reps — this is what works.",
  "That kind of practice sticks.",
] as const;

const NEXT_LINES_AFTER_NOTE = [
  "Next: try a 3-question quick check when you’re ready.",
  "Next: open the mini-quiz to lock it in.",
  "Next: one quick check turns this note into recall.",
] as const;

const NEXT_LINES_AFTER_QUIZ = [
  "Next: tap Continue — your next move is queued.",
  "Next: review one miss, then move on.",
  "Next: keep the loop going — Continue picks where to go.",
] as const;

const NEXT_LINES_AFTER_LESSON = [
  "Next: Continue on Home picks the smartest follow-up.",
  "Next: tap Continue — momentum compounds.",
  "Next: keep the streak — Continue knows what’s next.",
] as const;

function hashSeed(seed: string | number): number {
  if (typeof seed === "number") return Math.max(0, Math.floor(seed));
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

function pick<T>(pool: readonly T[], seed: string | number): T {
  return pool[hashSeed(seed) % pool.length]!;
}

export function pickConfidenceLine(seed: string | number): string {
  return pick(CONFIDENCE_LINES, seed);
}

export type NextLineContext = "after-note" | "after-quiz" | "after-lesson";

export function pickNextLine(context: NextLineContext, seed: string | number): string {
  switch (context) {
    case "after-note":
      return pick(NEXT_LINES_AFTER_NOTE, seed);
    case "after-quiz":
      return pick(NEXT_LINES_AFTER_QUIZ, seed);
    case "after-lesson":
      return pick(NEXT_LINES_AFTER_LESSON, seed);
  }
}

/** Combine confidence + next line for moments that benefit from both (e.g. quiz finish). */
export function buildMomentumPair(context: NextLineContext, seed: string | number): { confidence: string; next: string } {
  return {
    confidence: pickConfidenceLine(seed),
    next: pickNextLine(context, seed),
  };
}
