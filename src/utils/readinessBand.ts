import type { Readiness } from "../types";

export type ReadinessTrack = {
  headline: string;
  sub: string;
};

/** Human-friendly progress band — complements numeric readiness score. */
export function readinessTrack(score: number, label: Readiness): ReadinessTrack {
  if (label === "exam_ready" || score >= 80) {
    return { headline: "Exam ready", sub: "Keep mixing practice so it stays automatic." };
  }
  if (label === "almost" || score >= 55) {
    return { headline: "Almost ready", sub: "Strong base — polish weak domains and PBQs." };
  }
  if (label === "building" || score >= 28) {
    return { headline: "Getting it", sub: "You’re on track — steady reps beat cramming." };
  }
  return { headline: "Just started", sub: "You’re on track — small daily blocks add up fast." };
}
