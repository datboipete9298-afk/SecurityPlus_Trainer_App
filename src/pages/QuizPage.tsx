import { useParams, Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState, useRef } from "react";
import { questionsByLesson } from "../data/quizzes";
import { lessons } from "../data/lessons";
import { useProgress } from "../context/ProgressContext";
import { gradeQuestion, isMultiSelect, correctAnswerLabel } from "../utils/quizHelpers";
import ContinueButton from "../components/ContinueButton";
import FlowPrimaryStrip from "../components/FlowPrimaryStrip";
import FeedbackPanel from "../components/FeedbackPanel";
import ConfidenceSelector from "../components/ConfidenceSelector";
import MicroTeachBack from "../components/MicroTeachBack";
import TrustReminderStrip from "../components/TrustReminderStrip";
import SessionSummary, { type SessionEntry } from "../components/SessionSummary";
import ExamReport from "../components/ExamReport";
import { buildQuizTutorFeedback } from "../core/feedbackEngine";
import { isKeyQuizQuestion, microTeachBackQuality, conceptKey } from "../core/adaptiveEngine";
import type { UserConfidenceLevel } from "../utils/storage";
import { emptyFeedbackLoop } from "../utils/storage";
import { smartQuizPraise } from "../utils/stickinessCopy";
import { pickQuizIdentityLine } from "../utils/identityReinforcement";
import AITutorPanel from "../components/AITutorPanel";
import SessionMomentumCard from "../components/SessionMomentumCard";
import {
  clearPracticeExamDraft,
  practiceExamDisplayLabel,
  readPracticeExamDraft,
  writePracticeExamDraft,
} from "../utils/practiceExamDraft";
import { buildMomentumPair } from "../utils/microEncouragement";
import { markUsage } from "../utils/localUsageSignals";
import CoachLine from "../components/CoachLine";

const MESSER_PREFIX = "messer-exam-";

/**
 * Session-only position key for lesson study quizzes — restores current question
 * on a tab refresh so users don't think their work vanished. Recorded answers
 * (right/wrong stats, flashcards) are unaffected; only `i` is persisted.
 */
function lessonQuizPosKey(id: string, wrongOnly: boolean, quickCap: number | null) {
  return `spt_lq_pos::${id}::wo${wrongOnly ? 1 : 0}::qc${quickCap ?? "all"}`;
}

export default function QuizPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const {
    recordQuiz,
    patchLessonProgress,
    nextStep,
    state,
    appendPracticeExamAttempt,
    recordQuizConfidence,
    markQuestionConfusing,
    bumpQuizRetryCount,
    addFlashcardFromQuizQuestion,
    saveMicroTeachBack,
    readiness,
    bumpStudyResume,
  } = useProgress();

  const isMesser = Boolean(id?.startsWith(MESSER_PREFIX));
  const modeParam = searchParams.get("mode");
  const mode: "exam" | "study" = modeParam === "study" ? "study" : isMesser ? "exam" : "study";
  const wrongOnly = searchParams.get("wrongOnly") === "1";
  const quickParam = searchParams.get("quick");
  const quickCap = useMemo(() => {
    const n = parseInt(quickParam ?? "", 10);
    return Number.isFinite(n) && n > 0 ? Math.min(n, 200) : null;
  }, [quickParam]);

  const fullQs = useMemo(() => (id ? questionsByLesson(id) : []), [id]);
  const baseQs = useMemo(() => {
    if (!quickCap || !fullQs.length) return fullQs;
    return fullQs.slice(0, quickCap);
  }, [fullQs, quickCap]);

  const lastWrongSet = useMemo(() => {
    if (!id || !wrongOnly || !isMesser) return null;
    const attempts = (state.practiceExamAttempts ?? []).filter((a) => a.examId === id);
    const last = attempts[attempts.length - 1];
    return last?.wrongIds?.length ? new Set(last.wrongIds) : null;
  }, [id, wrongOnly, isMesser, state.practiceExamAttempts]);

  const qs = useMemo(() => {
    if (!lastWrongSet) return baseQs;
    return baseQs.filter((q) => lastWrongSet.has(q.id));
  }, [baseQs, lastWrongSet]);

  const weakAreasQuiz = useMemo(
    () =>
      (["1", "2", "3", "4", "5"] as const)
        .filter((d) => (state.domainScore[d] ?? 50) < 47)
        .map((d) => `Domain ${d} (${state.domainScore[d]})`),
    [state.domainScore],
  );

  const [i, setI] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  /** Per-question feedback (lesson + study mode) */
  const [show, setShow] = useState(false);
  /** Messer exam mode: no per-Q reveal until review */
  const [examPhase, setExamPhase] = useState<"taking" | "review">("taking");
  /** Saved answers for exam mode grading at review */
  const [examAnswers, setExamAnswers] = useState<Record<string, { single: number | null; multi: number[] }>>({});
  /** Snapshot for review screen (state batching-safe). */
  const [reviewAnswers, setReviewAnswers] = useState<Record<string, { single: number | null; multi: number[] }> | null>(
    null,
  );

  const [draftLoaded, setDraftLoaded] = useState(false);
  /** Brief cue after autosaving Messer exam position (session-only). */
  const [examDraftSavedAck, setExamDraftSavedAck] = useState(false);
  const examDraftAckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Tutor mode: confidence before advancing or finishing */
  const [confidenceGate, setConfidenceGate] = useState<UserConfidenceLevel | null>(null);
  const [quizWrapUp, setQuizWrapUp] = useState(false);
  const [feedbackDetailOpen, setFeedbackDetailOpen] = useState(true);
  const [sessionLog, setSessionLog] = useState<SessionEntry[]>([]);
  const [teachDraft, setTeachDraft] = useState("");
  /** After a wrong answer, show whether a new miss flashcard was added (lesson / study flows only). */
  const [missFlashcardCue, setMissFlashcardCue] = useState<null | "new" | "existing">(null);
  const [quizIdentityLine, setQuizIdentityLine] = useState<string | null>(null);

  useEffect(() => {
    setI(0);
    setSel(null);
    setPicked([]);
    setShow(false);
    setExamPhase("taking");
    setExamAnswers({});
    setReviewAnswers(null);
    setDraftLoaded(false);
    setConfidenceGate(null);
    setQuizWrapUp(false);
    setFeedbackDetailOpen(true);
    setSessionLog([]);
    setTeachDraft("");
    setMissFlashcardCue(null);
    setQuizIdentityLine(null);
    setExamDraftSavedAck(false);
    if (examDraftAckTimerRef.current) {
      clearTimeout(examDraftAckTimerRef.current);
      examDraftAckTimerRef.current = null;
    }
  }, [id, mode, wrongOnly]);

  useEffect(
    () => () => {
      if (examDraftAckTimerRef.current) clearTimeout(examDraftAckTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!id) return;
    if (isMesser) bumpStudyResume({ practiceExamId: id });
    else bumpStudyResume({ quizLessonId: id });
  }, [id, isMesser, bumpStudyResume]);

  useEffect(() => {
    setQuizWrapUp(false);
    setQuizIdentityLine(null);
  }, [i]);

  useEffect(() => {
    if (!id || isMesser) return;
    try {
      const raw = sessionStorage.getItem(lessonQuizPosKey(id, wrongOnly, quickCap));
      if (!raw) return;
      const n = parseInt(raw, 10);
      if (!Number.isFinite(n) || n <= 0) return;
      const cap = qs.length;
      if (cap <= 1) return;
      setI(Math.min(n, cap - 1));
    } catch {
      /* sessionStorage unavailable — ignore */
    }
  }, [id, isMesser, wrongOnly, quickCap, qs.length]);

  useEffect(() => {
    if (!id || isMesser) return;
    if (i <= 0) return;
    try {
      sessionStorage.setItem(lessonQuizPosKey(id, wrongOnly, quickCap), String(i));
    } catch {
      /* ignore */
    }
  }, [id, isMesser, wrongOnly, quickCap, i]);

  useEffect(() => {
    if (!id || isMesser) return;
    if (!quizWrapUp) return;
    try {
      sessionStorage.removeItem(lessonQuizPosKey(id, wrongOnly, quickCap));
    } catch {
      /* ignore */
    }
  }, [id, isMesser, wrongOnly, quickCap, quizWrapUp]);

  useEffect(() => {
    if (!id || !isMesser || draftLoaded || mode !== "exam" || wrongOnly) return;
    const d = readPracticeExamDraft(id);
    if (d && qs.length) {
      setI(Math.min(d.i, qs.length - 1));
      const idx = Math.min(d.i, qs.length - 1);
      const curQ = qs[idx]!;
      const saved = d.answers[curQ.id];
      if (saved?.multi) setPicked(saved.multi);
      else if (saved?.single != null) setSel(saved.single);
      setExamAnswers(
        Object.fromEntries(
          Object.entries(d.answers).map(([qid, v]) => [
            qid,
            { single: v.single ?? null, multi: v.multi ?? [] },
          ]),
        ),
      );
    }
    setDraftLoaded(true);
  }, [id, isMesser, qs, draftLoaded, mode, wrongOnly]);

  const resetQuestionUi = () => {
    setSel(null);
    setPicked([]);
    setShow(false);
    setConfidenceGate(null);
    setFeedbackDetailOpen(true);
    setMissFlashcardCue(null);
    setQuizIdentityLine(null);
  };

  const q = qs[i] ?? null;
  const multi = q ? isMultiSelect(q) : false;

  const tutorFeedback = useMemo(() => {
    if (!q || !show || (isMesser && mode === "exam")) return null;
    const correct = gradeQuestion(q, sel, picked);
    const w = state.questionStats[q.id]?.w ?? 0;
    const missBefore = correct ? w : Math.max(0, w - 1);
    const fl = state.feedbackLoop ?? emptyFeedbackLoop();
    const fc = fl.falseConfidenceHitsByQuestionId[q.id] ?? 0;
    const ck = conceptKey(q.lessonId, q.examKeyword);
    const confusionHits = fl.confusionSignalByConcept[ck] ?? 0;
    return buildQuizTutorFeedback(q, sel, picked, {
      missStreakBefore: missBefore,
      falseConfidenceHitsAfterAttempt: fc,
      confusionHits,
      feedbackLoop: fl,
    });
  }, [show, isMesser, mode, q, sel, picked, state.questionStats, state.feedbackLoop]);

  useEffect(() => {
    if (!show || !q) return;
    const saved = state.feedbackLoop?.teachBackMicroByQuestionId[q.id]?.text ?? "";
    setTeachDraft(saved);
  }, [show, q?.id, state.feedbackLoop]);

  const togglePick = (idx: number) => {
    if (show) return;
    if (isMesser && mode === "exam" && examPhase !== "taking") return;
    setPicked((p) => (p.includes(idx) ? p.filter((x) => x !== idx) : [...p, idx]));
  };

  const submitMultiStudy = () => {
    if (!q || show || !multi) return;
    const ok = gradeQuestion(q, null, picked);
    const cardId = `u-mis-${q.id}`;
    const alreadyHad = state.userFlashcards.some((c) => c.id === cardId);
    const prevS = state.questionStats[q.id] ?? { c: 0, w: 0 };
    setQuizIdentityLine(
      pickQuizIdentityLine({
        questionId: q.id,
        domain: q.domain,
        lessonTitle: lessons[q.lessonId]?.title,
        readinessLabel: readiness.label,
        prevCorrect: prevS.c,
        prevWrong: prevS.w,
        correctNow: ok,
      }),
    );
    setShow(true);
    recordQuiz(q.id, q.lessonId, q.domain, ok, q.examKeyword);
    if (!ok && !(isMesser && mode === "exam")) setMissFlashcardCue(alreadyHad ? "existing" : "new");
    else setMissFlashcardCue(null);
    const snip = q.text.replace(/\s+/g, " ").trim();
    setSessionLog((prev) => {
      const rest = prev.filter((e) => e.qid !== q.id);
      return [
        ...rest,
        {
          qid: q.id,
          correct: ok,
          keyword: q.examKeyword.split(",")[0]?.trim() ?? "concept",
          textSnippet: snip.length <= 72 ? snip : `${snip.slice(0, 72)}…`,
        },
      ];
    });
    if (!isMesser && i === qs.length - 1) patchLessonProgress(id!, { quizCompleted: true });
  };

  /** Exam-taking only: selection only. Lesson + study mode: select first, then “Check my answer”. */
  const onPickSingle = (idx: number) => {
    if (!q) return;
    if (isMesser && mode === "exam" && examPhase === "taking") {
      setSel(idx);
      return;
    }
    if (show || multi) return;
    setSel(idx);
  };

  const confirmSingleAnswer = () => {
    if (!q || show || multi || sel == null) return;
    const ok = sel === q.correctIndex;
    const cardId = `u-mis-${q.id}`;
    const alreadyHad = state.userFlashcards.some((c) => c.id === cardId);
    const prevS = state.questionStats[q.id] ?? { c: 0, w: 0 };
    setQuizIdentityLine(
      pickQuizIdentityLine({
        questionId: q.id,
        domain: q.domain,
        lessonTitle: lessons[q.lessonId]?.title,
        readinessLabel: readiness.label,
        prevCorrect: prevS.c,
        prevWrong: prevS.w,
        correctNow: ok,
      }),
    );
    setShow(true);
    recordQuiz(q.id, q.lessonId, q.domain, ok, q.examKeyword);
    if (!ok && !(isMesser && mode === "exam")) setMissFlashcardCue(alreadyHad ? "existing" : "new");
    else setMissFlashcardCue(null);
    const snip = q.text.replace(/\s+/g, " ").trim();
    setSessionLog((prev) => {
      const rest = prev.filter((e) => e.qid !== q.id);
      return [
        ...rest,
        {
          qid: q.id,
          correct: ok,
          keyword: q.examKeyword.split(",")[0]?.trim() ?? "concept",
          textSnippet: snip.length <= 72 ? snip : `${snip.slice(0, 72)}…`,
        },
      ];
    });
    if (!isMesser && i === qs.length - 1) patchLessonProgress(id!, { quizCompleted: true });
  };

  const goNext = () => {
    if (!q || !id) return;
    if (isMesser && mode === "exam" && examPhase === "taking") {
      const single = multi ? null : sel;
      const multiAns = multi ? picked : [];
      if (multi && multiAns.length === 0) return;
      if (!multi && single == null) return;
      const nextAnswers = { ...examAnswers, [q.id]: { single, multi: multiAns } };
      setExamAnswers(nextAnswers);
      if (i >= qs.length - 1) {
        let correct = 0;
        const wrongIds: string[] = [];
        const domainHits: Partial<Record<string, { c: number; w: number }>> = {};
        for (const qq of qs) {
          const a = nextAnswers[qq.id] ?? { single: null, multi: [] };
          const ok = gradeQuestion(qq, a.single, a.multi);
          if (ok) correct++;
          else wrongIds.push(qq.id);
          recordQuiz(qq.id, qq.lessonId, qq.domain, ok, qq.examKeyword);
          const d = qq.domain;
          if (!domainHits[d]) domainHits[d] = { c: 0, w: 0 };
          if (ok) domainHits[d]!.c++;
          else domainHits[d]!.w++;
        }
        appendPracticeExamAttempt({
          at: Date.now(),
          examId: id,
          mode: "exam",
          correct,
          total: qs.length,
          wrongIds,
          domainHits,
        });
        clearPracticeExamDraft(id);
        setReviewAnswers(nextAnswers);
        setExamPhase("review");
        return;
      }
      const ni = i + 1;
      setI(ni);
      resetQuestionUi();
      const nq = qs[ni]!;
      const saved = nextAnswers[nq.id];
      if (isMultiSelect(nq)) setPicked(saved?.multi ?? []);
      else setSel(saved?.single ?? null);
      writePracticeExamDraft(id, {
        i: ni,
        answers: Object.fromEntries(
          Object.entries(nextAnswers).map(([k, v]) => [
            k,
            v.multi.length ? { multi: v.multi } : v.single != null ? { single: v.single } : {},
          ]),
        ),
      });
      if (examDraftAckTimerRef.current) clearTimeout(examDraftAckTimerRef.current);
      setExamDraftSavedAck(true);
      examDraftAckTimerRef.current = setTimeout(() => {
        setExamDraftSavedAck(false);
        examDraftAckTimerRef.current = null;
      }, 2200);
      bumpStudyResume({ practiceExamId: id });
      return;
    }
    resetQuestionUi();
    if (i < qs.length - 1) setI(i + 1);
  };

  const optionClass = (j: number) => {
    if (!q) return "";
    if (!show && !(isMesser && mode === "exam" && examPhase === "taking")) {
      if (multi && picked.includes(j)) return "border-emerald-500 bg-emerald-900/20";
      if (!multi && sel === j) return "border-sky-500 bg-sky-900/25";
      return "border-slate-600 hover:border-emerald-600 bg-slate-800/50";
    }
    if (isMesser && mode === "study" && show) {
      if (multi) {
        const should = q.correctIndices!.includes(j);
        const chose = picked.includes(j);
        if (should && chose) return "border-emerald-500 bg-emerald-900/30";
        if (should && !chose) return "border-emerald-600/60 bg-emerald-900/10";
        if (!should && chose) return "border-rose-500 bg-rose-900/20";
        return "border-slate-700 opacity-50";
      }
      if (j === q.correctIndex) return "border-emerald-500 bg-emerald-900/30";
      if (j === sel) return "border-rose-500 bg-rose-900/20";
      return "border-slate-700 opacity-50";
    }
    if (isMesser && mode === "exam" && examPhase === "taking") {
      if (multi && picked.includes(j)) return "border-emerald-500 bg-emerald-900/20";
      if (!multi && sel === j) return "border-sky-500 bg-sky-900/20";
      return "border-slate-600 hover:border-emerald-600 bg-slate-800/50";
    }
    if (multi) {
      const should = q.correctIndices!.includes(j);
      const chose = picked.includes(j);
      if (should && chose) return "border-emerald-500 bg-emerald-900/30";
      if (should && !chose) return "border-emerald-600/60 bg-emerald-900/10";
      if (!should && chose) return "border-rose-500 bg-rose-900/20";
      return "border-slate-700 opacity-50";
    }
    if (j === q.correctIndex) return "border-emerald-500 bg-emerald-900/30";
    if (j === sel) return "border-rose-500 bg-rose-900/20";
    return "border-slate-700 opacity-50";
  };

  if (!id || !qs.length) {
    return (
      <div className="card space-y-3">
        <h1 className="h1">Quiz</h1>
        <p className="text-slate-400">
          {wrongOnly && isMesser
            ? "No missed questions from your last scored attempt — take an Exam mode run first, or all misses are cleared."
            : "No quiz for this lesson yet."}
        </p>
        <Link to={isMesser ? "/practice-exams" : "/roadmap"} className="btn mt-2 inline-block">
          {isMesser ? "Practice exam hub" : "Roadmap"}
        </Link>
      </div>
    );
  }

  const answerMap = reviewAnswers ?? examAnswers;

  if (isMesser && mode === "exam" && examPhase === "review") {
    const attempts = state.practiceExamAttempts ?? [];
    const last = attempts.filter((a) => a.examId === id).slice(-1)[0];
    const pct = last && last.total ? Math.round((last.correct / last.total) * 100) : 0;
    return (
      <div className="max-w-5xl lg:grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-6 items-start">
        <div className="max-w-2xl space-y-6 min-w-0">
        <FlowPrimaryStrip>
          <ContinueButton step={nextStep} className="btn w-full text-center min-h-[48px] touch-manipulation" coachHint="" />
        </FlowPrimaryStrip>
        <h1 className="h1">Exam review</h1>
        <p className="text-slate-400 text-sm">
          {last ? (
            <>
              Score: <strong className="text-white">{last.correct}</strong> / {last.total} ({pct}%)
            </>
          ) : (
            "Review your latest attempt below."
          )}
        </p>
        {last && (
          <div className="card text-sm space-y-2">
            <p className="text-slate-300 font-medium">Domain breakdown</p>
            <ul className="text-slate-400 space-y-1">
              {(["1", "2", "3", "4", "5"] as const).map((d) => {
                const h = last.domainHits[d];
                if (!h || (h.c === 0 && h.w === 0)) return null;
                return (
                  <li key={d}>
                    Domain {d}: <span className="text-emerald-400">{h.c} right</span> ·{" "}
                    <span className="text-rose-300">{h.w} wrong</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {id && (
          <ExamReport
            examLabel={id.replace(/^messer-exam-/, "Exam ").replace(/-/g, " ").toUpperCase()}
            results={qs.map((qq) => ({
              qid: qq.id,
              domain: qq.domain,
              correct: gradeQuestion(qq, answerMap[qq.id]?.single ?? null, answerMap[qq.id]?.multi ?? []),
            }))}
            persisted={state}
          />
        )}
        {last && pct < 65 && id && (
          <div className="rounded-xl border border-amber-800/45 bg-amber-950/25 p-4 space-y-3">
            <p className="text-sm text-amber-100/95">
              Score <strong className="text-white">{pct}%</strong> on {practiceExamDisplayLabel(id)} — fix misses first.
            </p>
            {last.wrongIds.length > 0 ?
              <Link className="btn w-full text-center text-sm min-h-[48px] touch-manipulation inline-flex items-center justify-center" to={`/quiz/${id}?mode=study&wrongOnly=1`}>
                Study your misses ({last.wrongIds.length}) →
              </Link>
            : <Link className="btn w-full text-center text-sm min-h-[48px] touch-manipulation inline-flex items-center justify-center" to={`/quiz/${id}?mode=study&quick=5`}>
                Quick practice (5) →
              </Link>}
            <details className="text-xs">
              <summary className="cursor-pointer text-slate-500 touch-manipulation py-1 [&::-webkit-details-marker]:hidden list-none">
                ▸ More repair links
              </summary>
              <div className="mt-2 flex flex-col gap-2">
                <Link className="btn-ghost text-sm min-h-[44px] justify-center border border-slate-600 text-center" to="/weak">
                  Weak areas
                </Link>
                <Link className="btn-ghost text-sm min-h-[44px] justify-center border border-slate-600 text-center" to="/flashcards">
                  Flashcards
                </Link>
                <Link className="btn-ghost text-sm min-h-[44px] justify-center border border-slate-600 text-center" to="/pdf-guides/messer-practice-exams-v18">
                  PDF guide
                </Link>
                <Link className="btn-ghost text-sm min-h-[44px] justify-center border border-slate-600 text-center" to="/pdf-setup">
                  Add PDF files
                </Link>
              </div>
            </details>
          </div>
        )}
        <div className="space-y-4">
          {qs.map((qq) => {
            const ans = answerMap[qq.id] ?? { single: null, multi: [] };
            const ok = gradeQuestion(qq, ans.single, ans.multi);
            return (
              <div key={qq.id} className={`card border ${ok ? "border-slate-700" : "border-rose-800/50"}`}>
                <p className="text-slate-200 text-sm font-medium">{qq.text}</p>
                <p className="text-xs text-slate-500 mt-2">
                  Your answer:{" "}
                  {isMultiSelect(qq)
                    ? ans.multi.length
                      ? ans.multi.map((x) => qq.options[x]).join("; ")
                      : "(none)"
                    : ans.single != null
                      ? qq.options[ans.single]
                      : "(none)"}
                </p>
                <p className="text-xs text-emerald-400/90 mt-1">Correct: {correctAnswerLabel(qq)}</p>
                <p className="text-sm text-slate-300 mt-3 border-t border-slate-800 pt-3">{qq.explanation}</p>
              </div>
            );
          })}
        </div>
        <details className="rounded-xl border border-slate-700 bg-slate-900/30 group">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm text-slate-400 touch-manipulation min-h-[44px] flex items-center [&::-webkit-details-marker]:hidden">
            <span className="mr-2 text-slate-600 group-open:text-emerald-400">▸</span>
            Retake or other links
          </summary>
          <div className="px-3 pb-3 flex flex-wrap gap-2 border-t border-slate-800 pt-3">
            <Link to={`/quiz/${id}?mode=exam`} className="btn text-sm min-h-[44px]">
              Retake full exam
            </Link>
            {last && last.wrongIds.length > 0 && (
              <Link to={`/quiz/${id}?mode=study&wrongOnly=1`} className="btn-ghost text-sm min-h-[44px]">
                Study misses ({last.wrongIds.length})
              </Link>
            )}
            <Link to="/practice-exams" className="btn-ghost text-sm min-h-[44px]">
              Hub
            </Link>
          </div>
        </details>
        <SessionMomentumCard hasTodayActivity compact />
        </div>
        <details className="rounded-2xl border border-violet-900/45 bg-violet-950/15 lg:sticky lg:top-4 group">
          <summary className="cursor-pointer list-none px-3 py-3 text-sm font-medium text-violet-100 touch-manipulation min-h-[48px] flex items-center [&::-webkit-details-marker]:hidden">
            <span className="text-violet-400/90 mr-2 group-open:rotate-90 transition-transform inline-block">▸</span>
            Ask something (optional)
          </summary>
          <div className="p-2 pt-0">
            <AITutorPanel
              className="!border-0 rounded-xl bg-violet-950/20"
              context={{
                surface: "quiz",
                weakAreas: weakAreasQuiz,
                quiz: {
                  stem: "Exam review — ask about any question above, domain gaps, or how to retake misses.",
                  options: [],
                  explanation: last
                    ? `Score ${last.correct} / ${last.total} (${pct}%). Missed ${last.wrongIds.length}.`
                    : undefined,
                },
                coachLines: last ? [`Score ${pct}%`, `${last.wrongIds.length} missed`] : undefined,
              }}
            />
          </div>
        </details>
      </div>
    );
  }

  const qq = q!;
  const correctNow = gradeQuestion(qq, sel, picked);
  const wMiss = state.questionStats[qq.id]?.w ?? 0;
  const progressionBlocked = !correctNow && wMiss >= 3;
  const keyQ = isKeyQuizQuestion(qq, i);
  const teachOk = !keyQ || microTeachBackQuality(teachDraft).ok;

  const flushConfidenceAnd = (fn: () => void) => {
    if (confidenceGate == null) return;
    recordQuizConfidence(qq.id, confidenceGate, correctNow);
    if (keyQ && teachDraft.trim()) saveMicroTeachBack(qq.id, teachDraft);
    setConfidenceGate(null);
    fn();
  };

  const examAiLocked = isMesser && mode === "exam" && examPhase === "taking";

  const primaryStripEl = (() => {
    if (isMesser && mode === "exam" && examPhase === "taking") {
      const dis = multi ? picked.length === 0 : sel == null;
      return (
        <button type="button" className="btn w-full text-center min-h-[48px] touch-manipulation" onClick={goNext} disabled={dis}>
          {i >= qs.length - 1 ? "Finish exam & review →" : "Save answer, next →"}
        </button>
      );
    }
    if (!show && !(isMesser && mode === "exam")) {
      if (multi) {
        return (
          <button
            type="button"
            className="btn w-full text-center min-h-[48px] touch-manipulation"
            onClick={submitMultiStudy}
            disabled={picked.length === 0}
          >
            Lock answer
          </button>
        );
      }
      return (
        <button
          type="button"
          className="btn w-full text-center min-h-[48px] touch-manipulation"
          onClick={confirmSingleAnswer}
          disabled={sel == null}
        >
          Lock answer
        </button>
      );
    }
    if (show && !(isMesser && mode === "exam")) {
      if (i === qs.length - 1 && quizWrapUp) {
        return <ContinueButton step={nextStep} className="btn w-full text-center min-h-[48px] touch-manipulation" coachHint="" />;
      }
      const nextDisabled = confidenceGate == null || progressionBlocked || !teachOk;
      if (i < qs.length - 1) {
        return (
          <button
            type="button"
            className="btn w-full text-center min-h-[48px] touch-manipulation"
            disabled={nextDisabled}
            onClick={() =>
              flushConfidenceAnd(() => {
                resetQuestionUi();
                setI(i + 1);
              })
            }
          >
            Save & next question →
          </button>
        );
      }
      return (
        <button
          type="button"
          className="btn w-full text-center min-h-[48px] touch-manipulation"
          disabled={nextDisabled}
          onClick={() =>
            flushConfidenceAnd(() => {
              setQuizWrapUp(true);
              markUsage("quiz_completed");
            })
          }
        >
          Finish quiz & wrap-up →
        </button>
      );
    }
    return null;
  })();

  return (
    <div className="max-w-5xl lg:grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-6 items-start">
      <div className="max-w-2xl space-y-4 min-w-0">
      {primaryStripEl ? <FlowPrimaryStrip>{primaryStripEl}</FlowPrimaryStrip> : null}
      <aside
        className="rounded-xl border border-sky-800/40 bg-sky-950/25 px-4 py-3"
        aria-labelledby="quiz-do-this-now-heading"
      >
        <h2 id="quiz-do-this-now-heading" className="text-[11px] font-bold uppercase tracking-wide text-sky-200/95 mb-2">
          Do this now
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          {isMesser && mode === "exam" && examPhase === "taking" ?
            "Answer each stem in order. Every explanation unlocks at the end — elimination beats overthinking on the clock."
          : isMesser && mode === "exam" && examPhase === "review" ?
            "Scan wrong rows first, then reread the rationales. Every miss is data, not a verdict about you."
          : "Pick your best answer, read the explanation whether you were right or wrong, then move on. Misses power your journal and optional flashcards automatically."}
        </p>
        {!isMesser && <CoachLine k="quizGoal" className="mt-2" />}
      </aside>
      <TrustReminderStrip dense />
      <div>
        <h1 className="h1">{isMesser ? "Practice exam" : "Quiz"}</h1>
        {!isMesser && (
          <p className="text-[11px] text-slate-500 mt-1.5 leading-snug" role="note">
            If you refresh, this run picks up where you left off. Your progress is still saved.
          </p>
        )}
        {quickCap && baseQs.length > 0 && (
          <details className="mt-2 rounded-xl border border-sky-700/45 bg-sky-950/35 text-sm group">
            <summary className="cursor-pointer list-none px-3 py-2.5 text-sky-100/95 touch-manipulation min-h-[44px] flex items-center [&::-webkit-details-marker]:hidden">
              <span className="mr-2 text-sky-500 group-open:text-sky-300">▸</span>
              Quick practice ({quickCap} of {fullQs.length} questions)
            </summary>
            <p className="px-3 pb-2.5 text-xs text-slate-400 border-t border-sky-900/40 pt-2">
              Remove <code className="text-slate-400">?quick=</code> from the URL for the full bank.
            </p>
          </details>
        )}
        <p className="text-slate-500 text-sm">
          {i + 1} / {qs.length} · {qq.type} · diff {qq.difficulty} · {qq.examKeyword}
          {multi && <span className="text-amber-400"> · Select all that apply ({qq.correctIndices!.length})</span>}
          {isMesser && (
            <span className="text-sky-400">
              {" "}
              · {mode === "exam" ? "Exam mode (explanations at end)" : "Study mode"}
            </span>
          )}
        </p>
        {isMesser && mode === "exam" && examPhase === "taking" && (
          <p className="text-xs text-slate-500 mt-1">Pick an answer, then use <strong className="text-slate-300">Do this next</strong> above.</p>
        )}
        {isMesser && mode === "exam" && examPhase === "taking" && examDraftSavedAck && (
          <p
            className="text-xs text-emerald-200/90 mt-2 ds-soft-in rounded-lg border border-emerald-800/40 bg-emerald-950/20 px-3 py-2 leading-relaxed"
            role="status"
            aria-live="polite"
          >
            Draft saved in this tab — step away anytime; resume from the practice hub when you return.
          </p>
        )}
      </div>
      <div className="card mt-2">
        <p className="text-slate-100 text-lg font-medium leading-snug">{qq.text}</p>
        <ul className="mt-4 space-y-2">
          {qq.options.map((o, j) => (
            <li key={j}>
              <button
                type="button"
                disabled={show && !(isMesser && mode === "exam")}
                onClick={() => (multi ? togglePick(j) : onPickSingle(j))}
                className={`w-full text-left rounded-xl px-4 py-4 border text-base sm:text-sm min-h-[52px] touch-manipulation active:bg-slate-800/80 ${optionClass(j)}`}
              >
                {o}
              </button>
            </li>
          ))}
        </ul>
        {!multi && !show && !(isMesser && mode === "exam" && examPhase === "taking") && (
          <p className="text-xs text-slate-500 mt-3">Tap a choice, then <strong className="text-slate-300">Do this next</strong> above.</p>
        )}
        {show && !(isMesser && mode === "exam") && tutorFeedback && (
          <>
            <FeedbackPanel
              feedback={tutorFeedback}
              quizQuestion={qq}
              singleSel={sel}
              multiSel={picked}
              keywordLine={qq.examKeyword}
              detailOpen={feedbackDetailOpen}
              onDetailOpenChange={setFeedbackDetailOpen}
            />
            {!correctNow && (
              <div className="rounded-xl border border-cyan-800/45 bg-cyan-950/25 p-3 mt-3 text-sm space-y-2" role="region" aria-label="PDF recall repair">
                <p className="text-cyan-100/95 font-medium text-xs uppercase tracking-wide">Guided repair</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Search <span className="text-slate-200 font-medium">{qq.examKeyword.split(",")[0]?.trim() ?? "the keyword"}</span> in your PDF guide, read it once, then Retry below — same pacing the exam rewards.
                </p>
                {String(qq.lessonId).startsWith("messer-exam") ?
                  <Link className="btn w-full text-center text-sm min-h-[44px] touch-manipulation" to="/pdf-guides/messer-practice-exams-v18">
                    Open PDF guide →
                  </Link>
                : <Link
                    className="btn w-full text-center text-sm min-h-[44px] touch-manipulation"
                    to={`/pdf-guides/messer-course-notes-v107/${qq.lessonId}`}
                  >
                    Open PDF guide (this lesson) →
                  </Link>}
                <details className="text-xs">
                  <summary className="cursor-pointer text-slate-500 touch-manipulation py-1 [&::-webkit-details-marker]:hidden list-none">
                    ▸ Add PDF files
                  </summary>
                  <Link className="block mt-2 text-emerald-400 underline" to="/pdf-setup">
                    Add PDF files →
                  </Link>
                </details>
              </div>
            )}
            {missFlashcardCue === "new" && (
              <div
                className="rounded-xl border border-emerald-700/45 bg-emerald-950/30 px-3 py-3 text-sm text-emerald-100 mt-3"
                role="status"
              >
                <strong className="text-white">We created a flashcard for this mistake.</strong> Open{" "}
                <Link className="text-emerald-300 underline font-medium" to={`/flashcards?lesson=${qq.lessonId}`}>
                  Flashcards for this lesson
                </Link>{" "}
                or the full{" "}
                <Link className="text-emerald-300 underline font-medium" to="/flashcards">
                  Flashcards
                </Link>{" "}
                deck to review it.
              </div>
            )}
            {missFlashcardCue === "existing" && (
              <p className="text-xs text-slate-400 mt-3">
                This miss was already in your flashcard deck — keep reviewing it under Flashcards.
              </p>
            )}
            {correctNow && (
              <p className="text-sm text-emerald-300/95 mt-3 leading-relaxed">{smartQuizPraise(qq)}</p>
            )}
            {correctNow && quizIdentityLine && (
              <p className="text-xs text-slate-400/95 mt-2 leading-relaxed border-l border-slate-600/80 pl-3">
                {quizIdentityLine}
              </p>
            )}
            {keyQ && (
              <MicroTeachBack
                value={teachDraft}
                onChange={setTeachDraft}
                keywordHint={qq.examKeyword.split(",")[0]?.trim() ?? qq.examKeyword}
              />
            )}
            {progressionBlocked && (
              <div
                className="rounded-xl border border-emerald-900/55 bg-emerald-950/20 p-4 mt-3 space-y-3"
                role="region"
                aria-label="Coach pause before next quiz step"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200/90">Coaching moment</p>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Let&apos;s fix this together — seeing the same miss three times usually means we need clearer wording in your notes, not more panic-clicking. This short pause is what improves your score.
                </p>
                {String(qq.lessonId).startsWith("messer-exam") ?
                  <Link
                    className="btn w-full text-center min-h-[48px] touch-manipulation justify-center"
                    to="/pdf-guides/messer-practice-exams-v18"
                  >
                    Open guided repair (PDF)
                  </Link>
                : <Link
                    className="btn w-full text-center min-h-[48px] touch-manipulation justify-center"
                    to={`/pdf-guides/messer-course-notes-v107/${qq.lessonId}`}
                  >
                    Open guided repair (PDF notes)
                  </Link>}
                <details className="group">
                  <summary className="cursor-pointer list-none text-xs text-slate-500 touch-manipulation py-2 min-h-[44px] flex items-center [&::-webkit-details-marker]:hidden">
                    <span className="text-slate-600 group-open:text-emerald-400 mr-1.5">▸</span>
                    More ways to reset the pattern
                  </summary>
                  <div className="flex flex-col gap-2 pt-1 pb-1">
                    <Link className="btn-ghost text-sm min-h-[44px] justify-center touch-manipulation" to={isMesser ? "/flashcards" : `/flashcards?lesson=${qq.lessonId}`}>
                      Flashcards
                    </Link>
                    <Link className="btn-ghost text-sm min-h-[44px] justify-center touch-manipulation" to="/weak">
                      Weak area hub
                    </Link>
                    <Link className="btn-ghost text-sm min-h-[44px] justify-center touch-manipulation" to={isMesser ? "/practice-exams" : `/lesson/${qq.lessonId}`}>
                      {isMesser ? "Practice exam hub" : "Reopen lesson"}
                    </Link>
                    <Link className="btn-ghost text-sm min-h-[44px] justify-center touch-manipulation" to="/sim">
                      Labs / sims
                    </Link>
                  </div>
                </details>
              </div>
            )}
            <ConfidenceSelector value={confidenceGate} onChange={setConfidenceGate} />
            <p className="text-xs text-slate-500 mt-2">Pick how sure you felt, then use <strong className="text-slate-300">Do this next</strong> above.</p>
            <details className="mt-3 rounded-lg border border-slate-700 bg-slate-900/40 group">
              <summary className="cursor-pointer list-none px-3 py-2 text-xs text-slate-400 touch-manipulation min-h-[44px] flex items-center [&::-webkit-details-marker]:hidden">
                <span className="mr-2 text-slate-600 group-open:text-emerald-400">▸</span>
                More (retry, flashcard, flag)
              </summary>
              <div className="px-3 pb-3 flex flex-col gap-2 border-t border-slate-800 pt-2">
                <button
                  type="button"
                  className="btn-ghost text-sm w-full min-h-[44px]"
                  onClick={() => {
                    bumpQuizRetryCount(qq.id);
                    markUsage("quiz_retry");
                    setQuizWrapUp(false);
                    setFeedbackDetailOpen(false);
                    setShow(false);
                    setConfidenceGate(null);
                    setMissFlashcardCue(null);
                    setSel(null);
                    setPicked([]);
                  }}
                >
                  Retry this question
                </button>
                <button type="button" className="btn-ghost text-sm w-full min-h-[44px]" onClick={() => addFlashcardFromQuizQuestion(qq)}>
                  Add to flashcards
                </button>
                <button type="button" className="btn-ghost text-sm w-full min-h-[44px]" onClick={() => markQuestionConfusing(qq.id)}>
                  Mark as confusing
                </button>
              </div>
            </details>
          </>
        )}
        {show && !(isMesser && mode === "exam") && i === qs.length - 1 && quizWrapUp && (() => {
          const correctCount = sessionLog.filter((e) => e.correct).length;
          const seed = `${id ?? "quiz"}:${qs.length}:${correctCount}`;
          const pair = buildMomentumPair("after-quiz", seed);
          return (
            <div className="mt-6 space-y-3 border-t border-slate-800 pt-4">
              <div
                className="rounded-xl border border-emerald-800/45 bg-emerald-950/25 px-4 py-3 space-y-1 ds-soft-in"
                role="status"
                aria-live="polite"
              >
                <p className="text-sm text-emerald-100 font-medium">Set complete — {correctCount} of {sessionLog.length} this round.</p>
                <p className="text-xs text-slate-400">This shows where to study next — steady data, not a verdict.</p>
                <p className="text-sm text-slate-200">{pair.confidence}</p>
                <p className="text-xs text-emerald-200/85">{pair.next}</p>
              </div>
              <details className="rounded-xl border border-slate-700 bg-slate-900/30 group">
              <summary className="cursor-pointer list-none px-3 py-2.5 text-sm text-slate-400 touch-manipulation min-h-[44px] flex items-center [&::-webkit-details-marker]:hidden">
                <span className="mr-2 text-slate-600 group-open:text-emerald-400">▸</span>
                Session summary
              </summary>
              <div className="px-3 pb-3 border-t border-slate-800 pt-3 space-y-3">
                <SessionMomentumCard hasTodayActivity />
                {!isMesser && <SessionSummary entries={sessionLog} lessonId={id} title="Summary" />}
              </div>
            </details>
            <details className="rounded-xl border border-slate-700 bg-slate-900/30 group">
              <summary className="cursor-pointer list-none px-3 py-2.5 text-sm text-slate-400 touch-manipulation min-h-[44px] flex items-center [&::-webkit-details-marker]:hidden">
                <span className="mr-2 text-slate-600 group-open:text-emerald-400">▸</span>
                Back to lesson or hub
              </summary>
              <div className="px-3 pb-3 border-t border-slate-800 pt-3 flex flex-col gap-2">
                {isMesser ? (
                  <Link to="/practice-exams" className="btn text-center text-sm min-h-[44px] inline-flex items-center justify-center">
                    Practice hub
                  </Link>
                ) : (
                  <Link to={`/lesson/${id}`} className="btn text-center text-sm min-h-[44px] inline-flex items-center justify-center">
                    Back to lesson
                  </Link>
                )}
              </div>
            </details>
            </div>
          );
        })()}
      </div>
      </div>
      <details className="rounded-2xl border border-violet-900/45 bg-violet-950/15 lg:sticky lg:top-4 group">
        <summary className="cursor-pointer list-none px-3 py-3 text-sm font-medium text-violet-100 touch-manipulation min-h-[48px] flex items-center [&::-webkit-details-marker]:hidden border-b border-transparent group-open:border-violet-900/40">
          <span className="text-violet-400/90 mr-2 group-open:rotate-90 transition-transform inline-block">▸</span>
          Ask something (optional)
        </summary>
        <div className="p-2 pt-0">
      <AITutorPanel
        className="lg:sticky lg:top-4 order-first lg:order-none !border-0 rounded-xl bg-violet-950/20"
        context={{
          surface: "quiz",
          examAiLocked,
          weakAreas: weakAreasQuiz,
          quiz: {
            stem: qq.text,
            options: qq.options,
            examKeyword: qq.examKeyword,
            explanation: qq.explanation,
            userWasCorrect:
              show && !(isMesser && mode === "exam") ? gradeQuestion(qq, sel, picked) : undefined,
            selectedLabel: multi
              ? picked.length
                ? picked.map((j) => qq.options[j]!).join("; ")
                : undefined
              : sel != null
                ? qq.options[sel]
                : undefined,
            correctLabel: correctAnswerLabel(qq),
          },
          coachLines: tutorFeedback
            ? [tutorFeedback.explanationSimple, tutorFeedback.examRecognitionRule, tutorFeedback.nextActionSuggestion]
            : undefined,
        }}
      />
        </div>
      </details>
    </div>
  );
}
