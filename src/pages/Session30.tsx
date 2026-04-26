import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import { lessons } from "../data/lessons";

const PHASES: { t: [number, number]; label: string; hint: string }[] = [
  { t: [0, 2], label: "Warm-up recall", hint: "3 terms from last session, out loud" },
  { t: [2, 10], label: "Video + PDF highlights", hint: "3–8 yellow hooks only" },
  { t: [10, 20], label: "Notes + quick action", hint: "Brain book rows, max 5/lesson, 5–10/day" },
  { t: [20, 28], label: "Quiz / flashcards", hint: "Closed book where possible" },
  { t: [28, 30], label: "Teach-back", hint: "1 sentence + keyword" },
];

function phaseForElapsed(seconds: number) {
  const m = seconds / 60;
  if (m < 2) return PHASES[0]!;
  if (m < 10) return PHASES[1]!;
  if (m < 20) return PHASES[2]!;
  if (m < 28) return PHASES[3]!;
  return PHASES[4]!;
}

export default function Session30() {
  const { nextLesson, touchStreak, grantXp } = useProgress();
  const [sec, setSec] = useState(0);
  const [on, setOn] = useState(false);
  const total = 30 * 60;

  useEffect(() => {
    if (!on) return;
    touchStreak();
    const id = setInterval(() => {
      setSec((s) => {
        if (s >= total) {
          setOn(false);
          grantXp(10);
          return s;
        }
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [on, total, touchStreak, grantXp]);

  const ph = phaseForElapsed(sec);
  const nl = nextLesson && lessons[nextLesson] ? nextLesson : "1-1";
  return (
    <div className="max-w-xl">
      <h1 className="h1">30-Minute session</h1>
      <p className="text-slate-500 text-sm mt-1">Guided clock — same system as your training docs.</p>
      <div className="card mt-4 text-center">
        <p className="text-4xl font-mono text-white">
          {String(Math.floor(sec / 60)).padStart(2, "0")}:{String(sec % 60).padStart(2, "0")}
        </p>
        <p className="text-emerald-400 font-bold mt-2">{ph.label}</p>
        <p className="text-slate-400 text-sm mt-1">{ph.hint}</p>
        <p className="text-xs text-slate-500 mt-3">Suggested lesson: {lessons[nl]?.title}</p>
        <div className="flex gap-2 justify-center mt-4">
          <button type="button" className="btn" onClick={() => setOn(true)}>
            Start
          </button>
          <button type="button" className="btn-ghost" onClick={() => { setOn(false); setSec(0); }}>
            Reset
          </button>
        </div>
        {sec >= total && <p className="text-emerald-400 mt-2">Session complete +10 XP</p>}
      </div>
      <ol className="mt-6 space-y-2 text-sm text-slate-400 list-decimal pl-4">
        {PHASES.map((p) => (
          <li key={p.label}>
            {p.t[0]}–{p.t[1]} min: {p.label} — {p.hint}
          </li>
        ))}
      </ol>
      <Link to={`/lesson/${nl}`} className="btn mt-6 inline-block w-full text-center">
        Open lesson
      </Link>
    </div>
  );
}
