import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useProgress } from "../context/ProgressContext";
import { BEGINNER_STEPS, BEGINNER_STEP_COUNT, COURSE_TOUR_LINKS } from "../data/beginnerPath";
import { PROFESSOR_MESSER_COURSE_INDEX, PROFESSOR_MESSER_YOUTUBE_PLAYLIST } from "../data/videoConstants";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import NextActionCard from "../components/NextActionCard";
import StatusBadge from "../components/StatusBadge";
import { PRODUCT_PROMISE_LINE, PRODUCT_RHYTHM_LINE } from "../copy/productIdentity";

const FIRST_LESSON_QUIZ_ID = COURSE_TOUR_LINKS.firstLesson.replace(/^\/lesson\//, "");

export default function StartHere() {
  const { markStartHereSeen } = useProgress();
  const nav = useNavigate();
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6 pb-4 text-slate-200">
        <p className="text-base sm:text-lg text-slate-100 font-medium leading-snug text-center sm:text-left border border-emerald-800/40 bg-emerald-950/20 rounded-xl px-4 py-3">
          {PRODUCT_PROMISE_LINE} Follow the steps below — {PRODUCT_RHYTHM_LINE.toLowerCase()}
        </p>
        <p className="text-xs text-slate-400 text-center sm:text-left leading-relaxed px-1">
          <strong className="text-slate-300">Heads up:</strong> any readiness or percentage in the app is a <strong className="text-slate-200">study guide</strong> from your practice here — not a promise about the real CompTIA exam. Official materials still rule for policy and live PBQ formats.
        </p>

        <PageHeader
          eyebrow="Start here · Beginner-friendly"
          title="You don’t need any security background"
          purpose={
            <>
              {PRODUCT_PROMISE_LINE} SY0-701 in Professor Messer’s lesson order: Professor Messer videos, quizzes, flashcards, and safe labs. Tap{" "}
              <strong className="text-slate-200">Do this next</strong> below — the ☰ menu has the rest.
            </>
          }
          badge={<StatusBadge tone="ok">No login</StatusBadge>}
        />

        <NextActionCard
          label="Do this next"
          description="First win: open the lesson, watch a few minutes, save one keyword line to Brain Book, then check understanding with the short quiz. Progress stays in this browser until you export."
        >
          <Link
            to={COURSE_TOUR_LINKS.firstLesson}
            className="btn w-full text-center text-lg py-5 font-bold shadow-lg shadow-emerald-900/40 touch-manipulation ring-2 ring-emerald-500/30"
            onClick={() => markStartHereSeen()}
          >
            Start my first lesson →
          </Link>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <Link
              to={`/quiz/${FIRST_LESSON_QUIZ_ID}?quick=1`}
              className="btn-ghost w-full sm:w-auto text-center min-h-[44px] touch-manipulation"
              onClick={() => markStartHereSeen()}
            >
              Just one practice question first (2 min)
            </Link>
            <Link
              to={COURSE_TOUR_LINKS.roadmap}
              className="btn-ghost w-full sm:w-auto text-center min-h-[44px] touch-manipulation"
              onClick={() => markStartHereSeen()}
            >
              Browse full lesson path
            </Link>
            <button
              type="button"
              className="btn-ghost w-full sm:w-auto min-h-[44px] touch-manipulation"
              onClick={() => {
                markStartHereSeen();
                nav("/");
              }}
            >
              Open Home
            </button>
          </div>
        </NextActionCard>

        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
            Your first week — {BEGINNER_STEP_COUNT} short steps
          </h2>
          <ol className="space-y-3">
            {BEGINNER_STEPS.map((s, idx) => (
              <li key={s.id}>
                <div className="text-[10px] uppercase tracking-wide text-emerald-400/90 mb-1.5 font-semibold">
                  Step {idx + 1} of {BEGINNER_STEP_COUNT}
                </div>
                <SectionCard title={s.title}>
                  <p className="text-sm text-slate-300 leading-relaxed">{s.body}</p>
                  <p className="text-[11px] text-slate-500 mt-2 italic">Just focus on this step — the next one can wait.</p>
                </SectionCard>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/50 overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between gap-3 text-left px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800/60 touch-manipulation min-h-[48px]"
            aria-expanded={howItWorksOpen}
            onClick={() => setHowItWorksOpen((o) => !o)}
          >
            <span>How it works (videos, AI, saving progress) ▾</span>
            <span className="text-slate-500 text-xs shrink-0">{howItWorksOpen ? "Hide" : "Show"}</span>
          </button>
          {howItWorksOpen && (
            <div className="px-4 pb-4 pt-0 space-y-4 border-t border-slate-800">
              <SectionCard title="How Professor Messer fits in" subtitle="Public videos, same order as the app">
                <p className="text-sm text-slate-300 leading-relaxed">
                  Each section links to the official <strong className="text-white">Professor Messer</strong> video (embedded or on YouTube). You watch, highlight a few hooks, then use the in-app quiz and Smart Coach. This app does not replace his course; it structures your practice around it.
                </p>
                <p className="text-xs text-slate-500 mt-3">
                  Course index:{" "}
                  <a className="text-emerald-400 underline" href={PROFESSOR_MESSER_COURSE_INDEX} target="_blank" rel="noreferrer">
                    professormesser.com
                  </a>{" "}
                  · Playlist:{" "}
                  <a className="text-emerald-400 underline" href={PROFESSOR_MESSER_YOUTUBE_PLAYLIST} target="_blank" rel="noreferrer">
                    YouTube SY0-701
                  </a>
                </p>
              </SectionCard>

              <SectionCard title="Optional study tutor (AI)" subtitle="Smart Coach always works without it">
                <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5 leading-relaxed">
                  <li>
                    You can ask questions from the <strong className="text-white">study tutor panel</strong> on Home, lessons, and quizzes. If you use live AI, the key stays on your server — not in the browser.
                  </li>
                  <li>
                    If AI is unavailable, you still get <strong className="text-white">Smart Coach</strong>, quiz explanations, and labs.
                  </li>
                </ul>
              </SectionCard>

              <SectionCard title="Phone or PC — how progress saves" subtitle="This device only, unless you export">
                <ul className="text-sm text-slate-300 space-y-2 leading-relaxed list-disc pl-5">
                  <li>
                    <strong className="text-white">No account</strong> — progress stays in this browser (Safari on phone, Chrome on laptop, etc.).
                  </li>
                  <li>
                    <strong className="text-white">New device:</strong> open <strong className="text-white">Progress</strong>, <strong className="text-white">Export</strong> here, then <strong className="text-white">Import</strong> on the other device.
                  </li>
                  <li>
                    Clearing site data can erase progress — <strong className="text-white">export a backup first</strong>.
                  </li>
                  <li>
                    Turn on <strong className="text-white">Beginner mode</strong> in the ☰ menu for extra plain-English on every lesson.
                  </li>
                </ul>
              </SectionCard>
            </div>
          )}
        </div>

        <NextActionCard
          label="After your first lesson"
          description="Turn on Beginner mode in the ☰ menu if you want extra guidance. Then: video → highlights → quiz → flashcards."
        >
          <Link to="/progress" className="btn-ghost w-full sm:w-auto text-center inline-block min-h-[44px] touch-manipulation" onClick={() => markStartHereSeen()}>
            Backup: Progress and export / import →
          </Link>
        </NextActionCard>
      </div>
    </AppShell>
  );
}
