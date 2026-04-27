type Props = {
  checkpointsDone: Record<string, boolean>;
  onSet: (id: string, done: boolean) => void;
};

const ITEMS: { id: string; label: string }[] = [
  { id: "openedPdf", label: "Opened matching section in my PDF" },
  { id: "mustHighlights", label: "Marked must-highlight ideas (≤6 hooks)" },
  { id: "retrieval", label: "Looked away and wrote one sentence from memory (retrieval practice)" },
  { id: "miniQuiz", label: "Ran in-app mini-check or lesson quiz" },
  { id: "brainRow", label: "Saved one Brain Book row from this section" },
];

export default function CheckpointPanel({ checkpointsDone, onSet }: Props) {
  const doneN = ITEMS.filter((x) => checkpointsDone[x.id]).length;
  return (
    <section className="rounded-xl border border-cyan-800/40 bg-cyan-950/15 p-4 space-y-2">
      <h3 className="text-xs font-bold text-cyan-200 uppercase tracking-wide">Checkpoints ({doneN}/{ITEMS.length})</h3>
      <ul className="space-y-2 list-none">
        {ITEMS.map((it) => (
          <li key={it.id}>
            <label className="flex items-start gap-2 text-sm text-slate-200 cursor-pointer touch-manipulation min-h-[44px]">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 rounded border-slate-500 text-cyan-500"
                checked={!!checkpointsDone[it.id]}
                onChange={(e) => onSet(it.id, e.target.checked)}
              />
              <span>{it.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
