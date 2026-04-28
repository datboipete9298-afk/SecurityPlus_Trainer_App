import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useProgress } from "../context/ProgressContext";
import { allQuestions } from "../data/quizzes";
import { labs } from "../data/labs";
import { getPbqTitleFromJournalQid } from "../data/pbqCatalog";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import FlowPrimaryStrip from "../components/FlowPrimaryStrip";
import ContinueButton from "../components/ContinueButton";
import { examDomainShortTitle } from "../utils/identityPersonalization";
import TrustReminderStrip from "../components/TrustReminderStrip";

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

  const primaryRepair = useMemo(() => {
    const m = missed[0];
    if (!m) return null;
    const row = missLabel(m);
    if (row.kind === "quiz") {
      return { href: `/pdf-guides/messer-course-notes-v107/${m.lessonId}`, label: "Fix this mistake" };
    }
    return { href: row.href, label: "Fix this mistake" };
  }, [missed]);

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <PageHeader
          title="Weak area repair"
          purpose="One repair path at a time — start with the button below, then come back to your queue when you are ready."
        />

        <TrustReminderStrip dense />

        <FlowPrimaryStrip>
          {primaryRepair ?
            <Link to={primaryRepair.href} className="btn w-full text-center min-h-[48px] touch-manipulation justify-center">
              {primaryRepair.label}
            </Link>
          : <ContinueButton step={nextStep} className="btn w-full text-center min-h-[48px] touch-manipulation" coachHint="" />}
        </FlowPrimaryStrip>

        <SectionCard title="Other ways to repair" subtitle="Optional — the strip above is enough.">
          <div className="flex flex-col gap-2">
            <button type="button" className="btn-ghost w-full min-h-[48px] touch-manipulation" onClick={() => addMistakeFlashcards()}>
              Turn recent misses into flashcards
            </button>
            {topMiss ?
              <Link to={topMiss.href} className="btn-ghost w-full text-center min-h-[48px] flex items-center justify-center touch-manipulation">
                Retry your newest miss ({topMiss.kind === "quiz" ? "quiz" : topMiss.kind === "pbq" ? "PBQ" : "other"})
              </Link>
            : <Link
                to="/practice-exams"
                className="btn-ghost w-full text-center min-h-[48px] flex items-center justify-center touch-manipulation"
              >
                Run targeted practice (practice exams)
              </Link>
            }
            <Link to={nextStep.href} className="btn-ghost w-full text-center min-h-[48px] flex items-center justify-center touch-manipulation">
              {nextStep.buttonLabel} (coach queue)
            </Link>
          </div>
          <p className="text-xs text-slate-500 mt-3">You have {state.userFlashcards.length} user flashcards · {missed.length} recent miss rows shown below.</p>
        </SectionCard>

        <details className="rounded-xl border border-slate-700 bg-slate-900/35 group mb-6">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-300 touch-manipulation min-h-[48px] flex items-center [&::-webkit-details-marker]:hidden">
            <span className="mr-2 text-slate-500 group-open:text-emerald-400">▸</span>
            Explain this page (optional)
          </summary>
          <p className="px-4 pb-4 pt-1 text-xs text-slate-500 leading-relaxed border-t border-slate-800">
            misses → flashcards, retry same item, then follow Smart Coach — fixing patterns beats cramming.
          </p>
        </details>

        <SectionCard title="Recent misses" subtitle="Newest first — tap retry on any row">
          <ul className="text-sm space-y-3">
            {missed.length === 0 && (
              <li className="text-slate-400 leading-relaxed border border-slate-800 rounded-lg p-3 bg-slate-950/40">
                No journal misses yet — keep running lesson quizzes and PBQs; wrong answers land here automatically. Meanwhile, use mixed practice so domains stay honest.
              </li>
            )}
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
            aria-expanded={detailsOpen ? "true" : "false"}
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
