import { useState, useRef, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import { ORDERED_LESSON_IDS, lessons } from "../data/lessons";
import { PBQ_SCENARIOS } from "../data/pbqCatalog";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import NextActionCard from "../components/NextActionCard";
import AITutorPanel from "../components/AITutorPanel";
import StatusBadge from "../components/StatusBadge";
import DailyMinimumCard from "../components/DailyMinimumCard";
import { readinessTrack, weakestDomainHintFromScores } from "../utils/readinessBand";
import { PDF_REGISTRY } from "../data/pdfRegistry";
import { flashcards as builtInFlashcards } from "../data/flashcards";

export default function ProgressPage() {
  const { state, readiness, levelInfo, nextStep, nextLesson, importProgress, exportProgress, resetAllProgress, bumpStudyResume } =
    useProgress();
  useEffect(() => {
    bumpStudyResume({ progressPage: true });
  }, [bumpStudyResume]);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const done = state.completedLessons.filter((id) => ORDERED_LESSON_IDS.includes(id)).length;
  const total = ORDERED_LESSON_IDS.length;
  const pct = Math.min(100, Math.round((done / Math.max(total, 1)) * 100));
  const r = readiness;

  const weakDomains = useMemo(
    () =>
      Object.entries(state.domainScore)
        .filter(([, v]) => v < 55)
        .sort((a, b) => a[1] - b[1]),
    [state.domainScore],
  );

  const weakAreas = useMemo(
    () => weakDomains.map(([d, v]) => `Domain ${d} (${v})`),
    [weakDomains],
  );

  const examHistory = useMemo(() => [...(state.practiceExamAttempts ?? [])].slice(-12).reverse(), [state.practiceExamAttempts]);

  const pdfStats = useMemo(() => {
    const lib = state.pdfLibrary;
    const by = lib?.bySection ?? {};
    let sectionsDone = 0;
    let highlightCount = 0;
    for (const v of Object.values(by)) {
      if (v.completedAt) sectionsDone++;
      highlightCount += v.highlights?.length ?? 0;
    }
    const files = lib?.localFileMeta ?? {};
    return { fileN: Object.keys(files).length, sectionsDone, highlightCount, brainNotes: state.notes.length };
  }, [state.pdfLibrary, state.notes.length]);

  const pbqMisses = useMemo(
    () =>
      [...state.missedJournal]
        .filter((m) => m.qid.startsWith("pbq-"))
        .reverse()
        .slice(0, 8),
    [state.missedJournal],
  );

  const hotCards = useMemo(() => {
    const entries = Object.entries(state.cardWrongStreak ?? {});
    entries.sort((a, b) => b[1] - a[1]);
    return entries.slice(0, 5);
  }, [state.cardWrongStreak]);

  const flashFrontById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of [...builtInFlashcards, ...state.userFlashcards]) {
      if (!m.has(c.id)) m.set(c.id, c.front.replace(/\*\*/g, "").trim());
    }
    return m;
  }, [state.userFlashcards]);

  const elitePortfolioRows = useMemo(() => {
    const m = state.eliteLabPortfolio ?? {};
    return Object.entries(m)
      .map(([compositeKey, row]) => ({
        compositeKey,
        ...row,
        lessonIdResolved:
          row.lessonId ?? (compositeKey.includes("::") ? compositeKey.split("::").slice(0, -1).join("::") : undefined),
      }))
      .sort((a, b) => (b.at ?? 0) - (a.at ?? 0))
      .slice(0, 30);
  }, [state.eliteLabPortfolio]);

  const onDownload = () => {
    const j = exportProgress();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([j], { type: "application/json" }));
    a.download = `securityplus-trainer-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onImport = () => {
    const r0 = importProgress(importText);
    if (r0.ok) {
      setImportMsg("Imported successfully. Refresh if anything looks off.");
      setImportText("");
    } else {
      setImportMsg(`Failed: ${r0.error}`);
    }
  };

  const pbqTitle = (qid: string) => PBQ_SCENARIOS.find((p) => `pbq-${p.id}` === qid)?.title ?? qid;
  const weakestHint = useMemo(() => weakestDomainHintFromScores(state.domainScore), [state.domainScore]);
  const track = useMemo(
    () => readinessTrack(r.score, r.label, { weakestDomainHint: weakestHint }),
    [r.score, r.label, weakestHint],
  );

  return (
    <AppShell>
      <div className="max-w-5xl lg:grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-6 items-start">
        <div className="min-w-0 space-y-8">
          <PageHeader
            title="Progress"
            purpose={
              <>
                <strong className="text-slate-200">This page is your safety hub:</strong> export often, import only when you mean to replace this device&apos;s copy.{" "}
                Nothing uploads unless <strong className="text-slate-200">you</strong> deploy optional cloud sync later — see below.
              </>
            }
            badge={<StatusBadge tone="ok">{pct}% course</StatusBadge>}
          />

          <DailyMinimumCard lessonId={nextLesson ?? undefined} />

          <SectionCard title="Optional cloud sync (design)" subtitle="Not required — local-first stays default">
            <p className="text-sm text-slate-300 leading-relaxed">
              The app is built so <strong className="text-white">no login is required</strong> and everything works offline-capable in the browser. A future optional sync could let you save encrypted progress to your own account or a passkey — with{" "}
              <strong className="text-white">the same JSON</strong> you export today as the source of truth.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Maintainer notes: see <code className="text-amber-200/90">CLOUD_SYNC_DESIGN.md</code> in the project root.
            </p>
          </SectionCard>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card">
              <h2 className="font-semibold text-white">Course</h2>
              <p className="text-3xl font-bold mt-2 text-emerald-400">{pct}%</p>
              <p className="text-slate-400 text-sm">
                {done} / {total} lessons (Messer order)
              </p>
              <p className="text-slate-500 text-sm mt-2">
                🔥 {state.streak} day streak · {state.xp} XP · {levelInfo.name} (next tier {levelInfo.next} XP)
              </p>
            </div>
            <div className="card">
              <h2 className="font-semibold text-white">Exam readiness</h2>
              <p className="text-xs text-emerald-300/90 font-medium mt-2 uppercase tracking-wide">Momentum</p>
              <p className="text-xl font-semibold text-white mt-1">{track.headline}</p>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">{track.sub}</p>
              <p className="text-2xl font-bold mt-3 text-white">{r.score}</p>
              <p className="text-slate-500 text-sm capitalize">{r.label.replace("_", " ")}</p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                This score reflects your activity here — use it to steer study, not as a pass/fail prediction.
              </p>
            </div>
          </div>

          <SectionCard title="Domain scores" subtitle="Below 55 = worth extra drills">
            <ul className="space-y-2 text-sm">
              {Object.entries(state.domainScore).map(([d, v]) => (
                <li key={d} className="flex justify-between gap-4 text-slate-300">
                  <span>Domain {d}</span>
                  <span className={v < 50 ? "text-rose-300" : "text-slate-200"}>{v} / 100</span>
                </li>
              ))}
            </ul>
            <Link to="/weak" className="btn mt-4 w-full text-center">
              Open weak areas
            </Link>
          </SectionCard>

          <SectionCard title="Elite SOC lab portfolio" subtitle="Generated triage runs — shareable evidence of hands-on practice">
            {elitePortfolioRows.length === 0 ? (
              <p className="text-sm text-slate-500">
                Complete an Elite alert triage block inside any lesson’s training labs — your alignment scores anchor here automatically.
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {elitePortfolioRows.map((row) => {
                  const lid = row.lessonIdResolved;
                  const lt = lid ? lessons[lid]?.title : undefined;
                  return (
                    <li key={row.compositeKey} className="border border-slate-800 rounded-xl p-3 bg-slate-950/50">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-slate-200 font-semibold">{row.templateId.replace(/_/g, " ")}</p>
                        <span className="text-[10px] text-slate-500">{new Date(row.at).toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Best score <span className="text-emerald-300 font-semibold">{row.bestScore ?? row.score}</span> · Attempts{" "}
                        <span className="text-slate-200">{row.attempts ?? 1}</span> · Last submission {row.score}/100 ({row.pass ? "pass" : "practice"})
                      </p>
                      {lid && (
                        <p className="text-xs text-slate-400 mt-1">
                          Lesson:&nbsp;
                          <Link to={`/lesson/${lid}`} className="text-emerald-400 hover:underline">
                            {lt ?? lid}
                          </Link>
                          {" · "}
                          <Link to={`/quiz/${lid}`} className="text-cyan-300/90 hover:underline">
                            quiz
                          </Link>
                          {" · "}
                          <Link to={`/pdf-guides/messer-course-notes-v107/${lid}`} className="text-amber-200/85 hover:underline">
                            PDF slice
                          </Link>
                        </p>
                      )}
                      {row.artifacts?.length ? (
                        <p className="text-[11px] text-slate-500 mt-2">
                          Evidence snippets:{" "}
                          <span className="text-slate-300">{row.artifacts.slice(0, 3).join(" · ")}</span>
                        </p>
                      ) : null}
                      {row.skills?.length ? (
                        <p className="text-[11px] text-slate-500 mt-1">Skills keyed: {row.skills.join(", ")}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="text-xs text-slate-500 mt-3">
              These rows export with your backup JSON — treat them as resume bullets describing structured SOC-style practice.
            </p>
          </SectionCard>

          <SectionCard title="Practice exam history" subtitle="Most recent attempts on this device">
            {examHistory.length === 0 ? (
              <p className="text-sm text-slate-500">No scored attempts yet — open the practice exam hub.</p>
            ) : (
              <ul className="text-sm text-slate-300 space-y-2">
                {examHistory.map((a) => (
                  <li key={`${a.examId}-${a.at}`} className="border-b border-slate-800 pb-2">
                    <span className="text-slate-200 font-medium">{a.examId.replace(/^messer-exam-/, "Exam ").toUpperCase()}</span> ·{" "}
                    <span className="text-emerald-300">
                      {a.correct}/{a.total}
                    </span>{" "}
                    ({Math.round((a.correct / a.total) * 100)}%) ·{" "}
                    <span className="text-slate-500 capitalize">{a.mode}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/practice-exams" className="btn-ghost mt-3 w-full text-center inline-block text-sm">
              Practice exams →
            </Link>
          </SectionCard>

          <SectionCard title="PBQ skill labs" subtitle="Passes boost readiness; misses are listed for retry">
            <p className="text-sm text-slate-300 mb-3">
              Passed at least once:{" "}
              <strong className="text-emerald-300">{state.pbqPassedIds?.length ?? 0}</strong> / {PBQ_SCENARIOS.length} scenarios
            </p>
            {pbqMisses.length === 0 ? (
              <p className="text-sm text-slate-500">No PBQ misses in your journal — or you have not submitted a wrong order yet.</p>
            ) : (
              <ul className="text-sm text-slate-300 space-y-1">
                {pbqMisses.map((m) => (
                  <li key={`${m.qid}-${m.at}`}>
                    {pbqTitle(m.qid)} →{" "}
                    <Link to={`/pbq/${m.qid.replace(/^pbq-/, "")}`} className="text-emerald-400">
                      retry lab
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/practice-exams/pbq" className="btn-ghost mt-3 w-full text-center inline-block text-sm">
              PBQ hub →
            </Link>
          </SectionCard>

          <SectionCard title="Flashcards" subtitle="Deck health on this device">
            <ul className="text-sm text-slate-300 space-y-2">
              <li>
                <strong className="text-white">Your cards:</strong> {state.userFlashcards.length} (includes mistake-generated)
              </li>
              <li>
                <strong className="text-white">Scheduled reviews:</strong> {state.spaced.length} in the spaced queue
              </li>
              <li>
                <strong className="text-white">Due now:</strong> {state.spaced.filter((s) => s.nextReview <= Date.now()).length}
              </li>
            </ul>
            {hotCards.length > 0 && (
              <p className="text-xs text-amber-200/80 mt-2">
                Cards you tapped Again most:{" "}
                {hotCards
                  .map(([id, n]) => {
                    const front = flashFrontById.get(id);
                    const label = front
                      ? front.length > 52
                        ? `${front.slice(0, 52)}…`
                        : front
                      : "study card";
                    return `"${label}" (${n}×)`;
                  })
                  .join(" · ")}
              </p>
            )}
            <Link to="/flashcards" className="btn mt-3 w-full text-center inline-block">
              Study flashcards →
            </Link>
          </SectionCard>

          <SectionCard title="PDF guides (this device)" subtitle="Your PDF copies stay in this browser only">
            <ul className="text-sm text-slate-300 space-y-2">
              <li>
                <strong className="text-white">PDF files saved:</strong> {pdfStats.fileN} / {PDF_REGISTRY.length} listed guides
              </li>
              <li>
                <strong className="text-white">Guide sections completed:</strong> {pdfStats.sectionsDone}
              </li>
              <li>
                <strong className="text-white">Saved highlight hooks:</strong> {pdfStats.highlightCount}
              </li>
              <li>
                <strong className="text-white">Brain Book rows (all lessons):</strong> {pdfStats.brainNotes}
              </li>
            </ul>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <Link to="/pdf-setup" className="btn w-full sm:w-auto text-center">
                Add PDF files →
              </Link>
              <Link to="/pdf-guides" className="btn-ghost w-full sm:w-auto text-center border border-slate-600">
                PDF guides →
              </Link>
            </div>
            <p className="text-xs text-amber-200/85 mt-3 leading-relaxed border-t border-slate-800 pt-3">
              Your PDF files stay in this browser. <strong className="text-amber-100">Export backup below does not include PDF binaries</strong> — only
              progress JSON. After a new device or if you clear site data, <strong>re-add PDFs</strong> under Add PDF files.
            </p>
          </SectionCard>

          <div id="backup">
          <SectionCard
            title="Backup & restore"
            subtitle="Export JSON — no server upload"
          >
            <p className="text-slate-500 text-sm max-w-lg leading-relaxed">
              <strong className="text-amber-200/90">Import replaces</strong> progress on this device after confirmation in the importer. Keep a dated export before importing someone else&apos;s file.{" "}
              <strong className="text-slate-400">PDF files are not inside this JSON</strong> — use Add PDF files again after restore if needed.
            </p>
            <div className="mt-3 flex flex-col sm:flex-row sm:flex-wrap gap-2">
              <button type="button" className="btn w-full sm:w-auto text-center" onClick={onDownload}>
                Export progress (download JSON)
              </button>
              <button type="button" className="btn-ghost w-full sm:w-auto text-center" onClick={() => fileRef.current?.click()}>
                Import from file…
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                aria-label="Select backup JSON file"
                title="Select backup JSON file"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const rdr = new FileReader();
                  rdr.onload = () => {
                    setImportText(String(rdr.result ?? ""));
                    setImportMsg("File loaded — review below, then Import.");
                  };
                  rdr.readAsText(f);
                  e.target.value = "";
                }}
              />
            </div>
            <label className="block text-xs text-slate-500 mt-4 mb-1">Or paste JSON</label>
            <textarea
              className="w-full min-h-[120px] bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="{ ... }"
            />
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <button type="button" className="btn text-sm w-full sm:w-auto" onClick={onImport} disabled={!importText.trim()}>
                Import backup (this device)
              </button>
            </div>
            {importMsg && <p className="text-sm mt-2 text-amber-200/90">{importMsg}</p>}
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Import expects a <strong className="text-slate-400">progress backup</strong> from this app (Export above). Lesson JSON for authors belongs on the{" "}
              <Link to="/import" className="text-emerald-400 underline">
                content import
              </Link>{" "}
              page — pasting that here will fail on purpose.
            </p>
            <p className="text-xs text-rose-300/80 mt-4 border-t border-slate-800 pt-3">
              <button type="button" className="underline hover:text-rose-200" onClick={resetAllProgress}>
                Reset all progress on this device
              </button>{" "}
              (asks for confirmation)
            </p>
          </SectionCard>
          </div>

          <SectionCard title="Lesson content import" subtitle="Not the same as progress backup">
            <p className="text-sm text-slate-400">
              To merge new lesson JSON into the app source, use the Import page (validator + copy for <code className="text-amber-200/90">lessons.ts</code>).
            </p>
            <Link to="/import" className="btn-ghost mt-2 w-full sm:w-auto text-center inline-block text-sm">
              Open content import →
            </Link>
          </SectionCard>

          <NextActionCard label="Next system action" description="Same Continue target as Home — one queue everywhere.">
            <Link to={nextStep.href} className="btn w-full text-center">
              {nextStep.buttonLabel} →
            </Link>
          </NextActionCard>
        </div>

        <AITutorPanel
          className="lg:sticky lg:top-4 order-first lg:order-none"
          context={{
            surface: "dashboard",
            weakAreas,
            userProgress: {
              readiness: r.score,
              lessonsDone: done,
              examAttempts: examHistory.length,
              userCards: state.userFlashcards.length,
            },
            coachLines: [
              `Readiness ${r.score} (${r.label.replace("_", " ")})`,
              weakDomains[0] ? `Weakest: Domain ${weakDomains[0]![0]}` : "Domains look balanced",
            ],
          }}
        />
      </div>
    </AppShell>
  );
}
