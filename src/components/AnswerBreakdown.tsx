import type { QuizQuestion } from "../types";
import { isMultiSelect, learnerNoteForOption, multiSelectGapSummary, optionLetter } from "../utils/quizHelpers";

type Props = {
  q: QuizQuestion;
  singleSel: number | null;
  multiSel: number[];
};

export default function AnswerBreakdown({ q, singleSel, multiSel }: Props) {
  const multi = isMultiSelect(q);

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase text-slate-500 font-semibold">Full breakdown — every choice</p>
      {multi && (
        <div className="rounded-lg border border-slate-600 bg-slate-900/50 p-2 text-xs text-slate-300">
          {(() => {
            const { missed, wrongPicks } = multiSelectGapSummary(q, multiSel);
            return (
              <ul className="space-y-1 list-disc pl-4">
                {wrongPicks.length > 0 && (
                  <li>
                    <span className="text-rose-300">Wrong selections: </span>
                    {wrongPicks.map((i) => `${optionLetter(i)}`).join(", ")} — these don’t fully match the stem.
                  </li>
                )}
                {missed.length > 0 && (
                  <li>
                    <span className="text-amber-200">Missed required: </span>
                    {missed.map((i) => `${optionLetter(i)}`).join(", ")} — select all that apply means every true statement.
                  </li>
                )}
                {wrongPicks.length === 0 && missed.length === 0 && (
                  <li className="text-emerald-200/90">All required answers selected; no extra distractors.</li>
                )}
              </ul>
            );
          })()}
        </div>
      )}
      <ul className="space-y-2 text-sm">
        {q.options.map((label, j) => {
          const isKey = multi ? q.correctIndices!.includes(j) : j === q.correctIndex;
          const youPicked = multi ? multiSel.includes(j) : singleSel === j;
          let status: string;
          if (isKey && youPicked) status = "✓ You picked this (correct)";
          else if (isKey && !youPicked) status = multi ? "✓ Required — you didn’t select this" : "✓ Correct option";
          else if (!isKey && youPicked) status = "✗ You selected this — not the best fit";
          else status = "○ Not selected";
          return (
            <li
              key={j}
              className={`rounded-lg border px-3 py-2 transition-colors ${
                isKey ? "border-emerald-800/50 bg-emerald-950/15" : "border-slate-700 bg-slate-900/40"
              }`}
            >
              <p className="text-slate-200">
                <span className="text-slate-500 font-mono text-xs mr-1">{optionLetter(j)}.</span>
                {label}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">{status}</p>
              <p className="text-xs text-slate-300 mt-1 leading-snug">{learnerNoteForOption(q, j)}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
