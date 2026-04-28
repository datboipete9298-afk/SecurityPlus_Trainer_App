/** Shared pass bar for SOC triage labs — keep in sync with UI + generator copy. */
export function elitePassThreshold(difficulty: number): number {
  if (difficulty >= 4) return 78;
  if (difficulty <= 2) return 62;
  return 70;
}
