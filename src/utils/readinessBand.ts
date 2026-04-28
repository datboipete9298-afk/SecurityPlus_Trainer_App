import type { Readiness } from "../types";
import { examDomainShortTitle } from "./identityPersonalization";

export type ReadinessTrackOpts = {
  /** E.g. "Domain 3 (Cryptography)" when that domain trails */
  weakestDomainHint?: string | null;
};

export type ReadinessTrack = {
  headline: string;
  sub: string;
};

/** Human-friendly progress band — conversational, not vague percentages. */
export function readinessTrack(score: number, label: Readiness, opts?: ReadinessTrackOpts): ReadinessTrack {
  const gap = opts?.weakestDomainHint;

  if (label === "exam_ready" || score >= 80) {
    return {
      headline: "You're in passing range — keep sharpening",
      sub:
        gap ?
          `Stay mixed-domain so nothing drifts — focus extra reps in ${gap}.`
        : "Keep alternating lessons and timed sets so retention stays sharp.",
    };
  }

  if (label === "almost" || score >= 55) {
    return {
      headline: "You're getting closer to passing-level comfort",
      sub:
        gap ?
          `You still need sharper timing in mixed questions — prioritize ${gap} in your next few sessions.`
        : "Layer mixed exams with targeted weak-area passes when linear study slows down.",
    };
  }

  if (label === "building" || score >= 28) {
    return {
      headline: "You're building the foundation exams expect",
      sub:
        gap ? `Momentum matters — carve focused reps in ${gap} until scores climb.`
        : "Small daily reps beat cramming.",
    };
  }

  return {
    headline: "You're laying the groundwork",
    sub: gap ? `Early stage is normal — start with clarity in ${gap}.` : "Consistency matters more than speed right now.",
  };
}

/** Lowest domain under ~58 becomes the human-readable “practice more here” cue. */
export function weakestDomainHintFromScores(domainScore: Record<string, number>): string | null {
  const pairs = [...Object.entries(domainScore)].sort((a, b) => a[1] - b[1]);
  const [d, val] = pairs[0] ?? [null, null];
  if (!d || val == null || val >= 58) return null;
  return `Domain ${d} (${examDomainShortTitle(d)})`;
}
