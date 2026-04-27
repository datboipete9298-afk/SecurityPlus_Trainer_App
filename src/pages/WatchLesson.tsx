import { useParams, Link } from "react-router-dom";
import { lessons, getNextSectionId } from "../data/lessons";
import { getVideoForLesson } from "../data/videoMap";
import { getBeginnerContent } from "../utils/beginnerLayer";
import { useProgress } from "../context/ProgressContext";
import { isLessonUnlocked } from "../utils/adaptive";
import VideoEmbed from "../components/VideoEmbed";
import { useMemo, useState, useEffect } from "react";
import { questionsByLesson } from "../data/quizzes";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import NextActionCard from "../components/NextActionCard";
import AITutorPanel from "../components/AITutorPanel";
import StatusBadge from "../components/StatusBadge";

export default function WatchLesson() {
  const { id } = useParams();
  const { state, patchLessonProgress, bumpStudyResume } = useProgress();
  const [chunk, setChunk] = useState(0);

  useEffect(() => {
    if (id) bumpStudyResume({ watchLessonId: id });
  }, [id, bumpStudyResume]);

  const weakAreas = useMemo(
    () =>
      (["1", "2", "3", "4", "5"] as const)
        .filter((d) => (state.domainScore[d] ?? 50) < 47)
        .map((d) => `Domain ${d}`),
    [state.domainScore],
  );

  if (!id) {
    return (
      <AppShell>
        <PageHeader title="Guided watch" purpose="Missing lesson id in the URL." />
      </AppShell>
    );
  }

  const L = lessons[id];
  if (!L?.hasFullContent) {
    return (
      <AppShell>
        <PageHeader title="Lesson not found" purpose="This section ID has no full lesson content yet." />
        <Link to="/roadmap" className="btn w-full sm:w-auto text-center inline-block">
          Open lesson path
        </Link>
      </AppShell>
    );
  }

  if (!isLessonUnlocked(id, state)) {
    return (
      <AppShell>
        <PageHeader title="Locked" purpose="Complete the previous section in the Messer-ordered path first." />
        <Link to="/roadmap" className="btn w-full sm:w-auto text-center inline-block">
          Lesson path
        </Link>
      </AppShell>
    );
  }

  const v = getVideoForLesson(id);
  const b = getBeginnerContent(L);
  const nxt = getNextSectionId(id);
  const quizC = questionsByLesson(id).length;
  const pauseQ = b.pausePrompts[chunk % b.pausePrompts.length] ?? b.pausePrompts[0]!;

  const aiLesson = useMemo(
    () => ({
      id,
      title: L.title,
      sectionNumber: L.sectionNumber,
      domain: L.domain,
      mustHighlights: L.highlightRules.slice(0, 6).map((h) => h.term),
      simpleExplanation: L.simpleExplanation,
      instantRecognition: L.instantRecognition,
    }),
    [id, L],
  );

  return (
    <AppShell>
      <div className="max-w-5xl lg:grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-6 items-start">
        <div className="min-w-0 space-y-6 max-w-3xl">
          <PageHeader
            eyebrow={`Guided watch · Section ${L.sectionNumber ?? "—"}`}
            title={L.title}
            purpose="Pause when prompted, keep notes light (3–8 hooks), then finish with quiz and flashcards on this section."
            badge={v.needsVideoUrl ? <StatusBadge tone="warn">Verify video URL</StatusBadge> : undefined}
          />

          <NextActionCard
            label="Do this first"
            description="Skim the intro below, start the video, and pause at the first prompt to write one keyword."
          >
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900/50">
              <VideoEmbed embedUrl={v.embedUrl} title={v.videoTitle} />
            </div>
            <div className="mt-3 flex flex-col sm:flex-row flex-wrap gap-2">
              {v.youtubeUrl && (
                <a href={v.youtubeUrl} className="btn-ghost text-sm w-full sm:w-auto text-center" target="_blank" rel="noreferrer">
                  Open on YouTube
                </a>
              )}
              {v.professorMesserPageUrl && (
                <a href={v.professorMesserPageUrl} className="btn-ghost text-sm w-full sm:w-auto text-center" target="_blank" rel="noreferrer">
                  Messer course page
                </a>
              )}
              <Link to={`/lesson/${id}`} className="btn text-sm w-full sm:w-auto text-center">
                Full lesson + notes
              </Link>
              <button
                type="button"
                className="btn-ghost text-sm w-full sm:w-auto"
                onClick={() => patchLessonProgress(id, { videoWatched: true, videoWatchedAt: Date.now() })}
              >
                Mark video watched
              </button>
            </div>
            {v.estimatedWatchTimeMin != null && (
              <p className="text-xs text-slate-500 mt-2">~{v.estimatedWatchTimeMin} min (estimate from index)</p>
            )}
          </NextActionCard>

          {v.needsVideoUrl && (
            <div className="rounded-xl border border-amber-600/50 bg-amber-950/40 px-3 py-3 text-amber-100 text-sm">
              <strong className="text-amber-50">Video link needs verification</strong> — add the official YouTube id in{" "}
              <code className="text-xs">src/data/knownYoutubeIds.ts</code> for <code className="text-xs">{id}</code> until then, use YouTube or the full lesson page.
            </div>
          )}

          <SectionCard title="Before the video" subtitle="Plain-English orientation">
            <p className="text-slate-200 text-sm">{b.beginnerIntro}</p>
            <p className="text-xs text-slate-500 mt-3 font-semibold">Words to know first</p>
            <ul className="list-disc pl-4 text-sm text-amber-200/90">
              {b.prerequisiteTerms.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 mt-2">What to listen for</p>
            <ul className="list-disc pl-4 text-sm text-slate-300">
              {b.watchFor.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="During the video" subtitle="3–8 highlights, not paragraphs">
            <p className="text-slate-400 text-xs">Highlight terms, short definitions, categories, or steps only.</p>
            <p className="text-sm text-slate-200 mt-2">
              <span className="text-amber-200 font-medium">Hooks to watch for:</span>{" "}
              {L.highlightRules.slice(0, 3).map((h) => h.term).join(" · ")}
            </p>
            <p className="text-xs text-amber-200/80 mt-3">Pause prompt ({chunk + 1})</p>
            <p className="text-slate-200 text-sm mt-1">{pauseQ}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-ghost text-sm flex-1 sm:flex-none min-h-[44px]" onClick={() => setChunk((c) => c + 1)}>
                Next pause prompt
              </button>
              <button
                type="button"
                className="btn text-sm flex-1 sm:flex-none min-h-[44px]"
                onClick={() => patchLessonProgress(id, { highlightsDone: true })}
              >
                I wrote my highlights
              </button>
            </div>
          </SectionCard>

          <SectionCard title="After the video" subtitle="Lock it in with quiz + cards">
            <p className="text-sm text-slate-200">
              <strong className="text-emerald-200">Write:</strong> {L.writeDown}
            </p>
            <p className="text-sm text-slate-200 mt-2">
              <strong className="text-emerald-200">Do:</strong> {L.quickAction}
            </p>
            <p className="text-xs text-slate-500 mt-2">Teach-back and Brain Book live on the main lesson page.</p>
            <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2">
              <Link to={`/quiz/${id}`} className="btn w-full sm:w-auto text-center">
                Mini quiz ({quizC} Q)
              </Link>
              <Link to={`/flashcards?lesson=${id}`} className="btn-ghost w-full sm:w-auto text-center">
                Flashcards
              </Link>
              <Link to="/session" className="btn-ghost w-full sm:w-auto text-center">
                30-min session
              </Link>
            </div>
          </SectionCard>

          <NextActionCard
            label="Next step"
            description={nxt && lessons[nxt] ? `When ready, continue to the next guided watch or return to the full lesson.` : `Mark highlights done, then quiz this section.`}
          >
            {nxt && lessons[nxt] ? (
              <Link to={`/watch/${nxt}`} className="btn w-full sm:w-auto text-center inline-block">
                Next watch: {lessons[nxt]!.title} →
              </Link>
            ) : (
              <Link to={`/lesson/${id}`} className="btn w-full sm:w-auto text-center inline-block">
                Open full lesson →
              </Link>
            )}
          </NextActionCard>
        </div>

        <AITutorPanel
          className="lg:sticky lg:top-4 order-first lg:order-none"
          context={{
            surface: "lesson",
            lesson: aiLesson,
            weakAreas,
            userProgress: { guidedWatchLessonId: id },
            coachLines: [`Pause prompts: ${b.watchFor.slice(0, 2).join(" · ")}`],
          }}
        />
      </div>
    </AppShell>
  );
}
