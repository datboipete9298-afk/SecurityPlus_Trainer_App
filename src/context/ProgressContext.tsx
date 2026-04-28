import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { BrainNote } from "../types";
import {
  loadState,
  saveState,
  exportStateJson,
  importStateFromJson,
  defaultState,
  mergeTodayActivity,
  type PersistedState,
  type PracticeExamAttempt,
  type TrainingRunsState,
  type UserConfidenceLevel,
  emptyFeedbackLoop,
  type EliteLabPortfolioEntry,
  type VideoStudyStats,
} from "../utils/storage";
import { ensureDomainDayBaseline } from "../utils/identityReinforcement";
import {
  canOfferExtensionIdentity,
  extensionIdentitySlotConsume,
  markExtensionIdentityEcho,
  type OutsideIdentityBucket,
} from "../utils/outsideQuizIdentity";
import { applyStudyResumeAndEngagement, type StudyResumePatch } from "../utils/studyResume";
import { correctAnswerLabel } from "../utils/quizHelpers";
import {
  examReadiness,
  smartCoach,
  nextLessonId,
  addMiss,
  updateDomainScore,
  getLevelName,
  getSmartCoachOutput,
  applyBossFailure,
} from "../utils/adaptive";
import { allQuestions } from "../data/quizzes";
import { conceptKey } from "../core/adaptiveEngine";
import { getNextStep } from "../core/nextStepEngine";
import {
  trainingLabRunKey,
  trainingSimRunKey,
  trainingDecisionKey,
  nextStateAfterTrainingRuns,
} from "../core/trainingProgress";
import { lessons } from "../data/lessons";
import { SECTION_ORDER } from "../data/sectionOrder";
import { pdfGuideSectionKey } from "../data/pdfGuides";
import type { PdfSectionProgress } from "../types/pdfLibrary";
import { isIndexedDbAvailable, listSavedPdfs } from "../utils/localPdfStore";
import { subscribePdfStorageChanged } from "../utils/pdfStorageBroadcast";
import type { DomainId, Flashcard, QuizQuestion } from "../types";
import type { LessonProgress } from "../types/beginner";
type Ctx = {
  state: PersistedState;
  xp: number;
  streak: number;
  completeLesson: (id: string, secondsSpent: number) => void;
  recordQuiz: (qid: string, lessonId: string, domain: string, correct: boolean, examKeyword?: string) => void;
  saveTeachBack: (lessonId: string, text: string) => void;
  addNote: (note: BrainNote) => void;
  deleteNote: (id: string) => void;
  touchStreak: () => void;
  pushSpaced: (cardId: string, gotRight: boolean) => void;
  addMistakeFlashcards: () => void;
  /** After highlights marked done: auto flashcard from first “must” term */
  seedHighlightMemory: (lessonId: string) => void;
  skipLab: (labId: string) => void;
  readiness: ReturnType<typeof examReadiness>;
  coach: ReturnType<typeof smartCoach>;
  coachV2: ReturnType<typeof getSmartCoachOutput>;
  /** Single navigation source — matches Smart Coach */
  nextStep: ReturnType<typeof getNextStep>;
  nextLesson: string | null;
  levelInfo: ReturnType<typeof getLevelName>;
  grantXp: (n: number) => void;
  completeBoss: (bossId: string, pass: boolean, xpReward: number, relatedLesson: string, domain: DomainId) => void;
  setBeginnerMode: (v: boolean) => void;
  setSimpleLessonMode: (v: boolean) => void;
  markStartHereSeen: () => void;
  patchLessonProgress: (lessonId: string, p: Partial<LessonProgress>) => void;
  /** Replace state from JSON (e.g. backup). */
  importProgress: (json: string) => { ok: boolean; error?: string };
  exportProgress: () => string;
  /** Clears progress after window.confirm — cannot be undone. */
  resetAllProgress: () => void;
  markDailyTrainingDone: () => void;
  appendPracticeExamAttempt: (a: PracticeExamAttempt) => void;
  recordPbqMiss: (domain: DomainId, pbqId: string) => void;
  /** First-time pass: domain nudge up, clears PBQ miss from journal, tracks for readiness */
  recordPbqPass: (domain: DomainId, pbqId: string) => void;
  recordTrainingLab: (lessonId: string, labId: string, pass: boolean) => void;
  /** Elite Lab Factory structured run — merged into `eliteLabPortfolio` */
  recordEliteLabPortfolio: (lessonId: string, entry: EliteLabPortfolioEntry) => void;
  recordTrainingSim: (lessonId: string, simId: string, score: number, pass: boolean) => void;
  recordTrainingDecision: (lessonId: string, scenarioId: string, correct: boolean) => void;
  recordQuizConfidence: (qid: string, level: UserConfidenceLevel, wasCorrect: boolean) => void;
  saveMicroTeachBack: (qid: string, text: string) => void;
  markQuestionConfusing: (qid: string) => void;
  bumpQuizRetryCount: (qid: string) => void;
  addFlashcardFromQuizQuestion: (q: QuizQuestion) => void;
  /** Dismiss streak milestone celebration (updates lastAcknowledgedStreakMilestone). */
  acknowledgeStreakMilestone: (m: number) => void;
  /** Session-scoped count of meaningful study actions (backup nudge, not persisted). */
  sessionProgressSignals: number;
  /**
   * Rare outside-quiz identity line — max one per browser session; 72h per-bucket cooldown.
   * Returns true if the moment was reserved (caller should show copy).
   */
  takeExtensionIdentity: (bucket: OutsideIdentityBucket) => boolean;
  /** Update global “resume” pointers (flashcards lesson filter, etc.) */
  bumpStudyResume: (patch: StudyResumePatch) => void;
  /** Video + note fusion telemetry (Progress page + resume pointers) */
  recordVideoFusionActivity: (
    lessonId: string,
    kind:
      | "note_saved"
      | "fusion_loop_complete"
      | "quick_check_pass"
      | "quick_check_wrong"
      | "flashcard_from_note",
    meta?: { notePreview?: string; qid?: string },
  ) => void;
  /** PDF guided study (per section key pdfId::lessonId) */
  touchPdfGuideSession: (pdfId: string, lessonId: string) => void;
  addPdfHighlight: (pdfId: string, lessonId: string, snippet: string) => void;
  removePdfHighlight: (pdfId: string, lessonId: string, index: number) => void;
  setPdfCheckpoint: (pdfId: string, lessonId: string, checkpointId: string, done: boolean) => void;
  markPdfInterruptSeen: (pdfId: string, lessonId: string, interruptKey: string) => void;
  completePdfGuideSection: (pdfId: string, lessonId: string) => void;
  addFlashcardFromPdfSelection: (lessonId: string, front: string, back: string) => void;
  /** Metadata only — call after `savePdfFile` from localPdfStore */
  registerLocalPdfFile: (pdfId: string, file: File) => void;
  removeLocalPdfFile: (pdfId: string) => void;
  clearAllLocalPdfMeta: () => void;
  touchPdfSetupVisit: () => void;
  markPdfSetupComplete: () => void;
};

const ProgressContext = createContext<Ctx | null>(null);

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => loadState());
  const [sessionProgressSignals, setSessionProgressSignals] = useState(0);
  const bumpSessionProgressSignals = useCallback((n = 1) => {
    setSessionProgressSignals((c) => c + n);
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const reconcilePdfMetaFromIdb = useCallback(() => {
    if (!isIndexedDbAvailable()) return;
    void listSavedPdfs().then((list) => {
      setState((s) => {
        const meta = { ...(s.pdfLibrary?.localFileMeta ?? {}) };
        const idbIds = new Set(list.map((x) => x.pdfId));
        for (const k of Object.keys(meta)) {
          if (!idbIds.has(k)) delete meta[k];
        }
        for (const row of list) {
          meta[row.pdfId] = { addedAt: row.savedAt, name: row.name, size: row.size };
        }
        return {
          ...s,
          pdfLibrary: {
            bySection: s.pdfLibrary?.bySection ?? {},
            localFileMeta: meta,
            pdfSetupLastVisitAt: s.pdfLibrary?.pdfSetupLastVisitAt,
            pdfSetupMarkedCompleteAt: s.pdfLibrary?.pdfSetupMarkedCompleteAt,
          },
        };
      });
    });
  }, []);

  useEffect(() => {
    reconcilePdfMetaFromIdb();
  }, [reconcilePdfMetaFromIdb]);

  useEffect(() => subscribePdfStorageChanged(() => reconcilePdfMetaFromIdb()), [reconcilePdfMetaFromIdb]);

  const touchStreak = useCallback(() => {
    setState((s) => {
      const t = todayStr();
      if (s.lastActiveDay === t) return s;
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const ystr = y.toISOString().slice(0, 10);
      const ok = s.lastActiveDay === ystr;
      const streak = ok ? s.streak + 1 : 1;
      const domainScoreDayBaseline =
        s.domainScoreDayBaseline?.date === t
          ? s.domainScoreDayBaseline
          : { date: t, scores: { ...s.domainScore } };
      return {
        ...s,
        streak,
        lastActiveDay: t,
        lastAcknowledgedStreakMilestone: ok ? (s.lastAcknowledgedStreakMilestone ?? 0) : 0,
        domainScoreDayBaseline,
      };
    });
  }, []);

  const acknowledgeStreakMilestone = useCallback((m: number) => {
    setState((s) => ({
      ...s,
      lastAcknowledgedStreakMilestone: Math.max(s.lastAcknowledgedStreakMilestone ?? 0, m),
    }));
  }, []);

  const recordVideoFusionActivity = useCallback(
    (
      lessonId: string,
      kind:
        | "note_saved"
        | "fusion_loop_complete"
        | "quick_check_pass"
        | "quick_check_wrong"
        | "flashcard_from_note",
      meta?: { notePreview?: string; qid?: string },
    ) => {
      const def = defaultState().videoStudyStats!;
      setState((s) => {
        const base = s.videoStudyStats ?? { ...def };
        let nextStats: VideoStudyStats = { ...base };
        switch (kind) {
          case "note_saved":
            nextStats = {
              ...nextStats,
              notesFromVideoFusion: nextStats.notesFromVideoFusion + 1,
              lastFusionLessonId: lessonId,
              lastFusionNotePreview: meta?.notePreview?.slice(0, 200),
            };
            break;
          case "fusion_loop_complete":
            nextStats = {
              ...nextStats,
              fusionSessionsCompleted: nextStats.fusionSessionsCompleted + 1,
              lastFusionLessonId: lessonId,
            };
            break;
          case "quick_check_pass":
            nextStats = {
              ...nextStats,
              videoQuickChecksPassed: nextStats.videoQuickChecksPassed + 1,
              lastFusionLessonId: lessonId,
              lastVideoQuickCheckQid: meta?.qid ?? nextStats.lastVideoQuickCheckQid,
            };
            break;
          case "quick_check_wrong":
            nextStats = {
              ...nextStats,
              videoQuickChecksWrong: nextStats.videoQuickChecksWrong + 1,
              lastFusionLessonId: lessonId,
              lastVideoQuickCheckQid: meta?.qid ?? nextStats.lastVideoQuickCheckQid,
            };
            break;
          case "flashcard_from_note":
            nextStats = {
              ...nextStats,
              flashcardsFromVideoNotes: nextStats.flashcardsFromVideoNotes + 1,
              lastFusionLessonId: lessonId,
            };
            break;
          default:
            break;
        }
        const touched = { ...s, videoStudyStats: nextStats };
        if (kind === "note_saved" || kind === "fusion_loop_complete") {
          return applyStudyResumeAndEngagement(touched, { videoNotesLessonId: lessonId });
        }
        return touched;
      });
      if (kind === "fusion_loop_complete") bumpSessionProgressSignals(1);
    },
    [bumpSessionProgressSignals],
  );

  const takeExtensionIdentity = useCallback((bucket: OutsideIdentityBucket): boolean => {
    let allowed = false;
    setState((s) => {
      if (!canOfferExtensionIdentity(s, bucket)) return s;
      allowed = true;
      return markExtensionIdentityEcho(s, bucket);
    });
    if (allowed) extensionIdentitySlotConsume();
    return allowed;
  }, []);

  const grantXp = useCallback((n: number) => {
    setState((s) => ({ ...s, xp: s.xp + n }));
  }, []);

  const completeLesson = useCallback(
    (id: string, secondsSpent: number) => {
      bumpSessionProgressSignals(1);
      const day = new Date().toISOString().slice(0, 10);
      setState((s) => {
        const newly = !s.completedLessons.includes(id);
        const done = newly ? [...s.completedLessons, id] : s.completedLessons;
        const ns: PersistedState = {
          ...s,
          completedLessons: done,
          lessonCompletedOn: newly ? { ...s.lessonCompletedOn, [id]: day } : s.lessonCompletedOn,
          xp: newly ? s.xp + 25 : s.xp,
          timeOnLesson: { ...s.timeOnLesson, [id]: (s.timeOnLesson[id] || 0) + secondsSpent },
        };
        return mergeTodayActivity(applyStudyResumeAndEngagement(ns, { lessonId: id }), day, { touchLessonId: id });
      });
    },
    [bumpSessionProgressSignals],
  );

  const recordQuiz = useCallback(
    (qid: string, lessonId: string, domain: string, correct: boolean, examKeyword = "") => {
      bumpSessionProgressSignals(1);
      const day = todayStr();
      setState((s) => {
        const base = ensureDomainDayBaseline(s, day);
        const prev = base.questionStats[qid] || { c: 0, w: 0 };
        const next = { ...prev, c: prev.c + (correct ? 1 : 0), w: prev.w + (correct ? 0 : 1) };
        let ns: PersistedState = { ...base, questionStats: { ...base.questionStats, [qid]: next } };
        ns = updateDomainScore(ns, domain, correct);
        if (!correct) {
          ns = addMiss(ns, qid, lessonId);
          const fl = ns.feedbackLoop ?? emptyFeedbackLoop();
          const ck = conceptKey(lessonId, examKeyword || "general");
          const recentSame = ns.missedJournal.slice(-5).filter((m) => m.lessonId === lessonId);
          let confusion = fl.confusionSignalByConcept;
          if (recentSame.length >= 2) {
            const cur = confusion[ck] ?? 0;
            confusion = { ...confusion, [ck]: cur + 1 };
          }
          ns = {
            ...ns,
            feedbackLoop: { ...fl, confusionSignalByConcept: confusion },
          };
          const q = allQuestions().find((x) => x.id === qid);
          if (q) {
            const cid = `u-mis-${qid}`;
            if (!ns.userFlashcards.some((c) => c.id === cid)) {
              ns = {
                ...ns,
                userFlashcards: [
                  ...ns.userFlashcards,
                  {
                    id: cid,
                    lessonId: q.lessonId,
                    front: q.text,
                    back: `Correct: **${correctAnswerLabel(q)}**\n\n${q.explanation}\n\nKeywords: ${q.examKeyword}`,
                    cardType: "trap",
                    trap: q.examKeyword,
                  },
                ],
              };
            }
          }
        }
        const repeatCorrect = correct && next.c >= 2;
        const understandingXp = repeatCorrect ? 3 : correct && next.c >= 1 ? 1 : 0;
        const withXp = applyStudyResumeAndEngagement(
          { ...ns, xp: base.xp + (correct ? 8 : 2) + understandingXp },
          { quizLessonId: lessonId },
        );
        return mergeTodayActivity(withXp, day, { touchLessonId: lessonId, quizAnswered: 1 });
      });
    },
    [bumpSessionProgressSignals],
  );

  const seedHighlightMemory = useCallback((lessonId: string) => {
    setState((s) => {
      const L = lessons[lessonId];
      if (!L) return s;
      const h = L.highlightRules.find((x) => x.importance === "must") ?? L.highlightRules[0];
      if (!h) return s;
      const id = `u-hl-${lessonId}`;
      if (s.userFlashcards.some((c) => c.id === id)) return s;
      const card: Flashcard = {
        id,
        lessonId,
        front: h.term,
        back: `**Exam keyword / meaning:**\n\n${h.meaning}`,
        cardType: "def",
      };
      return { ...s, userFlashcards: [...s.userFlashcards, card] };
    });
  }, []);

  const saveTeachBack = useCallback((lessonId: string, text: string) => {
    setState((s) => {
      const t = text.trim();
      const qv = Math.min(5, Math.max(1, 1 + Math.floor(t.length / 45)));
      return { ...s, teachBack: { ...s.teachBack, [lessonId]: text }, teachQuality: { ...s.teachQuality, [lessonId]: qv } };
    });
  }, []);

  const addNote = useCallback(
    (note: BrainNote) => {
      const day = todayStr();
      let added = false;
      setState((s) => {
        const dayNotes = s.notes.filter((n) => {
          const d = new Date(n.created).toDateString();
          return d === new Date().toDateString();
        });
        if (dayNotes.length >= 10) return s;
        const lessonN = s.notes.filter((n) => n.lessonId === note.lessonId).length;
        if (lessonN >= 5) return s;
        added = true;
        const notes = [...s.notes, note];
        const lp0 = s.lessonProgress[note.lessonId] ?? {};
        const merged = mergeTodayActivity(
          {
            ...s,
            notes,
            lessonProgress: {
              ...s.lessonProgress,
              [note.lessonId]: { ...lp0, notesSaved: true },
            },
          },
          day,
          { touchLessonId: note.lessonId },
        );
        return applyStudyResumeAndEngagement(merged, { lessonId: note.lessonId });
      });
      if (added) bumpSessionProgressSignals(1);
    },
    [bumpSessionProgressSignals],
  );

  const setBeginnerMode = useCallback((v: boolean) => {
    setState((s) => ({ ...s, beginnerMode: v }));
  }, []);

  const setSimpleLessonMode = useCallback((v: boolean) => {
    setState((s) => ({ ...s, simpleLessonMode: v }));
  }, []);

  const markStartHereSeen = useCallback(() => {
    setState((s) => ({ ...s, onboarding: { ...s.onboarding, hasSeenStartHere: true } }));
  }, []);

  const patchLessonProgress = useCallback(
    (lessonId: string, p: Partial<LessonProgress>) => {
      const meaningfulKeys: (keyof LessonProgress)[] = [
        "videoWatched",
        "highlightsDone",
        "notesSaved",
        "quickActionDone",
        "quizCompleted",
        "flashcardsReviewed",
        "labDone",
        "teachBackDone",
      ];
      const meaningful = meaningfulKeys.some((k) => p[k] !== undefined && p[k] !== false);
      const day = todayStr();
      setState((s) => {
        const cur = s.lessonProgress[lessonId] ?? {};
        const ns: PersistedState = {
          ...s,
          lessonProgress: { ...s.lessonProgress, [lessonId]: { ...cur, ...p } },
        };
        if (!meaningful) return ns;
        return applyStudyResumeAndEngagement(mergeTodayActivity(ns, day, { touchLessonId: lessonId }), {
          lessonId,
        });
      });
      if (meaningful) bumpSessionProgressSignals(1);
    },
    [bumpSessionProgressSignals],
  );

  const deleteNote = useCallback((id: string) => {
    setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
  }, []);

  const pushSpaced = useCallback(
    (cardId: string, gotRight: boolean) => {
      bumpSessionProgressSignals(1);
      const day = todayStr();
      setState((s) => {
        const now = Date.now();
        const other = s.spaced.filter((x) => x.cardId !== cardId);
        const prev = s.spaced.find((x) => x.cardId === cardId);
        const step = (prev?.ease ?? 0) + (gotRight ? 1 : 0);
        const dayMap = [1, 1, 3, 7, 14, 30];
        const d = dayMap[Math.min(step, dayMap.length - 1)] ?? 7;
        const nextStreak = { ...s.cardWrongStreak };
        if (gotRight) nextStreak[cardId] = 0;
        else nextStreak[cardId] = (nextStreak[cardId] || 0) + 1;
        return mergeTodayActivity(
          applyStudyResumeAndEngagement(
            {
              ...s,
              cardWrongStreak: nextStreak,
              spaced: [...other, { cardId, nextReview: now + d * 86400000, ease: step, interval: d * 86400000 }],
              xp: s.xp + (gotRight ? 5 : 1),
            },
            {},
          ),
          day,
          { flashcardReviewed: 1 },
        );
      });
    },
    [bumpSessionProgressSignals],
  );

  const addMistakeFlashcards = useCallback(() => {
    setState((s) => {
      const got = new Set(s.userFlashcards.map((c) => c.id));
      const out: Flashcard[] = [];
      for (const m of s.missedJournal.slice(-24)) {
        const q = allQuestions().find((x) => x.id === m.qid);
        if (!q) continue;
        const id = `u-mis-${m.qid}`;
        if (got.has(id)) continue;
        got.add(id);
        out.push({
          id,
          lessonId: m.lessonId,
          front: q.text,
          back: `Correct: **${correctAnswerLabel(q)}**\n\n${q.explanation}\n\nKeywords: ${q.examKeyword}`,
          cardType: "trap",
          trap: q.examKeyword,
        });
      }
      if (out.length === 0) return s;
      return applyStudyResumeAndEngagement({ ...s, userFlashcards: [...s.userFlashcards, ...out] }, {});
    });
  }, []);

  const bumpStudyResume = useCallback((patch: StudyResumePatch) => {
    setState((s) => applyStudyResumeAndEngagement(s, patch));
  }, []);

  const skipLab = useCallback((labId: string) => {
    setState((s) => ({ ...s, skippedLabIds: s.skippedLabIds.includes(labId) ? s.skippedLabIds : [...s.skippedLabIds, labId] }));
  }, []);

  const importProgress = useCallback((json: string) => {
    const r = importStateFromJson(json);
    if (!r.ok) return { ok: false as const, error: r.error };
    setState(r.state);
    return { ok: true as const };
  }, []);

  const exportProgress = useCallback(() => exportStateJson(state), [state]);

  const resetAllProgress = useCallback(() => {
    if (!window.confirm("Reset ALL progress, XP, notes, cards, and journals on this device? This cannot be undone.")) return;
    setState(defaultState());
  }, []);

  const markDailyTrainingDone = useCallback(() => {
    const t = todayStr();
    setState((s) => ({ ...s, dailyMissionDate: t, dailyMissionDone: true }));
  }, []);

  const appendPracticeExamAttempt = useCallback((a: PracticeExamAttempt) => {
    setState((s) =>
      applyStudyResumeAndEngagement(
        { ...s, practiceExamAttempts: [...(s.practiceExamAttempts ?? []), a].slice(-80) },
        { practiceExamId: a.examId },
      ),
    );
  }, []);

  const recordPbqMiss = useCallback(
    (domain: DomainId, pbqId: string) => {
      bumpSessionProgressSignals(1);
      const day = todayStr();
      setState((s) => {
        const lessonId = SECTION_ORDER.find((x) => x.domain === domain)?.id ?? "1-1";
        let ns = updateDomainScore(s, domain, false);
        ns = addMiss(ns, `pbq-${pbqId}`, lessonId);
        return applyStudyResumeAndEngagement(mergeTodayActivity(ns, day, { pbqAttempt: 1 }), { pbqId });
      });
    },
    [bumpSessionProgressSignals],
  );

  const recordPbqPass = useCallback(
    (domain: DomainId, pbqId: string) => {
      const journalQid = `pbq-${pbqId}`;
      const day = todayStr();
      let progressed = false;
      setState((s) => {
        const prev = s.pbqPassedIds ?? [];
        if (prev.includes(pbqId)) return s;
        progressed = true;
        let ns: PersistedState = {
          ...s,
          pbqPassedIds: [...prev, pbqId],
          missedJournal: s.missedJournal.filter((m) => m.qid !== journalQid),
        };
        ns = updateDomainScore(ns, domain, true);
        return applyStudyResumeAndEngagement(mergeTodayActivity(ns, day, { pbqAttempt: 1 }), { pbqId });
      });
      if (progressed) bumpSessionProgressSignals(1);
    },
    [bumpSessionProgressSignals],
  );

  const recordTrainingLab = useCallback((lessonId: string, labId: string, pass: boolean) => {
    setState((s) => {
      const tr: TrainingRunsState = s.trainingRuns ?? { labs: {}, sims: {}, decisions: {} };
      const key = trainingLabRunKey(lessonId, labId);
      const prev = tr.labs[key];
      const nextPass = !!(prev?.pass || pass);
      const nextRetries = pass ? (prev?.retries ?? 0) : (prev?.retries ?? 0) + 1;
      const nextRuns: TrainingRunsState = {
        ...tr,
        labs: { ...tr.labs, [key]: { at: Date.now(), pass: nextPass, retries: nextRetries } },
      };
      let ns = nextStateAfterTrainingRuns(s, nextRuns, lessonId);
      if (pass && !prev?.pass) ns = { ...ns, xp: ns.xp + 8 };
      return ns;
    });
  }, []);

  const recordEliteLabPortfolio = useCallback((lessonId: string, entry: EliteLabPortfolioEntry) => {
    const at = entry.at || Date.now();
    setState((s) => {
      const key = trainingLabRunKey(lessonId, entry.labId);
      const prev = s.eliteLabPortfolio?.[key];
      const attempts = (prev?.attempts ?? 0) + 1;
      const prevBest = prev?.bestScore;
      const bestScore =
        prevBest !== undefined ? Math.max(prevBest, entry.score) : entry.score;

      const nextRow: EliteLabPortfolioEntry = {
        ...entry,
        lessonId,
        at,
        attempts,
        bestScore,
      };

      return {
        ...s,
        eliteLabPortfolio: {
          ...(s.eliteLabPortfolio ?? {}),
          [key]: nextRow,
        },
      };
    });
  }, []);

  const recordTrainingSim = useCallback((lessonId: string, simId: string, score: number, pass: boolean) => {
    setState((s) => {
      const tr: TrainingRunsState = s.trainingRuns ?? { labs: {}, sims: {}, decisions: {} };
      const key = trainingSimRunKey(lessonId, simId);
      const prev = tr.sims[key];
      const nextPass = !!(prev?.pass || pass);
      const nextRetries = pass ? (prev?.retries ?? 0) : (prev?.retries ?? 0) + 1;
      const nextRuns: TrainingRunsState = {
        ...tr,
        sims: { ...tr.sims, [key]: { at: Date.now(), score, pass: nextPass, retries: nextRetries } },
      };
      let ns = nextStateAfterTrainingRuns(s, nextRuns, lessonId);
      if (pass && !prev?.pass) ns = { ...ns, xp: ns.xp + 12 };
      return ns;
    });
  }, []);

  const recordQuizConfidence = useCallback((qid: string, level: UserConfidenceLevel, wasCorrect: boolean) => {
    setState((s) => {
      const fl = s.feedbackLoop ?? emptyFeedbackLoop();
      const fc = { ...fl.falseConfidenceHitsByQuestionId };
      if (level === "very_sure" && !wasCorrect) {
        fc[qid] = (fc[qid] ?? 0) + 1;
      }
      return {
        ...s,
        feedbackLoop: {
          ...fl,
          falseConfidenceHitsByQuestionId: fc,
          confidenceByQuestionId: { ...fl.confidenceByQuestionId, [qid]: { level, at: Date.now() } },
        },
      };
    });
  }, []);

  const saveMicroTeachBack = useCallback((qid: string, text: string) => {
    const t = text.trim();
    if (!t) return;
    setState((s) => {
      const fl = s.feedbackLoop ?? emptyFeedbackLoop();
      return {
        ...s,
        feedbackLoop: {
          ...fl,
          teachBackMicroByQuestionId: { ...fl.teachBackMicroByQuestionId, [qid]: { text: t, at: Date.now() } },
        },
      };
    });
  }, []);

  const markQuestionConfusing = useCallback((qid: string) => {
    setState((s) => {
      const fl = s.feedbackLoop ?? emptyFeedbackLoop();
      if (fl.confusingQuestionIds.includes(qid)) return s;
      return {
        ...s,
        feedbackLoop: {
          ...fl,
          confusingQuestionIds: [...fl.confusingQuestionIds, qid].slice(-80),
        },
      };
    });
  }, []);

  const bumpQuizRetryCount = useCallback((qid: string) => {
    setState((s) => {
      const fl = s.feedbackLoop ?? emptyFeedbackLoop();
      const n = (fl.quizRetryCountByQuestionId[qid] ?? 0) + 1;
      return {
        ...s,
        feedbackLoop: {
          ...fl,
          quizRetryCountByQuestionId: { ...fl.quizRetryCountByQuestionId, [qid]: n },
        },
      };
    });
  }, []);

  const patchPdfSection = useCallback((pdfId: string, lessonId: string, fn: (prev: PdfSectionProgress) => PdfSectionProgress) => {
    const key = pdfGuideSectionKey(pdfId, lessonId);
    setState((s) => {
      const lib = s.pdfLibrary ?? { bySection: {}, localFileMeta: {} };
      const prev = lib.bySection[key] ?? {
        lastOpenedAt: 0,
        highlights: [],
        checkpointsDone: {},
        interruptSeen: {},
      };
      return {
        ...s,
        pdfLibrary: {
          bySection: { ...lib.bySection, [key]: fn(prev) },
          localFileMeta: lib.localFileMeta ?? {},
          pdfSetupLastVisitAt: lib.pdfSetupLastVisitAt,
          pdfSetupMarkedCompleteAt: lib.pdfSetupMarkedCompleteAt,
        },
      };
    });
  }, []);

  const registerLocalPdfFile = useCallback((pdfId: string, file: File) => {
    setState((s) => {
      const lib = s.pdfLibrary ?? { bySection: {}, localFileMeta: {} };
      return {
        ...s,
        pdfLibrary: {
          ...lib,
          localFileMeta: {
            ...(lib.localFileMeta ?? {}),
            [pdfId]: { addedAt: Date.now(), name: file.name, size: file.size },
          },
        },
      };
    });
  }, []);

  const removeLocalPdfFile = useCallback((pdfId: string) => {
    setState((s) => {
      const lib = s.pdfLibrary ?? { bySection: {}, localFileMeta: {} };
      const lm = { ...(lib.localFileMeta ?? {}) };
      delete lm[pdfId];
      return { ...s, pdfLibrary: { ...lib, localFileMeta: lm } };
    });
  }, []);

  const clearAllLocalPdfMeta = useCallback(() => {
    setState((s) => {
      const lib = s.pdfLibrary ?? { bySection: {}, localFileMeta: {} };
      return { ...s, pdfLibrary: { ...lib, localFileMeta: {} } };
    });
  }, []);

  const touchPdfSetupVisit = useCallback(() => {
    setState((s) => {
      const lib = s.pdfLibrary ?? { bySection: {}, localFileMeta: {} };
      return { ...s, pdfLibrary: { ...lib, pdfSetupLastVisitAt: Date.now() } };
    });
  }, []);

  const markPdfSetupComplete = useCallback(() => {
    setState((s) => {
      const lib = s.pdfLibrary ?? { bySection: {}, localFileMeta: {} };
      return { ...s, pdfLibrary: { ...lib, pdfSetupMarkedCompleteAt: Date.now() } };
    });
  }, []);

  const touchPdfGuideSession = useCallback(
    (pdfId: string, lessonId: string) => {
      patchPdfSection(pdfId, lessonId, (p) => ({ ...p, lastOpenedAt: Date.now() }));
    },
    [patchPdfSection],
  );

  const addPdfHighlight = useCallback(
    (pdfId: string, lessonId: string, snippet: string) => {
      const t = snippet.trim().slice(0, 280);
      if (t.length < 3) return;
      patchPdfSection(pdfId, lessonId, (p) => {
        if (p.highlights.includes(t)) return { ...p, lastOpenedAt: Date.now() };
        const highlights = [...p.highlights, t].slice(-12);
        return { ...p, highlights, lastOpenedAt: Date.now() };
      });
      bumpSessionProgressSignals(1);
    },
    [patchPdfSection, bumpSessionProgressSignals],
  );

  const removePdfHighlight = useCallback(
    (pdfId: string, lessonId: string, index: number) => {
      patchPdfSection(pdfId, lessonId, (p) => ({
        ...p,
        highlights: p.highlights.filter((_, i) => i !== index),
        lastOpenedAt: Date.now(),
      }));
    },
    [patchPdfSection],
  );

  const setPdfCheckpoint = useCallback(
    (pdfId: string, lessonId: string, checkpointId: string, done: boolean) => {
      patchPdfSection(pdfId, lessonId, (p) => ({
        ...p,
        checkpointsDone: { ...p.checkpointsDone, [checkpointId]: done },
        lastOpenedAt: Date.now(),
      }));
      if (done) bumpSessionProgressSignals(1);
    },
    [patchPdfSection, bumpSessionProgressSignals],
  );

  const markPdfInterruptSeen = useCallback(
    (pdfId: string, lessonId: string, interruptKey: string) => {
      patchPdfSection(pdfId, lessonId, (p) => ({
        ...p,
        interruptSeen: { ...p.interruptSeen, [interruptKey]: true },
        lastOpenedAt: Date.now(),
      }));
    },
    [patchPdfSection],
  );

  const completePdfGuideSection = useCallback(
    (pdfId: string, lessonId: string) => {
      patchPdfSection(pdfId, lessonId, (p) => ({ ...p, completedAt: Date.now(), lastOpenedAt: Date.now() }));
      bumpSessionProgressSignals(1);
    },
    [patchPdfSection, bumpSessionProgressSignals],
  );

  const addFlashcardFromPdfSelection = useCallback((lessonId: string, front: string, back: string) => {
    const f = front.trim();
    const b = back.trim();
    if (f.length < 2 || b.length < 2) return;
    const id = `u-pdf-${lessonId}-${Date.now().toString(36)}`;
    setState((s) => {
      if (s.userFlashcards.some((c) => c.front === f && c.back === b)) return { ...s, xp: s.xp + 1 };
      const card: Flashcard = { id, lessonId, front: f, back: b, cardType: "def" };
      return { ...s, userFlashcards: [...s.userFlashcards, card], xp: s.xp + 2 };
    });
    bumpSessionProgressSignals(1);
  }, [bumpSessionProgressSignals]);

  const addFlashcardFromQuizQuestion = useCallback((q: QuizQuestion) => {
    setState((s) => {
      const id = `u-tutor-${q.id}`;
      if (s.userFlashcards.some((c) => c.id === id)) return { ...s, xp: s.xp + 1 };
      const card: Flashcard = {
        id,
        lessonId: q.lessonId,
        front: q.text,
        back: `Correct: **${correctAnswerLabel(q)}**\n\n${q.explanation}\n\nKeywords: ${q.examKeyword}`,
        cardType: "trap",
        trap: q.examKeyword,
      };
      return { ...s, userFlashcards: [...s.userFlashcards, card], xp: s.xp + 3 };
    });
  }, []);

  const recordTrainingDecision = useCallback((lessonId: string, scenarioId: string, correct: boolean) => {
    setState((s) => {
      const tr: TrainingRunsState = s.trainingRuns ?? { labs: {}, sims: {}, decisions: {} };
      const key = trainingDecisionKey(lessonId, scenarioId);
      const prev = tr.decisions[key];
      if (correct && prev?.correct) return s;
      const attempts = (prev?.attempts ?? 0) + 1;
      const nextCorrect = !!(prev?.correct || correct);
      const nextRuns: TrainingRunsState = {
        ...tr,
        decisions: { ...tr.decisions, [key]: { at: Date.now(), correct: nextCorrect, attempts } },
      };
      let ns = nextStateAfterTrainingRuns(s, nextRuns, lessonId);
      if (correct && !prev?.correct) ns = { ...ns, xp: ns.xp + 6 };
      return ns;
    });
  }, []);

  const completeBoss = useCallback((bossId: string, pass: boolean, xpReward: number, relatedLesson: string, domain: DomainId) => {
    setState((s) => {
      if (pass) {
        if (s.bossWins[bossId]) return s;
        return { ...s, bossWins: { ...s.bossWins, [bossId]: true }, xp: s.xp + xpReward };
      }
      return applyBossFailure(s, relatedLesson, domain);
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      xp: state.xp,
      streak: state.streak,
      completeLesson,
      recordQuiz,
      saveTeachBack,
      addNote,
      deleteNote,
      touchStreak,
      pushSpaced,
      addMistakeFlashcards,
      seedHighlightMemory,
      skipLab,
      readiness: examReadiness(state),
      coach: smartCoach(state),
      coachV2: getSmartCoachOutput(state),
      nextStep: getNextStep(state),
      nextLesson: nextLessonId(state),
      levelInfo: getLevelName(state.xp),
      grantXp,
      completeBoss,
      setBeginnerMode,
      setSimpleLessonMode,
      markStartHereSeen,
      patchLessonProgress,
      importProgress,
      exportProgress,
      resetAllProgress,
      markDailyTrainingDone,
      appendPracticeExamAttempt,
      recordPbqMiss,
      recordPbqPass,
      recordTrainingLab,
      recordEliteLabPortfolio,
      recordTrainingSim,
      recordTrainingDecision,
      recordQuizConfidence,
      saveMicroTeachBack,
      markQuestionConfusing,
      bumpQuizRetryCount,
      addFlashcardFromQuizQuestion,
      acknowledgeStreakMilestone,
      sessionProgressSignals,
      takeExtensionIdentity,
      bumpStudyResume,
      recordVideoFusionActivity,
      touchPdfGuideSession,
      addPdfHighlight,
      removePdfHighlight,
      setPdfCheckpoint,
      markPdfInterruptSeen,
      completePdfGuideSection,
      addFlashcardFromPdfSelection,
      registerLocalPdfFile,
      removeLocalPdfFile,
      clearAllLocalPdfMeta,
      touchPdfSetupVisit,
      markPdfSetupComplete,
    }),
    [
      state,
      sessionProgressSignals,
      completeLesson,
      recordQuiz,
      saveTeachBack,
      addNote,
      deleteNote,
      touchStreak,
      pushSpaced,
      addMistakeFlashcards,
      seedHighlightMemory,
      skipLab,
      grantXp,
      completeBoss,
      setBeginnerMode,
      setSimpleLessonMode,
      markStartHereSeen,
      patchLessonProgress,
      importProgress,
      exportProgress,
      resetAllProgress,
      markDailyTrainingDone,
      appendPracticeExamAttempt,
      recordPbqMiss,
      recordPbqPass,
      recordTrainingLab,
      recordEliteLabPortfolio,
      recordTrainingSim,
      recordTrainingDecision,
      recordQuizConfidence,
      saveMicroTeachBack,
      markQuestionConfusing,
      bumpQuizRetryCount,
      addFlashcardFromQuizQuestion,
      acknowledgeStreakMilestone,
      sessionProgressSignals,
      takeExtensionIdentity,
      bumpStudyResume,
      recordVideoFusionActivity,
      touchPdfGuideSession,
      addPdfHighlight,
      removePdfHighlight,
      setPdfCheckpoint,
      markPdfInterruptSeen,
      completePdfGuideSection,
      addFlashcardFromPdfSelection,
      registerLocalPdfFile,
      removeLocalPdfFile,
      clearAllLocalPdfMeta,
      touchPdfSetupVisit,
      markPdfSetupComplete,
    ]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const c = useContext(ProgressContext);
  if (!c) throw new Error("useProgress outside provider");
  return c;
}

export function getNotesTodayCount(notes: BrainNote[]) {
  const d = new Date().toDateString();
  return notes.filter((n) => new Date(n.created).toDateString() === d).length;
}
