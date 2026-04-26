import { useParams, Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { questionsByLesson } from "../data/quizzes";
import { useProgress } from "../context/ProgressContext";
import { gradeQuestion, isMultiSelect, correctAnswerLabel } from "../utils/quizHelpers";
import ContinueButton from "../components/ContinueButton";

const MESSER_PREFIX = "messer-exam-";

function draftKey(examId: string) {
  return `spt_exam_draft_v1_${examId}`;
}

type Draft = {
  i: number;
  answers: Record<string, { single?: number; multi?: number[] }>;
};

function readDraft(examId: string): Draft | null {
  try {
    const raw = sessionStorage.getItem(draftKey(examId));
    if (!raw) return null;
    const o = JSON.parse(raw) as Draft;
    if (typeof o?.i !== "number" || !o.answers || typeof o.answers !== "object") return null;
    return o;
  } catch {
    return null;
  }
}

function writeDraft(examId: string, d: Draft) {
  sessionStorage.setItem(draftKey(examId), JSON.stringify(d));
}

function clearDraft(examId: string) {
  sessionStorage.removeItem(draftKey(examId));
}

export default function QuizPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { recordQuiz, patchLessonProgress, nextStep, state, appendPracticeExamAttempt } = useProgress();

  const isMesser = Boolean(id?.startsWith(MESSER_PREFIX));
  const modeParam = searchParams.get("mode");
  const mode: "exam" | "study" = modeParam === "study" ? "study" : isMesser ? "exam" : "study";
  const wrongOnly = searchParams.get("wrongOnly") === "1";

  const baseQs = useMemo(() => (id ? questionsByLesson(id) : []), [id]);

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

  useEffect(() => {
    setI(0);
    setSel(null);
    setPicked([]);
    setShow(false);
    setExamPhase("taking");
    setExamAnswers({});
    setReviewAnswers(null);
    setDraftLoaded(false);
  }, [id, mode, wrongOnly]);

  useEffect(() => {
    if (!id || !isMesser || draftLoaded || mode !== "exam" || wrongOnly) return;
    const d = readDraft(id);
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
  };

  const q = qs[i] ?? null;
  const multi = q ? isMultiSelect(q) : false;

  const togglePick = (idx: number) => {
    if (show) return;
    if (isMesser && mode === "exam" && examPhase !== "taking") return;
    setPicked((p) => (p.includes(idx) ? p.filter((x) => x !== idx) : [...p, idx]));
  };

  const submitMultiStudy = () => {
    if (!q || show || !multi) return;
    const ok = gradeQuestion(q, null, picked);
    setShow(true);
    recordQuiz(q.id, q.lessonId, q.domain, ok);
    if (!isMesser && i === qs.length - 1) patchLessonProgress(id!, { quizCompleted: true });
  };

  const onPickSingle = (idx: number) => {
    if (!q) return;
    if (isMesser && mode === "exam" && examPhase === "taking") {
      setSel(idx);
      return;
    }
    if (show || multi) return;
    setSel(idx);
    setShow(true);
    recordQuiz(q.id, q.lessonId, q.domain, idx === q.correctIndex);
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
          recordQuiz(qq.id, qq.lessonId, qq.domain, ok);
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
        clearDraft(id);
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
      writeDraft(
        id,
        {
          i: ni,
          answers: Object.fromEntries(
            Object.entries(nextAnswers).map(([k, v]) => [
              k,
              v.multi.length ? { multi: v.multi } : v.single != null ? { single: v.single } : {},
            ]),
          ),
        },
      );
      return;
    }
    resetQuestionUi();
    if (i < qs.length - 1) setI(i + 1);
  };

  const optionClass = (j: number) => {
    if (!q) return "";
    if (!show && !(isMesser && mode === "exam" && examPhase === "taking")) {
      if (multi && picked.includes(j)) return "border-emerald-500 bg-emerald-900/20";
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
      <div className="max-w-2xl space-y-6">
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
        <div className="flex flex-wrap gap-2">
          <Link to={`/quiz/${id}?mode=exam`} className="btn">
            Retake full exam
          </Link>
          {last && last.wrongIds.length > 0 && (
            <Link to={`/quiz/${id}?mode=study&wrongOnly=1`} className="btn-ghost">
              Study only misses ({last.wrongIds.length})
            </Link>
          )}
          <Link to="/practice-exams" className="btn-ghost">
            Hub
          </Link>
        </div>
      </div>
    );
  }

  const qq = q!;

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="h1">{isMesser ? "Practice exam" : "Quiz"}</h1>
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
          <p className="text-xs text-slate-500 mt-1">
            Answer each question, then <strong className="text-slate-300">Next</strong>. No grading until you finish the last
            question.
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
        {multi && !show && !(isMesser && mode === "exam") && (
          <button type="button" className="btn mt-4" onClick={submitMultiStudy} disabled={picked.length === 0}>
            Submit answer
          </button>
        )}
        {isMesser && mode === "exam" && examPhase === "taking" && multi && (
          <button type="button" className="btn mt-4" onClick={goNext} disabled={picked.length === 0}>
            {i >= qs.length - 1 ? "Finish exam" : "Next"}
          </button>
        )}
        {isMesser && mode === "exam" && examPhase === "taking" && !multi && (
          <button type="button" className="btn mt-4" onClick={goNext} disabled={sel == null}>
            {i >= qs.length - 1 ? "Finish exam" : "Next"}
          </button>
        )}
        {show && !(isMesser && mode === "exam") && (
          <div className="mt-4 text-sm space-y-2 text-slate-300 border-t border-slate-800 pt-4">
            <p>
              <strong className="text-white">Why correct:</strong> {qq.explanation}
            </p>
            <p className="text-xs text-slate-500">Wrong options: {qq.wrongExplanations.join(" · ")}</p>
          </div>
        )}
        {show && !(isMesser && mode === "exam") && i < qs.length - 1 && (
          <button
            type="button"
            className="btn mt-4"
            onClick={() => {
              resetQuestionUi();
              setI(i + 1);
            }}
          >
            Next
          </button>
        )}
        {show && !(isMesser && mode === "exam") && i === qs.length - 1 && (
          <div className="mt-4 space-y-3">
            {isMesser ? (
              <Link to="/practice-exams" className="btn inline-block">
                Back to practice hub
              </Link>
            ) : (
              <Link to={`/lesson/${id}`} className="btn inline-block">
                Back to lesson
              </Link>
            )}
            {!isMesser && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Or follow the system next step:</p>
                <ContinueButton step={nextStep} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
