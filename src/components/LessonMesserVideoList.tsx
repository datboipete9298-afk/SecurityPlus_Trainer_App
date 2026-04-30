import { Link } from "react-router-dom";
import { getMesserVideosForLesson, getPrimaryMesserVideoIdForLesson } from "../data/videoLessonGroups";
import { PROFESSOR_MESSER_YOUTUBE_PLAYLIST } from "../data/videoConstants";

export default function LessonMesserVideoList({ lessonId }: { lessonId: string }) {
  const videos = getMesserVideosForLesson(lessonId);
  const primary = getPrimaryMesserVideoIdForLesson(lessonId);
  if (videos.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 space-y-2">
        <p className="text-xs font-semibold text-slate-200">Professor Messer videos for this lesson</p>
        <p className="text-xs text-slate-500 leading-relaxed">
          No dedicated playlist row for this study slot yet — use{" "}
          <a href={PROFESSOR_MESSER_YOUTUBE_PLAYLIST} className="text-emerald-400 underline" target="_blank" rel="noreferrer">
            Messer playlist
          </a>{" "}
          or continue with PDFs, Brain Book, and quizzes here.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 space-y-2">
      <p className="text-xs font-semibold text-emerald-200/90">Professor Messer videos for this lesson</p>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        Official playlist has <strong className="text-slate-300">{videos.length}</strong> clip{videos.length === 1 ? "" : "s"} grouped here — same study lesson, multiple YouTube entries.
      </p>
      <ul className="space-y-2 text-sm text-slate-200">
        {videos.map((v) => {
          const isPrimary = v.videoId === primary;
          return (
            <li key={v.videoId} className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800/60 pb-2 last:border-0">
              <span className="min-w-0 leading-snug">
                <span className="text-slate-500 tabular-nums text-xs mr-2">#{v.index}</span>
                {v.title}
                {isPrimary ?
                  <span className="ml-2 text-[10px] uppercase font-bold text-emerald-400/95">Primary</span>
                : null}
              </span>
              <span className="flex flex-wrap gap-2 shrink-0">
                <Link to={`/watch/${lessonId}?video=${encodeURIComponent(v.videoId)}`} className="text-emerald-400 underline text-xs">
                  Watch
                </Link>
                <a href={v.url} className="text-slate-400 underline text-xs" target="_blank" rel="noreferrer">
                  YouTube
                </a>
              </span>
            </li>
          );
        })}
      </ul>
      {videos.length > 1 ?
        <p className="text-[11px] text-slate-500">
          <strong className="text-slate-400">More Messer videos in this section:</strong> use Watch on any row — the guided watch page can switch clips with the same lesson id.
        </p>
      : null}
    </div>
  );
}
