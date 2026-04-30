import { useParams, Link, useSearchParams } from "react-router-dom";
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
import { getLessonOrderNudge } from "../utils/adaptive";
import OrderPathNudge from "../components/OrderPathNudge";
import { getMesserVideosForLesson, getPrimaryMesserVideoIdForLesson } from "../data/videoLessonGroups";
import { messerPlaylistVideoById } from "../data/professorMesser701Playlist";
import { youtubeEmbed, youtubeWatch } from "../data/videoConstants";

/** Default merged PDF guide path alongside video (matches lesson page shortcuts). */
const DEFAULT_PDF_TRACK = "messer-course-notes-v107";

export default function WatchLesson() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
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
  if (!L) {
    return (
      <AppShell>
        <PageHeader title="Lesson not found" purpose="That section ID is not on the SY0-701 roadmap." />
        <Link to="/roadmap" className="btn w-full sm:w-auto text-center inline-block">
          Open lesson path
        </Link>
      </AppShell>
    );
  }

  const orderNudge = getLessonOrderNudge(id, state);

  if (!L.hasFullContent) {
    return (
      <AppShell>
        <div className="max-w-2xl space-y-4">
          <PageHeader
            title={L.title}
            purpose="This lesson is ready to study with your PDFs, notes, and quick checks. Open the full lesson page for the step-by-step path, notes, and quiz."
          />
          <p className="text-xs text-slate-500 leading-relaxed">
            You can study any lesson now — the app still shows the recommended order on the lesson path.
          </p>
          <div id="lesson-study-focus" className="scroll-mt-28 h-px w-full" tabIndex={-1} />
          <OrderPathNudge nudge={orderNudge} />
          <Link to={`/lesson/${id}`} className="btn w-full sm:w-auto text-center inline-block min-h-[48px] touch-manipulation">
            Open lesson page (notes & PDF study path) →
          </Link>
          <Link to="/roadmap" className="btn-ghost w-full sm:w-auto text-center inline-block min-h-[48px]">
            Lesson path
          </Link>
        </div>
      </AppShell>
    );
  }

  const vBase = getVideoForLesson(id);
  const group = getMesserVideosForLesson(id);
  const primaryId = getPrimaryMesserVideoIdForLesson(id);
  const paramVideo = searchParams.get("video");

  const selectedVideoId = useMemo(() => {
    if (paramVideo && group.some((x) => x.videoId === paramVideo)) return paramVideo;
    return primaryId ?? group[0]?.videoId ?? "";
  }, [paramVideo, group, primaryId]);

  const invalidParam = paramVideo && !group.some((x) => x.videoId === paramVideo);

  const playlistItem = selectedVideoId ? messerPlaylistVideoById(selectedVideoId) : undefined;
  const embedUrl = selectedVideoId ? youtubeEmbed(selectedVideoId) : vBase.embedUrl;
  const youtubeUrl = selectedVideoId ? youtubeWatch(selectedVideoId) : vBase.youtubeUrl;
  const videoTitle = playlistItem?.title ?? vBase.videoTitle;
  const needsVideoUrl = !selectedVideoId && !!vBase.needsVideoUrl;

  const idx = group.findIndex((x) => x.videoId === selectedVideoId);
  const prevV = idx > 0 ? group[idx - 1] : null;
  const nextV = idx >= 0 && idx < group.length - 1 ? group[idx + 1]! : null;

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
          purpose="Pause when prompted → one note → quick check → keep going (same rhythm as Brain Book). All Messer playlist clips for this lesson are listed below — pick one or use Next."
          badge={needsVideoUrl ? <StatusBadge tone="warn">No exact video yet — use playlist</StatusBadge> : undefined}
        />
        <div id="lesson-study-focus" className="scroll-mt-28 h-px w-full" tabIndex={-1} />
        <OrderPathNudge nudge={orderNudge} />

        {invalidParam ?
          <p className="text-sm text-amber-200/95 rounded-lg border border-amber-700/50 bg-amber-950/30 px-3 py-2" role="status">
            That video id is not in this lesson&apos;s Messer group — showing the <strong className="text-white">primary</strong> clip instead.
          </p>
        : null}

        {group.length > 1 ?
          <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              Clip <strong className="text-white tabular-nums">{idx + 1}</strong> of{" "}
              <strong className="text-white tabular-nums">{group.length}</strong>
              {playlistItem ?
                <>
                  {" "}
                  · playlist <span className="text-slate-300 tabular-nums">#{playlistItem.index}</span>
                </>
              : null}
            </p>
            <div className="flex flex-wrap gap-2">
              {prevV ?
                <button
                  type="button"
                  className="btn-ghost text-sm min-h-[44px] border border-slate-600 touch-manipulation"
                  onClick={() => setSearchParams({ video: prevV.videoId })}
                >
                  ← Previous in this lesson
                </button>
              : null}
              {nextV ?
                <button
                  type="button"
                  className="btn-ghost text-sm min-h-[44px] border border-slate-600 touch-manipulation"
                  onClick={() => setSearchParams({ video: nextV.videoId })}
                >
                  Next in this lesson →
                </button>
              : null}
            </div>
          </div>
        : null}

        {group.length > 0 ?
          <details className="rounded-xl border border-slate-700 bg-slate-900/35 group">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-200 touch-manipulation min-h-[48px] flex items-center [&::-webkit-details-marker]:hidden">
              <span className="mr-2 text-slate-600 group-open:text-emerald-400">▸</span>
              All Messer videos in this lesson ({group.length})
            </summary>
            <ul className="px-4 pb-3 space-y-2 text-sm text-slate-300 border-t border-slate-800 pt-2 max-h-64 overflow-y-auto">
              {group.map((x) => (
                <li key={x.videoId} className="flex flex-wrap justify-between gap-2">
                  <span className={x.videoId === selectedVideoId ? "text-emerald-200 font-medium" : ""}>
                    <span className="text-slate-500 text-xs tabular-nums mr-2">#{x.index}</span>
                    {x.title}
                  </span>
                  <button
                    type="button"
                    className="text-emerald-400 underline text-xs shrink-0 touch-manipulation"
                    onClick={() => setSearchParams(x.videoId === primaryId ? {} : { video: x.videoId })}
                  >
                    {x.videoId === selectedVideoId ? "Now playing" : "Play this clip"}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        : null}

        <VideoStudyMode
          key={selectedVideoId || "none"}
          lessonId={id}
          lesson={L}
          variant="watch-page"
          embedUrl={embedUrl}
          videoTitle={videoTitle}
          youtubeUrl={youtubeUrl}
          professorMesserPageUrl={vBase.professorMesserPageUrl}
          estimatedWatchTimeMin={vBase.estimatedWatchTimeMin ?? null}
          needsVideoUrl={needsVideoUrl}
          continueHref={`/lesson/${id}`}
          continueLabel="Full lesson · labs & quizzes →"
          pdfGuideHref={pdfHref}
          pdfSearchPhrase={searchPhrase}
          pdfGuideEyebrow="Same search phrase as PDF guide hub"
        />

        {needsVideoUrl && (
          <div className="rounded-xl border border-amber-600/50 bg-amber-950/40 px-3 py-3 text-amber-100 text-sm">
            <strong className="text-amber-50">No embed for this slot yet.</strong> Use the playlist link on the lesson page — your notes and quiz still work the same.
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
