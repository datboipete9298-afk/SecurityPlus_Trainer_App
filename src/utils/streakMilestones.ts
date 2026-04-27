/** Streak days that earn a quiet celebration (no heavy gamification). */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const;
export type StreakMilestone = (typeof STREAK_MILESTONES)[number];

/** Next milestone strictly after current streak (for progress copy). */
export function nextStreakMilestone(streak: number): StreakMilestone | null {
  return STREAK_MILESTONES.find((m) => m > streak) ?? null;
}

/** Milestone just reached that user has not acknowledged yet (highest qualifying). */
export function pendingStreakMilestone(streak: number, lastAcknowledged: number): StreakMilestone | null {
  const ack = Math.max(0, lastAcknowledged);
  const candidates = STREAK_MILESTONES.filter((m) => streak >= m && m > ack);
  return candidates.length ? candidates[candidates.length - 1]! : null;
}

export function milestoneMessage(days: StreakMilestone): string {
  switch (days) {
    case 3:
      return "Three days in a row — consistency beats cramming.";
    case 7:
      return "One full week. This is how knowledge actually sticks.";
    case 14:
      return "Two weeks. You’re proving you can show up when it’s not exciting.";
    case 30:
      return "A month of check-ins. That’s exam-candidate discipline.";
    case 60:
      return "Sixty days — you’ve built a serious study identity.";
    case 100:
      return "Triple digits. Keep mixing review so it stays automatic.";
    default:
      return "Nice momentum — keep the chain going.";
  }
}
