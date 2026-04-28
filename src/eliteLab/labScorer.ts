/** Order vs canonical — position-weighted score 0–100 */

export type TriageScoreResult = {
  score: number;
  maxScore: number;
  /** Kendall distance proxy: number of pairwise inversions vs canonical */
  inversions: number;
  normalized: number;
};

/**
 * Canonical is best-first order (lowest priority rank = first).
 * User order is same semantics: first = top of their queue.
 */
export function scoreTriageOrder(userOrderIds: string[], canonicalPriorityIds: string[]): TriageScoreResult {
  const n = canonicalPriorityIds.length;
  if (n === 0) {
    return { score: 100, maxScore: 100, inversions: 0, normalized: 1 };
  }

  const pos = new Map<string, number>();
  canonicalPriorityIds.forEach((id, i) => pos.set(id, i));

  let inversions = 0;
  for (let i = 0; i < userOrderIds.length; i++) {
    for (let j = i + 1; j < userOrderIds.length; j++) {
      const a = userOrderIds[i]!;
      const b = userOrderIds[j]!;
      const pa = pos.get(a);
      const pb = pos.get(b);
      if (pa === undefined || pb === undefined) continue;
      if (pa > pb) inversions++;
    }
  }

  const maxInv = (n * (n - 1)) / 2;
  const normalized = maxInv > 0 ? 1 - inversions / maxInv : 1;
  const score = Math.round(Math.max(0, Math.min(100, normalized * 100)));

  return {
    score,
    maxScore: 100,
    inversions,
    normalized,
  };
}
