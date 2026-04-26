import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { BrainNote } from "../types";
import {
  loadState,
  saveState,
  exportStateJson,
  importStateFromJson,
  defaultState,
  type PersistedState,
  type PracticeExamAttempt,
} from "../utils/storage";
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
import { getNextStep } from "../core/nextStepEngine";
import { lessons } from "../data/lessons";
import { SECTION_ORDER } from "../data/sectionOrder";
import type { DomainId, Flashcard } from "../types";
import type { LessonProgress } from "../types/beginner";
type Ctx = {
  state: PersistedState;
  xp: number;
  streak: number;
  completeLesson: (id: string, secondsSpent: number) => void;
  recordQuiz: (qid: string, lessonId: string, domain: string, correct: boolean) => void;
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
};

const ProgressContext = createContext<Ctx | null>(null);

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const touchStreak = useCallback(() => {
    setState((s) => {
      const t = todayStr();
      if (s.lastActiveDay === t) return s;
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const ystr = y.toISOString().slice(0, 10);
      const ok = s.lastActiveDay === ystr;
      return { ...s, streak: ok ? s.streak + 1 : 1, lastActiveDay: t };
    });
  }, []);

  const grantXp = useCallback((n: number) => {
    setState((s) => ({ ...s, xp: s.xp + n }));
  }, []);

  const completeLesson = useCallback((id: string, secondsSpent: number) => {
    const day = new Date().toISOString().slice(0, 10);
    setState((s) => {
      const newly = !s.completedLessons.includes(id);
      const done = newly ? [...s.completedLessons, id] : s.completedLessons;
      return {
        ...s,
        completedLessons: done,
        lessonCompletedOn: newly ? { ...s.lessonCompletedOn, [id]: day } : s.lessonCompletedOn,
        xp: newly ? s.xp + 25 : s.xp,
        timeOnLesson: { ...s.timeOnLesson, [id]: (s.timeOnLesson[id] || 0) + secondsSpent },
      };
    });
  }, []);

  const recordQuiz = useCallback((qid: string, lessonId: string, domain: string, correct: boolean) => {
    setState((s) => {
      const prev = s.questionStats[qid] || { c: 0, w: 0 };
      const next = { ...prev, c: prev.c + (correct ? 1 : 0), w: prev.w + (correct ? 0 : 1) };
      let ns: PersistedState = { ...s, questionStats: { ...s.questionStats, [qid]: next } };
      ns = updateDomainScore(ns, domain, correct);
      if (!correct) {
        ns = addMiss(ns, qid, lessonId);
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
      return { ...ns, xp: s.xp + (correct ? 8 : 2) };
    });
  }, []);

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

  const addNote = useCallback((note: BrainNote) => {
    setState((s) => {
      const dayNotes = s.notes.filter((n) => {
        const d = new Date(n.created).toDateString();
        return d === new Date().toDateString();
      });
      if (dayNotes.length >= 10) return s;
      const lessonN = s.notes.filter((n) => n.lessonId === note.lessonId).length;
      if (lessonN >= 5) return s;
      const notes = [...s.notes, note];
      const lp0 = s.lessonProgress[note.lessonId] ?? {};
      return {
        ...s,
        notes,
        lessonProgress: {
          ...s.lessonProgress,
          [note.lessonId]: { ...lp0, notesSaved: true },
        },
      };
    });
  }, []);

  const setBeginnerMode = useCallback((v: boolean) => {
    setState((s) => ({ ...s, beginnerMode: v }));
  }, []);

  const markStartHereSeen = useCallback(() => {
    setState((s) => ({ ...s, onboarding: { ...s.onboarding, hasSeenStartHere: true } }));
  }, []);

  const patchLessonProgress = useCallback((lessonId: string, p: Partial<LessonProgress>) => {
    setState((s) => {
      const cur = s.lessonProgress[lessonId] ?? {};
      return {
        ...s,
        lessonProgress: { ...s.lessonProgress, [lessonId]: { ...cur, ...p } },
      };
    });
  }, []);

  const deleteNote = useCallback((id: string) => {
    setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
  }, []);

  const pushSpaced = useCallback((cardId: string, gotRight: boolean) => {
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
      return {
        ...s,
        cardWrongStreak: nextStreak,
        spaced: [
          ...other,
          { cardId, nextReview: now + d * 86400000, ease: step, interval: d * 86400000 },
        ],
        xp: s.xp + (gotRight ? 5 : 1),
      };
    });
  }, []);

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
      return { ...s, userFlashcards: [...s.userFlashcards, ...out] };
    });
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
    setState((s) => ({
      ...s,
      practiceExamAttempts: [...(s.practiceExamAttempts ?? []), a].slice(-80),
    }));
  }, []);

  const recordPbqMiss = useCallback((domain: DomainId, pbqId: string) => {
    setState((s) => {
      const lessonId = SECTION_ORDER.find((x) => x.domain === domain)?.id ?? "1-1";
      let ns = updateDomainScore(s, domain, false);
      ns = addMiss(ns, `pbq-${pbqId}`, lessonId);
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
      markStartHereSeen,
      patchLessonProgress,
      importProgress,
      exportProgress,
      resetAllProgress,
      markDailyTrainingDone,
      appendPracticeExamAttempt,
      recordPbqMiss,
    }),
    [
      state,
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
      markStartHereSeen,
      patchLessonProgress,
      importProgress,
      exportProgress,
      resetAllProgress,
      markDailyTrainingDone,
      appendPracticeExamAttempt,
      recordPbqMiss,
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
