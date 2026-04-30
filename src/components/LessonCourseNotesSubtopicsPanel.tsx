import { useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { enrichMesserCourseNotesToc } from "../utils/messerTocVideoEnrichment";

type Props = {
  lessonId: string;
  /** Course Notes `tocId` from `?toc=` — highlights and scrolls into view. */
  tocFocus: string | null;
};

/**
 * Lists Course Notes TOC rows mapped to this lesson (including subtopics).
 * Deep links: `/lesson/:id?toc=:tocId`
 */
export default function LessonCourseNotesSubtopicsPanel({ lessonId, tocFocus }: Props) {
  const rows = useMemo(
    () => enrichMesserCourseNotesToc().filter((r) => r.lessonId === lessonId),
    [lessonId],
  );
  const refMap = useRef<Map<string, HTMLLIElement | null>>(new Map());

  const showPanel = rows.some((r) => r.mapStatus === "subtopic_under_lesson") || rows.length > 1;

  useEffect(() => {
    if (!tocFocus) return;
    const el = refMap.current.get(tocFocus);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [tocFocus, rows]);

  if (!showPanel) return null;

  return (
    <section
      className="rounded-2xl border border-slate-700/90 bg-slate-900/35 px-4 py-4 space-y-3"
      aria-labelledby="lesson-cn-subtopics-heading"
    >
      <h2 id="lesson-cn-subtopics-heading" className="text-ds-micro font-bold uppercase tracking-wider text-slate-400">
        This lesson includes these Course Notes topics
      </h2>
      <p className="text-ds-helper text-slate-500 leading-relaxed">
        Each row matches your Course Notes PDF outline. Open a topic to focus the list; PDF tabs and Messer clips stay on this lesson.
      </p>
      <ul className="space-y-2 list-none m-0 p-0 max-h-[min(50vh,22rem)] overflow-y-auto">
        {rows.map((r) => {
          const active = tocFocus === r.tocId;
          const statusLabel =
            r.mapStatus === "full_lesson" ? "Primary topic"
            : r.mapStatus === "subtopic_under_lesson" ? "PDF-supported section"
            : r.mapStatus.replace(/_/g, " ");
          return (
            <li
              key={r.tocId}
              ref={(el) => {
                refMap.current.set(r.tocId, el);
              }}
              id={`toc-row-${r.tocId}`}
              className={`rounded-xl border px-3 py-2.5 transition-colors ${
                active ? "border-emerald-500/60 bg-emerald-950/25 ring-1 ring-emerald-500/20" : "border-slate-800/80 bg-slate-950/40"
              }`}
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-ds-micro text-slate-500 tabular-nums">{r.objective}</span>
                <span className="text-sm text-slate-100 font-medium">{r.title}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-ds-helper text-slate-400">
                <span className="tabular-nums">Notes p.{r.pdfPage}</span>
                {r.matchedVideoId ?
                  <a
                    href={`https://www.youtube.com/watch?v=${r.matchedVideoId}`}
                    className="text-cyan-300 hover:text-cyan-200 underline-offset-2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Matched clip
                  </a>
                : (
                  <span className="text-slate-600">Clip: grouped in playlist</span>
                )}
                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase text-slate-400">{statusLabel}</span>
                <Link
                  to={`/lesson/${lessonId}?toc=${encodeURIComponent(r.tocId)}`}
                  className="text-emerald-400 hover:text-emerald-300 underline text-sm min-h-[44px] inline-flex items-center"
                >
                  Focus this topic
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
