import type { TutorFeedback } from "../core/feedbackEngine";

type Props = {
  feedback: TutorFeedback;
  keywordLine?: string;
};

export default function ExamHintBox({ feedback, keywordLine }: Props) {
  return (
    <div className="rounded-xl border border-amber-800/45 bg-amber-950/20 p-3 space-y-2">
      <p className="text-[10px] uppercase font-bold text-amber-200/90 tracking-wide">Exam thinking</p>
      <p className="text-sm text-slate-200 leading-relaxed">{feedback.examRecognitionRule}</p>
      {keywordLine && (
        <p className="text-xs text-amber-100/85">
          <span className="text-slate-500">Keyword to watch for: </span>
          {keywordLine}
        </p>
      )}
      <p className="text-xs text-slate-400 border-t border-amber-900/30 pt-2">
        <span className="text-cyan-200/90 font-medium">Pattern rule: </span>
        If the stem stresses timing or “best/most,” match the option that directly answers that axis — not the one that is merely true.
      </p>
    </div>
  );
}
