import { Link, useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import { BEGINNER_STEPS, COURSE_TOUR_LINKS } from "../data/beginnerPath";
import { PROFESSOR_MESSER_COURSE_INDEX, PROFESSOR_MESSER_YOUTUBE_PLAYLIST } from "../data/videoConstants";

export default function StartHere() {
  const { markStartHereSeen } = useProgress();
  const nav = useNavigate();
  return (
    <div className="max-w-3xl space-y-8 text-slate-200 pb-4">
      <div>
        <p className="text-xs text-emerald-500 font-semibold uppercase tracking-wide">Start here · Friend mode</p>
        <h1 className="h1 mt-1">You don’t need any security background</h1>
        <p className="text-slate-400 text-base sm:text-lg mt-2 leading-relaxed">
          This app lines up with <strong className="text-slate-200">Professor Messer’s free SY0-701 course</strong> in order. For each section you get: the official public video
          (embedded or linked), plain-English notes, a short quiz, and a coach that always tells you what to do next.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Official index:{" "}
          <a className="text-emerald-400 underline" href={PROFESSOR_MESSER_COURSE_INDEX} target="_blank" rel="noreferrer">
            Professor Messer course page
          </a>{" "}
          · Playlist:{" "}
          <a className="text-emerald-400 underline" href={PROFESSOR_MESSER_YOUTUBE_PLAYLIST} target="_blank" rel="noreferrer">
            YouTube
          </a>
        </p>
      </div>

      <div className="card border-cyan-800/50 bg-slate-900/80">
        <h2 className="text-cyan-300 font-bold text-sm uppercase">Using this on your phone or a friend’s device</h2>
        <ul className="mt-3 text-sm sm:text-base text-slate-300 space-y-2 leading-relaxed list-disc pl-5">
          <li>
            <strong className="text-white">No login</strong> — we don’t create an account for you.
          </li>
          <li>
            <strong className="text-white">Progress saves in this browser only</strong> (your phone’s Safari, your laptop’s Chrome, etc.). It does not follow you to another
            device automatically.
          </li>
          <li>
            To move progress to another phone or PC, open <strong className="text-white">Progress</strong> → <strong className="text-white">Export</strong> on the old device, then{" "}
            <strong className="text-white">Import</strong> on the new one.
          </li>
          <li>
            If you <strong className="text-white">clear site data</strong>, progress on that browser can be lost — export a backup first.
          </li>
          <li>
            Keep <strong className="text-white">Beginner mode</strong> on (sidebar or menu) for extra plain-English on every lesson.
          </li>
        </ul>
      </div>

      <ol className="space-y-4">
        {BEGINNER_STEPS.map((s) => (
          <li key={s.id} className="card border-slate-700/80">
            <h2 className="text-white font-semibold">{s.title}</h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">{s.body}</p>
          </li>
        ))}
      </ol>

      <div className="card border-emerald-800/50 bg-emerald-950/20">
        <h2 className="text-emerald-300 font-bold text-sm uppercase">What to do right now</h2>
        <ol className="mt-3 list-decimal list-inside text-sm sm:text-base text-slate-200 space-y-2 leading-relaxed">
          <li>Turn on <strong>Beginner mode</strong> in the menu ☰ (keeps extra plain-English on every lesson).</li>
          <li>Open the first lesson in the roadmap (usually 1.0 or your next incomplete row).</li>
          <li>Watch 2 minutes, pause, write one keyword, then use the in-app mini-quiz.</li>
        </ol>
        <div className="mt-5 flex flex-col gap-3">
          <Link
            to={COURSE_TOUR_LINKS.firstLesson}
            className="btn text-base py-4 font-semibold shadow-lg shadow-emerald-900/30"
            onClick={() => markStartHereSeen()}
          >
            Start my first lesson →
          </Link>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link to={COURSE_TOUR_LINKS.roadmap} className="btn-ghost" onClick={() => markStartHereSeen()}>
              Open full roadmap
            </Link>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                markStartHereSeen();
                nav("/");
              }}
            >
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
