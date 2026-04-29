import type { TutorFeedback } from "../core/feedbackEngine";

type Props = { feedback: TutorFeedback };

export default function MistakeInsight({ feedback }: Props) {
  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/40 p-3">
      <p className="text-[10px] uppercase font-bold text-amber-200/95 tracking-wide">Common mix-up here</p>
      <p className="text-sm text-slate-200 mt-2 leading-relaxed">{feedback.commonMistakeAlert}</p>
    </div>
  );
}
