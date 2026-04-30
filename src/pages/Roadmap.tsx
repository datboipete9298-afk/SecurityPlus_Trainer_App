import { Link } from "react-router-dom";
import { useMemo, useEffect } from "react";
import { SECTION_ORDER } from "../data/sectionOrder";
import { lessons } from "../data/lessons";
import { useProgress } from "../context/ProgressContext";
import { getLessonOrderNudge } from "../utils/adaptive";
import { formatMesserRoadmapVideoLine } from "../data/videoLessonGroups";
import { nextLessonId } from "../utils/lessonOrder";
import { examDomainShortTitle } from "../utils/identityPersonalization";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import AITutorPanel from "../components/AITutorPanel";

const DOMAIN_ORDER = ["1", "2", "3", "4", "5"] as const;

export default function Roadmap() {
  const { state, bumpStudyResume } = useProgress();
  useEffect(() => {
    bumpStudyResume({ roadmap: true });
  }, [bumpStudyResume]);
  const currentId = nextLessonId(state);
  const weakAreasRoadmap = useMemo(
    () =>
      (["1", "2", "3", "4", "5"] as const)
        .filter((d) => (state.domainScore[d] ?? 50) < 47)
        .map((d) => `Domain ${d}`),
    [state.domainScore],
  );

  const sectionsByDomain = useMemo(() => {
    const m = new Map<string, typeof SECTION_ORDER>();
    for (const d of DOMAIN_ORDER) m.set(d, []);
    for (const s of SECTION_ORDER) {
      m.get(s.domain)?.push(s);
    }
    return DOMAIN_ORDER.map((domain) => ({ domain, sections: m.get(domain) ?? [] }));
  }, []);

  return (
    <AppShell>
      <div className="lg:grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-8 items-start">
        <div className="min-w-0 space-y-8">
          <PageHeader
            eyebrow="Lesson path"
            title="Course roadmap"
            purpose="Messer-ordered map of every section. Open any row when you want — Home still suggests the next incomplete lesson."
          />

          <ol className="space-y-10 list-none p-0 m-0">
            {sectionsByDomain.map(({ domain, sections }) => (
              <li key={domain} className="space-y-4">
                <div className="sticky top-0 z-[1] -mx-1 px-1 py-2 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800/80">
                  <h2 className="text-ds-micro font-bold uppercase tracking-wider text-slate-400">
                    Domain {domain} · <span className="text-slate-300 normal-case font-medium">{examDomainShortTitle(domain)}</span>
                  </h2>
                </div>
                <ol className="space-y-4 list-none p-0 m-0">
                  {sections.map((s) => {
                    const idx = SECTION_ORDER.findIndex((x) => x.id === s.id) + 1;
                    const L = lessons[s.id];
                    const done = state.completedLessons.includes(s.id);
                    const youHere = s.id === currentId && !done;
                    const orderNudge = getLessonOrderNudge(s.id, state);
                    const actionLabel = done ? "Review lesson" : youHere ? "Pick up here" : "Open lesson";
                    const pdfLine = L?.hasFullContent ? "Full lesson + quiz" : "PDF + quiz path";
                    return (
                      <li
                        key={s.id}
                        className={`card flex flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-between sm:gap-6 ${
                          youHere ? "ring-1 ring-emerald-500/40 border-emerald-800/50 bg-emerald-950/10" : ""
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-ds-micro text-slate-500 tabular-nums font-semibold">#{idx}</span>
                            {done ?
                              <span className="text-ds-micro rounded-full border border-emerald-800/60 bg-emerald-950/30 px-2 py-0.5 text-emerald-200/95">
                                Done
                              </span>
                            : youHere ?
                              <span className="text-ds-micro rounded-full border border-amber-700/50 bg-amber-950/25 px-2 py-0.5 text-amber-100/95">
                                Suggested next
                              </span>
                            : null}
                          </div>
                          <h3 className="text-ds-section text-white leading-snug">{s.label}</h3>
                          <p className="text-ds-helper text-slate-400">
                            Domain {s.domain}
                            {L?.sectionNumber ? ` · ${L.sectionNumber}` : ""}
                          </p>
                          <div className="flex flex-col gap-1.5 pt-1">
                            <p className="text-ds-helper text-slate-300">
                              <span className="text-slate-500">Messer:</span> {formatMesserRoadmapVideoLine(s.id)}
                            </p>
                            <p className="text-ds-helper text-slate-400">
                              <span className="text-slate-500">PDF / app:</span> {pdfLine}
                            </p>
                          </div>
                          {youHere && <p className="text-ds-helper text-emerald-300/90 font-medium">You are here in the suggested path.</p>}
                          {orderNudge && (
                            <p className="text-ds-helper text-amber-200/90 leading-relaxed rounded-lg border border-amber-900/35 bg-amber-950/15 px-3 py-2">
                              Order hint: usually after “{orderNudge.prevTitle}” — you can still open this now.
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 sm:w-52 shrink-0 sm:justify-center">
                          <Link to={`/lesson/${s.id}`} className="btn text-sm w-full text-center min-h-[44px] touch-manipulation justify-center">
                            {actionLabel}
                          </Link>
                          <Link
                            to={`/watch/${s.id}`}
                            className="btn-ghost text-sm w-full text-center min-h-[44px] touch-manipulation justify-center border-slate-600"
                          >
                            Watch Messer videos
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </li>
            ))}
          </ol>
        </div>
        <AITutorPanel
          className="lg:sticky lg:top-4 order-first lg:order-none"
          context={{
            surface: "dashboard",
            weakAreas: weakAreasRoadmap,
            userProgress: { currentLessonId: currentId, completed: state.completedLessons.length },
            coachLines: currentId && lessons[currentId] ? [`Next in path: ${lessons[currentId]!.title}`] : undefined,
          }}
        />
      </div>
    </AppShell>
  );
}
