import { getMesserVideosForLesson } from "../data/videoLessonGroups";

type Props = {
  lessonId: string;
  hasCourseNotesPdf: boolean;
};

/** One calm line: Messer clip count + PDF support — no fake IDs, no clutter. */
export default function LessonStudyContextBar({ lessonId, hasCourseNotesPdf }: Props) {
  const n = getMesserVideosForLesson(lessonId).length;
  const videoPart =
    n === 0 ? "Playlist clips: overview / PDF path for now"
    : n === 1 ? "1 Messer clip matched to this lesson"
    : `${n} Messer clips for this lesson`;
  const pdfPart = hasCourseNotesPdf ? " · Course Notes PDF wired" : " · Add Course Notes PDF in setup when ready";
  return (
    <div
      className="rounded-xl border border-slate-800/80 bg-slate-900/35 px-4 py-3 text-sm text-slate-300 leading-snug shadow-sm"
      role="status"
    >
      <span className="text-slate-500 font-medium">This lesson · </span>
      <span className="text-slate-200">{videoPart}</span>
      <span className="text-slate-500">{pdfPart}</span>
    </div>
  );
}
