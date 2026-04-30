import { useMemo } from "react";
import { Link } from "react-router-dom";
import { EXAM_STUDY_GUIDE_TOC } from "../data/examStudyGuideToc";

type Props = {
  lessonId: string;
  sgTocId: string | null;
  studyGuidePdfHref: string;
};

/** Highlights a Study Guide TOC row when opened via `?sg=` on the lesson page. */
export default function LessonStudyGuideAnchorBanner({ lessonId, sgTocId, studyGuidePdfHref }: Props) {
  const row = useMemo(() => (sgTocId ? EXAM_STUDY_GUIDE_TOC.find((r) => r.tocId === sgTocId) : undefined), [sgTocId]);
  if (!row) return null;
  const mappedOther = row.lessonId && row.lessonId !== lessonId;
  return (
    <aside
      className="rounded-2xl border border-violet-800/45 bg-violet-950/20 px-4 py-3 space-y-2"
      role="note"
      aria-label="Study Guide outline anchor"
    >
      <p className="text-ds-micro font-bold uppercase tracking-wider text-violet-200/90">Study Guide outline</p>
      <p className="text-xs text-slate-400 leading-relaxed">{row.sectionPath}</p>
      <p className="text-sm text-slate-100 font-medium">{row.title}</p>
      <p className="text-ds-helper text-slate-500">
        Status: <span className="text-slate-300 capitalize">{row.mapStatus.replace(/_/g, " ")}</span>
        {mappedOther ?
          <span className="block mt-1 text-amber-200/90">This outline row is hosted on lesson {row.lessonId}.</span>
        : null}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link to={studyGuidePdfHref} className="btn-ghost inline-flex text-sm min-h-[44px] items-center border border-violet-700/50 text-violet-100">
          Open Study Guide PDF for this section →
        </Link>
        {mappedOther && row.lessonId ?
          <Link
            to={`/lesson/${row.lessonId}?sg=${encodeURIComponent(row.tocId)}`}
            className="btn text-sm min-h-[44px] inline-flex items-center"
          >
            Open mapped lesson
          </Link>
        : null}
      </div>
    </aside>
  );
}
