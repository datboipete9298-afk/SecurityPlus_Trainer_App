import { useParams, Link } from "react-router-dom";
import { lessons, getNextSectionId } from "../data/lessons";
import { getVideoForLesson } from "../data/videoMap";
import { getBeginnerContent } from "../utils/beginnerLayer";
import { useProgress } from "../context/ProgressContext";
import { isLessonUnlocked } from "../utils/adaptive";
import VideoEmbed from "../components/VideoEmbed";
import { useState } from "react";
import { questionsByLesson } from "../data/quizzes";

export default function WatchLesson() {
  const { id } = useParams();
  const { state, patchLessonProgress } = useProgress();
  const [chunk, setChunk] = useState(0);
  if (!id) return <p className="p-4">Missing lesson</p>;
  const L = lessons[id];
  if (!L?.hasFullContent) {
    return (
      <div className="card p-6">
        <p>Lesson not found.</p>
        <Link to="/roadmap" className="btn mt-2">
          Roadmap
        </Link>
      </div>
    );
  }
  if (!isLessonUnlocked(id, state)) {
    return (
      <div className="card p-6">
        <p>Complete the previous section first.</p>
        <Link to="/roadmap" className="btn mt-2">
          Roadmap
        </Link>
      </div>
    );
  }

  const v = getVideoForLesson(id);
  const b = getBeginnerContent(L);
  const nxt = getNextSectionId(id);
  const quizC = questionsByLesson(id).length;
  const pauseQ = b.pausePrompts[chunk % b.pausePrompts.length] ?? b.pausePrompts[0]!;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="text-xs text-slate-500">Guided watch · {L.sectionNumber ?? "—"}</p>
        <h1 className="h1 mt-0">{L.title}</h1>
        <p className="text-sm text-slate-500">Pause points cycle — answer in your head, then keep watching.</p>
      </div>

      <section className="card border-cyan-900/50">
        <h2 className="text-cyan-300 font-bold text-sm uppercase">Before the video</h2>
        <p className="text-slate-200 text-sm mt-2">{b.beginnerIntro}</p>
        <p className="text-xs text-slate-500 mt-2 font-semibold">3 words to know first</p>
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
      </section>

      {v.needsVideoUrl && (
        <div className="rounded-lg border border-amber-600/50 bg-amber-950/40 px-3 py-2 text-amber-200 text-sm">
          <strong className="text-amber-100">Video link needs verification</strong> — add the official YouTube id in <code className="text-xs">src/data/knownYoutubeIds.ts</code> for <code className="text-xs">{id}</code> (from the public Messer playlist). Until then, use YouTube or the course index from the main lesson page.
        </div>
      )}

      <VideoEmbed embedUrl={v.embedUrl} title={v.videoTitle} />
      <div className="flex flex-wrap gap-2">
        {v.youtubeUrl && (
          <a href={v.youtubeUrl} className="btn-ghost text-sm" target="_blank" rel="noreferrer">
            Open on YouTube
          </a>
        )}
        {v.professorMesserPageUrl && (
          <a href={v.professorMesserPageUrl} className="btn-ghost text-sm" target="_blank" rel="noreferrer">
            Open Professor Messer course page
          </a>
        )}
        <a
          href="https://www.youtube.com/playlist?list=PLG49S3nxzAnl4QDVqK-hOnoqcSKEIDDuv"
          className="btn-ghost text-sm"
          target="_blank"
          rel="noreferrer"
        >
          Open official playlist
        </a>
        <Link to={`/lesson/${id}`} className="btn text-sm">
          Full lesson + notes
        </Link>
        <button type="button" className="btn-ghost text-sm" onClick={() => patchLessonProgress(id, { videoWatched: true, videoWatchedAt: Date.now() })}>
          Mark video watched
        </button>
      </div>
      {v.estimatedWatchTimeMin != null && (
        <p className="text-xs text-slate-500">~{v.estimatedWatchTimeMin} min (from course index — real length may vary)</p>
      )}

      <section className="card border-amber-900/50">
        <h2 className="text-amber-300 font-bold text-sm uppercase">During the video</h2>
        <p className="text-slate-400 text-xs mt-1">🟡 Highlight only terms, short definitions, categories, steps — 3 to 8 total per video.</p>
        <p className="text-sm text-slate-200 mt-2">
          <span className="text-amber-200 font-medium">Highlight this in your notes (hooks):</span> {L.highlightRules.slice(0, 3).map((h) => h.term).join(" · ")}
        </p>
        <p className="text-xs text-amber-200/80 mt-3">Pause point ({chunk + 1})</p>
        <p className="text-slate-200 text-sm mt-1">{pauseQ}</p>
        <button type="button" className="btn-ghost text-xs mt-2" onClick={() => setChunk((c) => c + 1)}>
          Next pause prompt
        </button>
        <button type="button" className="btn text-xs ml-2" onClick={() => patchLessonProgress(id, { highlightsDone: true })}>
          I wrote my highlights
        </button>
      </section>

      <section className="card border-emerald-900/50">
        <h2 className="text-emerald-300 font-bold text-sm uppercase">After the video</h2>
        <p className="text-sm text-slate-200 mt-1">
          <strong>Write:</strong> {L.writeDown}
        </p>
        <p className="text-sm text-slate-200 mt-2">
          <strong>Do:</strong> {L.quickAction}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to={`/quiz/${id}`} className="btn">
            Take mini quiz ({quizC} Q)
          </Link>
          <Link to={`/flashcards?lesson=${id}`} className="btn-ghost">
            Flashcards
          </Link>
          <Link to="/session" className="btn-ghost">
            Start 30-min session
          </Link>
        </div>
        <p className="text-xs text-slate-500 mt-2">Teach-back and Brain Book: use the main lesson page.</p>
        {nxt && lessons[nxt] && (
          <p className="text-xs text-slate-500 mt-2">
            When ready: <Link className="text-emerald-400" to={`/watch/${nxt}`}>Next guided watch → {lessons[nxt]!.title}</Link>
          </p>
        )}
      </section>
    </div>
  );
}
