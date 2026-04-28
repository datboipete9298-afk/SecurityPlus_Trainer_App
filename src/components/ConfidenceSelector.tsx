import type { UserConfidenceLevel } from "../utils/storage";

type Props = {
  value: UserConfidenceLevel | null;
  onChange: (level: UserConfidenceLevel) => void;
  disabled?: boolean;
};

const BTNS: { id: Exclude<UserConfidenceLevel, "skipped">; label: string; hint: string }[] = [
  { id: "not_sure", label: "Not sure", hint: "I guessed or felt fuzzy" },
  { id: "somewhat_sure", label: "Somewhat sure", hint: "I had a reason, could be wrong" },
  { id: "very_sure", label: "Very confident", hint: "I can explain it simply" },
];

export default function ConfidenceSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="rounded-xl border border-violet-800/40 bg-violet-950/15 p-3 space-y-2">
      <p className="text-[10px] uppercase font-bold text-violet-200/90 tracking-wide">How confident were you?</p>
      <p className="text-xs text-slate-500">Honest tap — no wrong answers here. The coach uses this to spot confident wrongs.</p>
      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        {BTNS.map((b) => (
          <button
            key={b.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(b.id)}
            className={`flex-1 min-h-[48px] rounded-lg border px-3 py-2 text-left text-sm transition-all ${
              value === b.id
                ? "border-violet-400 bg-violet-900/40 text-white ring-1 ring-violet-500/50"
                : "border-slate-600 bg-slate-800/50 text-slate-300 hover:border-violet-600/50"
            }`}
          >
            <span className="font-medium block">{b.label}</span>
            <span className="text-[10px] text-slate-500">{b.hint}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("skipped")}
        className="text-xs text-slate-500 hover:text-slate-400 underline"
      >
        Rather not say
      </button>
    </div>
  );
}
