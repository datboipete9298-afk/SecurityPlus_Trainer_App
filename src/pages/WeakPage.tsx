import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useProgress } from "../context/ProgressContext";
import { allQuestions } from "../data/quizzes";
import { labs } from "../data/labs";
import { getPbqTitleFromJournalQid } from "../data/pbqCatalog";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import { examDomainShortTitle } from "../utils/identityPersonalization";

function missLabel(m: { qid: string; lessonId: string }) {
  const pbq = getPbqTitleFromJournalQid(m.qid);
  if (pbq) {
    return { kind: "pbq" as const, title: pbq.title, href: `/pbq/${pbq.pbqId}`, linkText: "Retry PBQ lab →" };
  }
  if (m.qid.startsWith("boss-miss-")) {
    return {
      kind: "other" as const,
      title: "Boss fight — review the explanation and try again from Boss fights.",
      href: "/boss",
      linkText: "Boss hub →",
    };
  }
  const q = allQuestions().find((x) => x.id === m.qid);
  const stem = q?.text?.trim() ?? "";
  const short = stem.length > 120 ? `${stem.slice(0, 120)}…` : stem || "Quiz question (see lesson quiz)";
  return { kind: "quiz" as const, title: short, href: `/quiz/${m.lessonId}`, linkText: "Retry lesson quiz →" };
}

export default function WeakPage() {
  const { state, addMistakeFlashcards, nextStep } = useProgress();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const missed = [...state.missedJournal].reverse().slice(0, 12);
  const weakDom = useMemo(
    () =>
      Object.entries(state.domainScore)
        .filter(([, v]) => v < 55)
        .sort((a, b) => a[1] - b[1]),
    [state.domainScore],
  );

  const topMiss = missed[0] ? missLabel(missed[0]) : null;

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <PageHeader
          title="Weak area repair"
          purpose="Your personal fix list: turn misses into flashcards, retry the item, then follow Smart Coach — fixing patterns beats cramming."
        />

        <SectionCard title="Pick one action now" subtitle="Three clear moves — any one moves you forward.">
          <div className="flex flex-col gap-2">
            <button type="button" className="btn w-full min-h-[48px] touch-manipulation" onClick={() => addMistakeFlashcards()}>
              1 · Turn recent quiz misses into flashcards
            </button>
            {topMiss ? (
              <Link to={topMiss.href} className="btn-ghost w-full text-center min-h-[48px] flex items-center justify-center touch-manipulation">
                2 · Retry your newest miss ({topMiss.kind === "quiz" ? "quiz" : topMiss.kind === "pbq" ? "PBQ" : "other"})
              </Link>
            ) : (
              <Link
                to="/practice-exams"
                className="btn-ghost w-full text-center min-h-[48px] flex items-center justify-center touch-manipulation"
              >
                2 · Run targeted practice (practice exams)
              </Link>
            )}
            <Link to={nextStep.href} className="btn-ghost w-full text-center min-h-[48px] flex items-center justify-center touch-manipulation">
              3 · {nextStep.buttonLabel} (Smart Coach queue)
            </Link>
          </div>
          <p className="text-xs text-slate-500 mt-3">You have {state.userFlashcards.length} user flashcards · {missed.length} recent miss rows shown below.</p>
        </SectionCard>

        <SectionCard title="Recent misses" subtitle="Newest first — tap retry on any row">
          <ul className="text-sm space-y-3">
            {missed.length === 0 && <li className="text-slate-500">No misses yet — take a quiz or submit a PBQ lab wrong once to see items here.</li>}
            {missed.map((m) => {
              const row = missLabel(m);
              return (
                <li key={`${m.qid}-${m.at}`} className="text-slate-300 border-b border-slate-800 pb-3">
                  <span className="text-[10px] uppercase text-slate-500 font-semibold">
                    {row.kind === "pbq" ? "PBQ lab" : row.kind === "quiz" ? "Lesson quiz" : "Other"}
                  </span>
                  <p className="text-sm text-slate-200 mt-1 leading-snug">{row.title}</p>
                  <Link className="text-emerald-400 font-medium block mt-2 min-h-[44px] flex items-center touch-manipulation" to={row.href}>
                    {row.linkText}
                  </Link>
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <div className="rounded-xl border border-slate-700 bg-slate-900/40 overflow-hidden">
          <button
            type="button"
            className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800/50 min-h-[48px] touch-manipulation flex justify-between items-center gap-2"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((o) => !o)}
          >
            <span>Domain scores &amp; lab reminders</span>
            <span className="text-slate-500 text-xs shrink-0">{detailsOpen ? "Hide" : "Show"}</span>
          </button>
          {detailsOpen && (
            <div className="px-4 pb-4 pt-0 border-t border-slate-800 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Domains under 55</p>
                <ul className="text-sm text-slate-300 space-y-2">
                  {weakDom.length === 0 && <li className="text-slate-500">None under 55 — keep mixing exams.</li>}
                  {weakDom.map(([d, v]) => (
                    <li key={d}>
                      {examDomainShortTitle(d)} (Domain {d}): {v}/100
                    </li>
                  ))}
                </ul>
                <Link to="/practice-exams" className="btn-ghost mt-3 w-full text-center inline-block text-sm min-h-[44px] touch-manipulation">
                  Practice exams →
                </Link>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Safe lab notes</p>
                <ul className="list-disc pl-4 text-slate-400 text-sm space-y-1">
                  {labs.slice(0, 4).map((l) => (
                    <li key={l.id}>
                      {l.title} — {l.safeWarning}
                    </li>
                  ))}
                </ul>
                <Link to="/sim" className="btn-ghost mt-3 w-full sm:w-auto text-center inline-block text-sm min-h-[44px] touch-manipulation">
                  Labs hub →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
