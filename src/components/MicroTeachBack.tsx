import { microTeachBackQuality } from "../core/adaptiveEngine";

type Props = {
  value: string;
  onChange: (v: string) => void;
  keywordHint: string;
  disabled?: boolean;
};

export default function MicroTeachBack({ value, onChange, keywordHint, disabled }: Props) {
  const q = microTeachBackQuality(value);
  return (
    <div className="rounded-xl border border-indigo-800/40 bg-indigo-950/20 p-3 space-y-2">
      <p className="text-[10px] uppercase font-bold text-indigo-200/90 tracking-wide">Teach-back (your words)</p>
      <p className="text-xs text-slate-400">
        Explain the idea in your own words — tie it to <span className="text-amber-200/90">{keywordHint}</span>. This locks
        understanding before you move on.
      </p>
      <textarea
        className="w-full min-h-[88px] rounded-lg bg-slate-900 border border-slate-600 p-2 text-sm text-slate-200"
        placeholder="One or two sentences: what rule does this question test?"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className={`text-xs ${q.ok ? "text-emerald-300/90" : "text-amber-200/90"}`}>{q.hint}</p>
    </div>
  );
}
