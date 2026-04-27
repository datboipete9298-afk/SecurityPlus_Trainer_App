import type { PersistedState } from "../utils/storage";
import { pickDomainMasteryNudge, pickLongTermProgressLine } from "../utils/identityReinforcement";

type Props = {
  state: PersistedState;
  /** YYYY-MM-DD */
  dayIso: string;
  hasActivityToday: boolean;
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Domain mastery / rare long-arc line — only after today’s activity; long-arc throttled so total noise stays low. */
export default function IdentityReinforcementLine({ state, dayIso, hasActivityToday }: Props) {
  if (!hasActivityToday) return null;
  const domain = pickDomainMasteryNudge(state, dayIso);
  if (domain) {
    return (
      <p className="text-xs text-slate-500 italic leading-relaxed border-l-2 border-slate-700 pl-3 mt-2">{domain}</p>
    );
  }
  const attempts = Object.values(state.questionStats).reduce((a, st) => a + st.c + st.w, 0);
  if (hashStr(`${dayIso}:${attempts}`) % 4 !== 0) return null;
  const line = pickLongTermProgressLine(state);
  if (!line) return null;
  return (
    <p className="text-xs text-slate-500 italic leading-relaxed border-l-2 border-slate-700 pl-3 mt-2">{line}</p>
  );
}
