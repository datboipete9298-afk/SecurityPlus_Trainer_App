import type { PdfGuideSection } from "../../types/pdfLibrary";

type Props = {
  guide: PdfGuideSection;
  interruptSeen: Record<string, boolean>;
  onSeen: (key: string) => void;
};

export default function PdfCoachPanel({ guide, interruptSeen, onSeen }: Props) {
  return (
    <section className="rounded-xl border border-violet-800/45 bg-violet-950/20 p-4 space-y-3">
      <h3 className="text-xs font-bold text-violet-200 uppercase tracking-wide">Live interrupts</h3>
      <p className="text-xs text-slate-400">Tap “Got it” after you pause in your PDF — keeps momentum without spam.</p>
      <ul className="space-y-2 list-none">
        {guide.interrupts.map((it, i) => {
          const key = `${it.kind}-${i}`;
          const seen = !!interruptSeen[key];
          return (
            <li
              key={key}
              className={`rounded-lg border px-3 py-2 text-xs ${seen ? "border-slate-700 bg-slate-900/30 text-slate-500" : "border-violet-700/50 bg-slate-900/60 text-slate-100"}`}
            >
              <p className="font-semibold text-violet-100/95">{it.title}</p>
              <p className="mt-1 leading-relaxed">{it.body}</p>
              {!seen && (
                <button type="button" className="mt-2 btn text-xs min-h-[40px] touch-manipulation" onClick={() => onSeen(key)}>
                  Got it
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
