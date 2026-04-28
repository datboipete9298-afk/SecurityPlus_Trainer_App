import { useState } from "react";

type Props = {
  mustList: string[];
  shouldList: string[];
  doNotList: string[];
  highlights: string[];
  onAdd: (snippet: string) => void;
  onRemove: (index: number) => void;
  warnOverAt?: number;
};

export default function HighlightPanel({ mustList, shouldList, doNotList, highlights, onAdd, onRemove, warnOverAt = 6 }: Props) {
  const [draft, setDraft] = useState("");
  const overWarn = highlights.length >= warnOverAt;

  return (
    <section className="rounded-xl border border-amber-800/40 bg-amber-950/15 p-4 space-y-3">
      <h3 className="text-xs font-bold text-amber-200 uppercase tracking-wide">What to highlight</h3>
      <p className="text-xs text-slate-400 leading-relaxed">
        In your PDF, mark <span className="text-amber-100/90">short definitions, lists, and “exam trigger” words</span> — not whole paragraphs. Type the same short phrase here so the app can track it (and help with flashcards later).
      </p>
      {overWarn && (
        <p className="text-xs text-amber-200/95 rounded-lg border border-amber-600/40 bg-amber-950/40 px-2 py-2">
          You have {highlights.length} saved hooks (we warn at {warnOverAt}) — if everything is highlighted, nothing stands out. Trim to the tightest exam
          triggers.
        </p>
      )}
      <div>
        <p className="text-[10px] text-slate-500 uppercase mb-1">Start with these (from the guide)</p>
        <ul className="text-xs text-slate-200 space-y-1 list-disc pl-4">
          {mustList.slice(0, 10).map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-[10px] text-slate-500 uppercase mb-1">Should consider</p>
        <ul className="text-xs text-slate-300 space-y-0.5 list-disc pl-4">
          {shouldList.slice(0, 8).map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-[10px] text-rose-300/80 uppercase mb-1">Do not highlight</p>
        <ul className="text-xs text-slate-400 space-y-0.5 list-disc pl-4">
          {doNotList.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Paste a short phrase you marked…"
          className="flex-1 min-w-0 rounded-lg bg-slate-900 border border-slate-600 px-3 py-2.5 text-sm text-slate-100 min-h-[44px]"
        />
        <button
          type="button"
          className="btn text-sm min-h-[44px] touch-manipulation shrink-0"
          onClick={() => {
            const t = draft.trim();
            if (t.length < 3) return;
            onAdd(t);
            setDraft("");
          }}
        >
          Save hook
        </button>
      </div>
      {highlights.length > 0 && (
        <ul className="space-y-1.5 list-none">
          {highlights.map((h, i) => (
            <li key={i} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-2 py-2 text-xs text-slate-200">
              <span className="min-w-0 break-words">{h}</span>
              <button type="button" className="text-rose-300/90 underline shrink-0 touch-manipulation min-h-[44px] sm:min-h-0" onClick={() => onRemove(i)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
