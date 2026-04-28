import { useParams, Link } from "react-router-dom";
import { lessons } from "../data/lessons";
import { getVideoForLesson } from "../data/videoMap";
import { useProgress } from "../context/ProgressContext";
import { useEffect, useMemo } from "react";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import VideoStudyMode from "../components/video/VideoStudyMode";
import StatusBadge from "../components/StatusBadge";
import { getBeginnerContent } from "../utils/beginnerLayer";
import { isLessonUnlocked } from "../utils/adaptive";

/** Default merged PDF guide path alongside video (matches lesson page shortcuts). */
const DEFAULT_PDF_TRACK = "messer-course-notes-v107";

export default function WatchLesson() {
  const { id } = useParams();
  const { state, bumpStudyResume } = useProgress();

  useEffect(() => {
    if (id) {
      bumpStudyResume({ watchLessonId: id, videoNotesLessonId: id });
    }
  }, [id, bumpStudyResume]);

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

  const pdfHref = `/pdf-guides/${DEFAULT_PDF_TRACK}/${id}`;

  const searchPhrase = useMemo(() => `${L.title}`.trim(), [L.title]);

  const bLine = useMemo(() => {
    const b = getBeginnerContent(L);
    return b.beginnerIntro.slice(0, 400);
  }, [L]);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          eyebrow={`Guided watch · Section ${L.sectionNumber ?? "—"}`}
          title={L.title}
          purpose="Pause when prompted → one note → quick check → keep going (same rhythm as Brain Book)."
          badge={v.needsVideoUrl ? <StatusBadge tone="warn">Verify video URL</StatusBadge> : undefined}
        />

        <VideoStudyMode
          lessonId={id}
          lesson={L}
          variant="watch-page"
          embedUrl={v.embedUrl}
          videoTitle={v.videoTitle}
          youtubeUrl={v.youtubeUrl}
          professorMesserPageUrl={v.professorMesserPageUrl}
          estimatedWatchTimeMin={v.estimatedWatchTimeMin ?? null}
          needsVideoUrl={!!v.needsVideoUrl}
          continueHref={`/lesson/${id}`}
          continueLabel="Full lesson · labs & quizzes →"
          pdfGuideHref={pdfHref}
          pdfSearchPhrase={searchPhrase}
          pdfGuideEyebrow="Same search phrase as PDF guide hub"
        />

        {v.needsVideoUrl && (
          <div className="rounded-xl border border-amber-600/50 bg-amber-950/40 px-3 py-3 text-amber-100 text-sm">
            <strong className="text-amber-50">This video link is being verified.</strong> If the embed doesn’t load, use the YouTube link above — your notes and quiz still work the same.
          </div>
        )}

        <SectionCard title="Extra orientation" subtitle="Plain-English layer">
          <p className="text-slate-200 text-sm">{bLine}</p>
          <Link to={`/lesson/${id}`} className="btn-ghost text-sm mt-3 inline-flex min-h-[44px] items-center touch-manipulation">
            Open Brain Book blocks on lesson page →
          </Link>
        </SectionCard>
      </div>
    </AppShell>
  );
}
