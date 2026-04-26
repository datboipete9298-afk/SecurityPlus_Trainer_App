import { GLOSSARY, findGlossaryKeysInText } from "../data/glossary";
import { useState } from "react";

export default function GlossaryChips({ textSource }: { textSource: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const keys = findGlossaryKeysInText(textSource).slice(0, 8);
  if (!keys.length) return null;
  return (
    <div className="flex flex-wrap gap-2 items-start">
      <span className="text-xs text-slate-500 w-full sm:w-auto">Glossary (tap):</span>
      {keys.map((k) => {
        const g = GLOSSARY[k]!;
        return (
          <div key={k} className="relative">
            <button
              type="button"
              onClick={() => setOpen(open === k ? null : k)}
              className="text-xs rounded-full bg-slate-800 border border-slate-600 px-2 py-0.5 text-cyan-200 hover:border-cyan-500"
            >
              {g.term}
            </button>
            {open === k && (
              <div className="absolute z-20 mt-1 left-0 w-72 rounded-lg border border-slate-600 bg-slate-900 p-3 text-xs text-slate-200 shadow-xl">
                <p className="font-semibold text-white">{g.term}</p>
                <p className="mt-1 text-slate-300">{g.plainEnglish}</p>
                {g.oneLineExam && <p className="mt-2 text-amber-200/80">Exam: {g.oneLineExam}</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
