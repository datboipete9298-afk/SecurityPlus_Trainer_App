import type { TutorFeedback } from "../core/feedbackEngine";

type Props = { feedback: TutorFeedback };

export default function MistakeInsight({ feedback }: Props) {
  return (
    <div className="rounded-xl border border-rose-800/40 bg-rose-950/15 p-3">
      <p className="text-[10px] uppercase font-bold text-rose-200/90 tracking-wide">Common mistake alert</p>
      <p className="text-sm text-slate-200 mt-2 leading-relaxed">{feedback.commonMistakeAlert}</p>
    </div>
  );
}
