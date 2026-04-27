const MESSAGES = [
  "You're improving — every rep you finish is real progress.",
  "This is the same kind of thinking the exam rewards — steady and specific.",
  "You're getting closer to exam readiness one small block at a time.",
] as const;

type Props = {
  streak: number;
  /** YYYY-MM-DD */
  dayIso: string;
  /** Only show when user has done something today */
  hasActivityToday: boolean;
};

/** One subtle rotating line — stable per day, not noisy. */
export default function MicroConfidenceLine({ streak, dayIso, hasActivityToday }: Props) {
  if (!hasActivityToday) return null;
  const seed = (streak + parseInt(dayIso.replace(/-/g, "").slice(-4), 10)) % MESSAGES.length;
  const msg = MESSAGES[seed] ?? MESSAGES[0];
  return <p className="text-xs text-slate-500 italic leading-relaxed border-l-2 border-slate-700 pl-3">{msg}</p>;
}
