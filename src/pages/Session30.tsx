import { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import { lessons } from "../data/lessons";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import NextActionCard from "../components/NextActionCard";
import StatusBadge from "../components/StatusBadge";
import SessionMomentumCard from "../components/SessionMomentumCard";
import { buildSession30IdentityLine } from "../utils/identityPersonalization";

const PHASES: { t: [number, number]; label: string; hint: string }[] = [
  { t: [0, 2], label: "Warm-up recall", hint: "3 terms from last session, out loud" },
  { t: [2, 10], label: "Video + PDF highlights", hint: "3–8 yellow hooks only" },
  { t: [10, 20], label: "Notes + quick action", hint: "Brain book rows, max 5/lesson, 5–10/day" },
  { t: [20, 28], label: "Quiz / flashcards", hint: "Closed book where possible" },
  { t: [28, 30], label: "Teach-back", hint: "1 sentence + keyword" },
];

const PHASE_END_MIN = [2, 10, 20, 28, 30] as const;

function phaseForElapsed(seconds: number) {
  const m = seconds / 60;
  if (m < 2) return PHASES[0]!;
  if (m < 10) return PHASES[1]!;
  if (m < 20) return PHASES[2]!;
  if (m < 28) return PHASES[3]!;
  return PHASES[4]!;
}

function phaseIndexForElapsed(seconds: number): number {
  const m = seconds / 60;
  if (m < 2) return 0;
  if (m < 10) return 1;
  if (m < 20) return 2;
  if (m < 28) return 3;
  return 4;
}

export default function Session30() {
  const { nextLesson, touchStreak, grantXp, nextStep, takeExtensionIdentity, readiness, bumpStudyResume } = useProgress();
  const [sec, setSec] = useState(0);
  const [on, setOn] = useState(false);
  const [sessionIdentityAside, setSessionIdentityAside] = useState<string | null>(null);
  const sessionIdentityIssued = useRef(false);
  const total = 30 * 60;

  useEffect(() => {
    bumpStudyResume({ session30: true });
  }, [bumpStudyResume]);

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
  const done = sec >= total;
  const activePhaseIdx = done ? -1 : on ? phaseIndexForElapsed(sec) : -1;

  const dayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (!done || sessionIdentityIssued.current) return;
    if (!takeExtensionIdentity("session30")) return;
    sessionIdentityIssued.current = true;
    setSessionIdentityAside(buildSession30IdentityLine(readiness.label, dayIso));
  }, [done, takeExtensionIdentity, readiness.label, dayIso]);

  const phaseList = useMemo(
    () =>
      PHASES.map((p, phaseIdx) => {
        const endMin = PHASE_END_MIN[phaseIdx]!;
        const completed = sec / 60 >= endMin || done;
        const isCurrent = !done && on && activePhaseIdx === phaseIdx;
        return { p, completed, isCurrent };
      }),
    [sec, done, on, activePhaseIdx],
  );

  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        <PageHeader
          title="30-minute session"
          purpose="A single guided block: warm-up → video highlights → notes → quiz/cards → teach-back. The clock does not choose your lesson — it keeps you honest for 30 minutes."
          badge={
            <StatusBadge tone={on ? "accent" : "neutral"}>{on ? "Running" : done ? "Done" : "Ready"}</StatusBadge>
          }
        />

        <SectionCard title="Beginner quick guide" subtitle="How to use this timer">
          <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5 leading-relaxed">
            <li>Press <strong className="text-white">Start</strong> when you are ready to focus — the phase name updates automatically.</li>
            <li>Stay in one lesson flow; use the suggested lesson link below if you do not have one open.</li>
            <li>
              <strong className="text-white">Reset</strong> stops the clock and returns to 0:00 (no XP until you complete a full run).
            </li>
            <li>Finishing 30:00 grants +10 XP once per completed session (same logic as before).</li>
          </ul>
        </SectionCard>

        <div
          className={`card text-center transition-[box-shadow,border-color] duration-300 ${
            on && !done ? "ring-2 ring-emerald-600/50 border-emerald-800/40 bg-emerald-950/10" : ""
          } ${done ? "ring-2 ring-cyan-700/40 border-cyan-800/40 bg-cyan-950/15" : ""}`}
        >
          <p className="text-xs uppercase text-slate-500 tracking-wide">Elapsed</p>
          <p className="text-4xl sm:text-5xl font-mono text-white tabular-nums mt-1">
            {String(Math.floor(sec / 60)).padStart(2, "0")}:{String(sec % 60).padStart(2, "0")}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">of 30:00</p>

          <div
            className={`mt-4 rounded-xl px-3 py-3 border ${
              done
                ? "border-cyan-800/50 bg-cyan-950/20"
                : on
                  ? "border-emerald-700/50 bg-emerald-950/25"
                  : "border-slate-700 bg-slate-900/40"
            }`}
          >
            <p className="text-[10px] uppercase text-slate-500 font-semibold">Current phase</p>
            <p className="text-emerald-300 font-bold text-lg mt-1">{done ? "Session complete" : ph.label}</p>
            <p className="text-slate-400 text-sm mt-1 leading-snug">{done ? "Nice work — you stayed through all five blocks." : ph.hint}</p>
          </div>

          <p className="text-xs text-slate-500 mt-4">
            Suggested lesson: <span className="text-slate-300">{lessons[nl]?.title ?? nl}</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
            <button type="button" className="btn w-full sm:w-auto min-h-[48px] touch-manipulation" onClick={() => setOn(true)}>
              Start
            </button>
            <button
              type="button"
              className="btn-ghost w-full sm:w-auto min-h-[48px] touch-manipulation"
              onClick={() => {
                setOn(false);
                setSec(0);
                sessionIdentityIssued.current = false;
                setSessionIdentityAside(null);
              }}
            >
              Reset
            </button>
          </div>
          {done && <p className="text-emerald-400 mt-3 text-sm font-medium">Session complete · +10 XP</p>}
          {done && sessionIdentityAside && (
            <p className="text-xs text-slate-400 italic mt-3 leading-relaxed border-l border-slate-600 pl-3 text-left max-w-md mx-auto">
              {sessionIdentityAside}
            </p>
          )}
        </div>

        <SectionCard title="All five phases" subtitle="Same 30-minute structure as your training notes">
          <ol className="space-y-3 text-sm">
            {phaseList.map(({ p, completed, isCurrent }) => (
              <li
                key={p.label}
                className={`rounded-xl border px-3 py-3 transition-colors ${
                  isCurrent
                    ? "border-emerald-500/70 bg-emerald-950/30 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]"
                    : completed
                      ? "border-slate-700/80 bg-slate-900/30 opacity-80"
                      : "border-slate-800 bg-slate-900/20"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-500 font-mono text-xs w-16 shrink-0">
                    {p.t[0]}–{p.t[1]} min
                  </span>
                  <span className={`font-semibold ${isCurrent ? "text-emerald-200" : "text-slate-200"}`}>{p.label}</span>
                  {isCurrent && (
                    <StatusBadge tone="accent" className="!text-[10px]">
                      Now
                    </StatusBadge>
                  )}
                  {completed && !isCurrent && !done && (
                    <span className="text-[10px] text-slate-500 uppercase">Done</span>
                  )}
                </div>
                <p className="text-slate-400 text-xs mt-1.5 pl-0 sm:pl-[4.5rem] leading-relaxed">{p.hint}</p>
              </li>
            ))}
          </ol>
        </SectionCard>

        {done && (
          <SectionCard title="Session summary" subtitle="What you just finished">
            <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5">
              <li>Warm-up recall → video highlights → notes &amp; quick action → quiz/flashcards → teach-back.</li>
              <li>+10 XP added for completing the full 30 minutes (same rule as before).</li>
              <li>Next: mark progress on your lesson or take a short quiz while the ideas are fresh.</li>
            </ul>
          </SectionCard>
        )}

        {done && (
          <div className="rounded-2xl border border-violet-800/45 bg-violet-950/25 px-4 py-4">
            <p className="text-xs font-bold text-violet-200 uppercase tracking-wide">Next time, start here</p>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              When you come back, use <strong className="text-white">{nextStep.buttonLabel}</strong> — it matches the dashboard and your phone&apos;s green Continue bar.
            </p>
            <Link to={nextStep.href} className="btn w-full sm:w-auto text-center mt-3 inline-block min-h-[44px] touch-manipulation">
              {nextStep.buttonLabel} →
            </Link>
          </div>
        )}

        {done && <SessionMomentumCard hasTodayActivity />}

        <NextActionCard
          label="What to do next"
          description={done ? "Jump back into your lesson or follow Smart Coach's queue." : "Open your lesson, start the timer, and work only that phase until it changes."}
        >
          <div className="flex flex-col gap-2">
            <Link to={`/lesson/${nl}`} className="btn w-full text-center min-h-[48px] touch-manipulation">
              Open lesson: {lessons[nl]?.title ?? nl} →
            </Link>
            <Link to={nextStep.href} className="btn-ghost w-full text-center min-h-[48px] touch-manipulation">
              {nextStep.buttonLabel} →
            </Link>
          </div>
        </NextActionCard>
      </div>
    </AppShell>
  );
}
