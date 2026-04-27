import type { QuizQuestion } from "../types";
import type { DomainId } from "../types";

/** Tier 0–3: higher = learner needs simpler, more concrete help. */
export type AdaptiveTier = 0 | 1 | 2 | 3;

export function computeAdaptiveTier(opts: {
  missStreakOnQuestion: number;
  falseConfidenceHits: number;
  confusionHitsOnConcept: number;
}): AdaptiveTier {
  let t = 0;
  if (opts.missStreakOnQuestion >= 2) t = Math.max(t, 1);
  if (opts.missStreakOnQuestion >= 3) t = Math.max(t, 3);
  if (opts.falseConfidenceHits >= 1) t = Math.max(t, 2);
  if (opts.confusionHitsOnConcept >= 2) t = Math.max(t, 2);
  return Math.min(3, t) as AdaptiveTier;
}

export function conceptKey(lessonId: string, examKeyword: string): string {
  const first = examKeyword.split(",")[0]?.trim().toLowerCase() || "general";
  return `${lessonId}:${first}`;
}

export function buildThinkingTraining(q: QuizQuestion, correct: boolean): string {
  const kw = q.examKeyword;
  if (q.type === "scenario" || q.type === "best") {
    return [
      "**How to think about this question:**",
      "1) Strip the story to one sentence: what is being *decided*?",
      "2) Map each option to a control goal (prevent / detect / respond / govern).",
      `3) Tie the best fit to exam language around: **${kw}**.`,
      correct
        ? "You matched the pattern — next time, run the same 3 checks in ~15 seconds."
        : "Wrong pick: which step above did the trap bypass? Re-run mentally before locking an answer.",
    ].join("\n");
  }
  if (q.correctIndices?.length) {
    return [
      "**How to think (multi-select):**",
      "Treat each option as a mini true/false against the stem.",
      "Don’t stop at the first correct-looking line — scan all options for exam pairs (e.g., preventive vs detective).",
      `Anchor vocabulary: **${kw}**.`,
    ].join("\n");
  }
  return [
    "**How to think:**",
    "Read the stem for absolutes: BEST, FIRST, MOST, NOT — they change the winner.",
    "Eliminate the option that solves the wrong layer (policy vs technical vs physical).",
    `Keyword hook: **${kw}**.`,
  ].join("\n");
}

export function buildAdaptiveAddendum(opts: {
  tier: AdaptiveTier;
  correct: boolean;
  falseConfidence: boolean;
  confusionHits: number;
}): string {
  const parts: string[] = [];
  if (!opts.correct && opts.falseConfidence) {
    parts.push(
      "**Adaptive note:** You were very confident but missed — slow down: list *why* each wrong option fails before you commit next time.",
    );
  }
  if (opts.confusionHits >= 2) {
    parts.push(
      "**Pattern:** Similar ideas in this lesson are getting tangled. Use a two-column compare (definition vs symptom) on paper once, then retry.",
    );
  }
  if (!opts.correct) {
    if (opts.tier >= 3) {
      parts.push(
        "**Simpler framing:** Ignore jargon first — what bad thing stops, and what good thing is restored? Pick the option that matches that outcome.",
      );
      parts.push("**Drill:** Restate the rule in 10 words, then map options to those words only.");
    } else if (opts.tier === 2) {
      parts.push("**Step-by-step:** Cross out answers that fix a different problem than the stem describes.");
      parts.push("**Example:** Add one concrete device, team, or log type so the correct rule sticks.");
    } else if (opts.tier === 1) {
      parts.push("**Second miss:** Focus on the *primary* impact word in the scenario.");
    }
  }
  return parts.join("\n\n");
}

/** Teach-back gate — returns ok + score for analytics. */
export function microTeachBackQuality(text: string): { ok: boolean; score: number; hint: string } {
  const t = text.trim();
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 6) {
    return { ok: false, score: words.length < 3 ? 0 : 1, hint: "Add a bit more — aim for one clear cause → one clear exam hook." };
  }
  if (t.length < 40) {
    return { ok: false, score: 2, hint: "Almost there — connect the idea to how CompTIA would phrase the objective." };
  }
  return { ok: true, score: 3, hint: "Solid — that’s enough to move on." };
}

export function domainWeakList(domainScore: Record<string, number>, threshold = 55): DomainId[] {
  return (["1", "2", "3", "4", "5"] as DomainId[]).filter((d) => (domainScore[d] ?? 50) < threshold);
}

export function isKeyQuizQuestion(q: QuizQuestion, indexInDeck: number): boolean {
  if (q.difficulty >= 3) return true;
  if ((indexInDeck + 1) % 4 === 0) return true;
  return false;
}
