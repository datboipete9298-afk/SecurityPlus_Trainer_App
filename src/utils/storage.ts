import type { DomainId } from "../types";

const KEY = "spt_v1_state";
const SCHEMA_VERSION = 11 as const;

export type UserConfidenceLevel = "not_sure" | "somewhat_sure" | "very_sure" | "skipped";

/** Tutor feedback loop: confidence, confusion flags, retries (analytics for coach). */
export type FeedbackLoopState = {
  confidenceByQuestionId: Record<string, { level: UserConfidenceLevel; at: number }>;
  confusingQuestionIds: string[];
  quizRetryCountByQuestionId: Record<string, number>;
  /** Short “explain in your own words” per question id */
  teachBackMicroByQuestionId: Record<string, { text: string; at: number }>;
  /** Count of “very sure” + wrong for adaptive tutoring */
  falseConfidenceHitsByQuestionId: Record<string, number>;
  /** Same-lesson miss streak signal for concept confusion (adaptive addendum). */
  confusionSignalByConcept: Record<string, number>;
};

export function emptyFeedbackLoop(): FeedbackLoopState {
  return {
    confidenceByQuestionId: {},
    confusingQuestionIds: [],
    quizRetryCountByQuestionId: {},
    teachBackMicroByQuestionId: {},
    falseConfidenceHitsByQuestionId: {},
    confusionSignalByConcept: {},
  };
}

export type TrainingRunsState = {
  labs: Record<string, { at: number; pass: boolean; retries: number }>;
  sims: Record<string, { at: number; score: number; pass: boolean; retries: number }>;
  decisions: Record<string, { at: number; correct: boolean; attempts: number }>;
};

export type PracticeExamAttempt = {
  at: number;
  examId: string;
  mode: "exam" | "study";
  correct: number;
  total: number;
  wrongIds: string[];
  domainHits: Partial<Record<DomainId, { c: number; w: number }>>;
};

export interface PersistedState {
  /** Bumped when defaults or shape change — see `loadState` migration */
  schemaVersion?: number;
  xp: number;
  streak: number;
  lastActiveDay: string;
  completedLessons: string[];
  /** ISO day string when a lesson was marked complete (for “today” views) */
  lessonCompletedOn?: Record<string, string>;
  questionStats: Record<string, { c: number; w: number }>;
  timeOnLesson: Record<string, number>;
  teachBack: Record<string, string>;
  notes: import("../types").BrainNote[];
  spaced: import("../types").SpacedItem[];
  teachQuality: Record<string, number>;
  missedJournal: { qid: string; at: number; lessonId: string }[];
  domainScore: Record<string, number>;
  dailyMissionDate?: string;
  dailyMissionDone?: boolean;
  bossWins: Record<string, boolean>;
  level: number;
  /** User-generated (e.g. from missed quiz) — merged in flashcard UI */
  userFlashcards: import("../types").Flashcard[];
  /** Lab ids the user marked skipped (Smart Coach) */
  skippedLabIds: string[];
  /** Count of "Again" on a built-in card id (weak signal) */
  cardWrongStreak: Record<string, number>;
  /** Beginner Mode: extra plain-English layers + stepper copy */
  beginnerMode: boolean;
  /** First-run: /start-here before dashboard */
  onboarding: { hasSeenStartHere: boolean };
  /** Per-lesson checklist (watch → recall) */
  lessonProgress: Record<string, import("../types/beginner").LessonProgress>;
  /** Practice exam (A/B/C) attempts — readiness and hub history */
  practiceExamAttempts?: PracticeExamAttempt[];
  /** Hands-on training platform — labs, simulations, decisions */
  trainingRuns?: TrainingRunsState;
  /** Lessons where all hands-on blocks passed at least once */
  trainingMasteryLessonIds?: string[];
  /** Confidence + confusion tracking for tutor-style feedback */
  feedbackLoop?: FeedbackLoopState;
  /** PBQ ordering labs passed at least once (id from `pbqCatalog`) */
  pbqPassedIds?: string[];
  /** Simple lesson view: video, hooks, one note, action, quiz only — full power via “Show full lesson” */
  simpleLessonMode?: boolean;
  /** Highest streak milestone the user dismissed “Nice — keep going” for — resets when streak breaks */
  lastAcknowledgedStreakMilestone?: number;
  /** Per-day study signals for “today” dashboard (resets when `date` ≠ today on next bump) */
  todayActivity?: TodayActivity;
  /** Domain scores at first activity of `date` — for same-day mastery / regression copy */
  domainScoreDayBaseline?: { date: string; scores: Record<string, number> };
  /** Last outside-quiz extension identity moment (per-bucket cooldown) */
  outsideQuizIdentityEcho?: { bucket: string; at: number };
  /** Last touched lesson / quiz / flashcards / PBQ for global resume */
  studyResume?: import("./studyResume").StudyResumeState;
  /** PDF guided study — highlights, checkpoints, interrupts (per pdfId::lessonId) */
  pdfLibrary?: import("../types/pdfLibrary").PdfLibraryProgress;
}

export type TodayActivity = {
  date: string;
  /** Distinct lessons touched (progress / notes / quiz / complete) */
  lessonIds: string[];
  quizQuestionsAnswered: number;
  flashcardsReviewed: number;
  pbqAttempts: number;
};

export function mergeTodayActivity(
  s: PersistedState,
  today: string,
  delta: {
    touchLessonId?: string;
    quizAnswered?: number;
    flashcardReviewed?: number;
    pbqAttempt?: number;
  },
): PersistedState {
  let ta = s.todayActivity;
  if (!ta || ta.date !== today) {
    ta = { date: today, lessonIds: [], quizQuestionsAnswered: 0, flashcardsReviewed: 0, pbqAttempts: 0 };
  } else {
    ta = {
      date: ta.date,
      lessonIds: [...ta.lessonIds],
      quizQuestionsAnswered: ta.quizQuestionsAnswered,
      flashcardsReviewed: ta.flashcardsReviewed,
      pbqAttempts: ta.pbqAttempts,
    };
  }
  if (delta.touchLessonId && !ta.lessonIds.includes(delta.touchLessonId)) {
    ta.lessonIds.push(delta.touchLessonId);
  }
  if (delta.quizAnswered) ta.quizQuestionsAnswered += delta.quizAnswered;
  if (delta.flashcardReviewed) ta.flashcardsReviewed += delta.flashcardReviewed;
  if (delta.pbqAttempt) ta.pbqAttempts += delta.pbqAttempt;
  return { ...s, todayActivity: ta };
}

const defaultState = (): PersistedState => ({
  schemaVersion: SCHEMA_VERSION,
  xp: 0,
  streak: 0,
  lastActiveDay: "",
  completedLessons: [],
  lessonCompletedOn: {},
  questionStats: {},
  timeOnLesson: {},
  teachBack: {},
  notes: [],
  spaced: [],
  teachQuality: {},
  missedJournal: [],
  domainScore: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  dailyMissionDate: undefined,
  dailyMissionDone: false,
  bossWins: {},
  level: 1,
  userFlashcards: [],
  skippedLabIds: [],
  cardWrongStreak: {},
  beginnerMode: true,
  simpleLessonMode: true,
  onboarding: { hasSeenStartHere: false },
  lessonProgress: {},
  practiceExamAttempts: [],
  trainingRuns: { labs: {}, sims: {}, decisions: {} },
  trainingMasteryLessonIds: [],
  feedbackLoop: emptyFeedbackLoop(),
  pbqPassedIds: [],
  lastAcknowledgedStreakMilestone: 0,
  pdfLibrary: { bySection: {}, localFileMeta: {} },
});

function migrateAndNormalize(base: PersistedState, raw: unknown): PersistedState {
  let o: PersistedState = { ...base };
  if (raw && typeof raw === "object") {
    o = { ...o, ...raw } as PersistedState;
  }
  o.domainScore = { ...base.domainScore, ...o.domainScore };
  if (o.onboarding === undefined && (o.completedLessons?.length ?? 0) > 0) {
    o.onboarding = { hasSeenStartHere: true };
  }
  if (!o.onboarding) o.onboarding = { hasSeenStartHere: false };
  if (o.simpleLessonMode === undefined) o.simpleLessonMode = o.beginnerMode !== false;
  if (!o.lessonProgress) o.lessonProgress = {};
  if (o.beginnerMode === undefined) o.beginnerMode = true;
  if (!o.lessonCompletedOn) o.lessonCompletedOn = {};
  for (const k of ["1", "2", "3", "4", "5"] as const) {
    if (o.domainScore[k] == null || typeof o.domainScore[k] !== "number") {
      o.domainScore = { ...o.domainScore, [k]: 50 };
    }
  }
  if (o.schemaVersion == null || o.schemaVersion < SCHEMA_VERSION) {
    o.schemaVersion = SCHEMA_VERSION;
  }
  if (!Array.isArray(o.practiceExamAttempts)) o.practiceExamAttempts = [];
  if (!o.trainingRuns || typeof o.trainingRuns !== "object") {
    o.trainingRuns = { labs: {}, sims: {}, decisions: {} };
  } else {
    o.trainingRuns = {
      labs: typeof o.trainingRuns.labs === "object" && o.trainingRuns.labs ? o.trainingRuns.labs : {},
      sims: typeof o.trainingRuns.sims === "object" && o.trainingRuns.sims ? o.trainingRuns.sims : {},
      decisions:
        typeof o.trainingRuns.decisions === "object" && o.trainingRuns.decisions ? o.trainingRuns.decisions : {},
    };
  }
  if (!Array.isArray(o.trainingMasteryLessonIds)) o.trainingMasteryLessonIds = [];
  if (!o.feedbackLoop || typeof o.feedbackLoop !== "object") {
    o.feedbackLoop = emptyFeedbackLoop();
  } else {
    o.feedbackLoop = {
      confidenceByQuestionId:
        typeof o.feedbackLoop.confidenceByQuestionId === "object" && o.feedbackLoop.confidenceByQuestionId
          ? o.feedbackLoop.confidenceByQuestionId
          : {},
      confusingQuestionIds: Array.isArray(o.feedbackLoop.confusingQuestionIds)
        ? o.feedbackLoop.confusingQuestionIds
        : [],
      quizRetryCountByQuestionId:
        typeof o.feedbackLoop.quizRetryCountByQuestionId === "object" && o.feedbackLoop.quizRetryCountByQuestionId
          ? o.feedbackLoop.quizRetryCountByQuestionId
          : {},
      teachBackMicroByQuestionId:
        typeof o.feedbackLoop.teachBackMicroByQuestionId === "object" && o.feedbackLoop.teachBackMicroByQuestionId
          ? o.feedbackLoop.teachBackMicroByQuestionId
          : {},
      falseConfidenceHitsByQuestionId:
        typeof o.feedbackLoop.falseConfidenceHitsByQuestionId === "object" &&
        o.feedbackLoop.falseConfidenceHitsByQuestionId
          ? o.feedbackLoop.falseConfidenceHitsByQuestionId
          : {},
      confusionSignalByConcept:
        typeof o.feedbackLoop.confusionSignalByConcept === "object" && o.feedbackLoop.confusionSignalByConcept
          ? o.feedbackLoop.confusionSignalByConcept
          : {},
    };
  }
  o.userFlashcards = Array.isArray(o.userFlashcards) ? o.userFlashcards : [];
  o.missedJournal = Array.isArray(o.missedJournal) ? o.missedJournal : [];
  o.spaced = Array.isArray(o.spaced) ? o.spaced : [];
  o.notes = Array.isArray(o.notes) ? o.notes : [];
  o.completedLessons = Array.isArray(o.completedLessons) ? o.completedLessons : [];
  o.pbqPassedIds = Array.isArray(o.pbqPassedIds) ? o.pbqPassedIds : [];
  if (o.lastAcknowledgedStreakMilestone == null || typeof o.lastAcknowledgedStreakMilestone !== "number") {
    o.lastAcknowledgedStreakMilestone = 0;
  }
  if (o.todayActivity && typeof o.todayActivity === "object") {
    const ta = o.todayActivity as TodayActivity;
    o.todayActivity = {
      date: typeof ta.date === "string" ? ta.date : "",
      lessonIds: Array.isArray(ta.lessonIds) ? ta.lessonIds.filter((x) => typeof x === "string") : [],
      quizQuestionsAnswered: typeof ta.quizQuestionsAnswered === "number" ? ta.quizQuestionsAnswered : 0,
      flashcardsReviewed: typeof ta.flashcardsReviewed === "number" ? ta.flashcardsReviewed : 0,
      pbqAttempts: typeof ta.pbqAttempts === "number" ? ta.pbqAttempts : 0,
    };
  }
  if (o.domainScoreDayBaseline && typeof o.domainScoreDayBaseline === "object") {
    const db = o.domainScoreDayBaseline as { date?: unknown; scores?: unknown };
    if (typeof db.date !== "string" || typeof db.scores !== "object" || !db.scores) {
      delete o.domainScoreDayBaseline;
    } else {
      o.domainScoreDayBaseline = {
        date: db.date,
        scores: { ...base.domainScore, ...(db.scores as Record<string, number>) },
      };
    }
  }
  if (o.outsideQuizIdentityEcho && typeof o.outsideQuizIdentityEcho === "object") {
    const e = o.outsideQuizIdentityEcho as { bucket?: unknown; at?: unknown };
    if (typeof e.bucket !== "string" || typeof e.at !== "number") {
      delete o.outsideQuizIdentityEcho;
    }
  }
  if (o.studyResume && typeof o.studyResume === "object") {
    const r = o.studyResume as Record<string, unknown>;
    const nums = [
      "lessonAt",
      "watchAt",
      "quizAt",
      "flashcardsAt",
      "pbqAt",
      "pbqHubAt",
      "practiceExamAt",
      "practiceExamsHubAt",
      "bossHubAt",
      "bossAt",
      "session30At",
      "simAt",
      "roadmapAt",
      "progressPageAt",
      "searchAt",
      "importPageAt",
      "pdfGuideAt",
    ] as const;
    for (const k of nums) {
      if (r[k] != null && typeof r[k] !== "number") delete r[k];
    }
    const strs = ["watchLessonId", "practiceExamId", "bossId", "pdfGuidePdfId", "pdfGuideLessonId", "pdfGuideSectionTitle"] as const;
    for (const k of strs) {
      if (r[k] != null && typeof r[k] !== "string") delete r[k];
    }
    if (r.simLessonId !== undefined && r.simLessonId !== null && typeof r.simLessonId !== "string") delete r.simLessonId;
  }
  if (!o.pdfLibrary || typeof o.pdfLibrary !== "object") {
    o.pdfLibrary = { bySection: {}, localFileMeta: {} };
  } else {
    const pl = o.pdfLibrary as import("../types/pdfLibrary").PdfLibraryProgress;
    const lm = pl.localFileMeta && typeof pl.localFileMeta === "object" ? pl.localFileMeta : {};
    o.pdfLibrary = {
      bySection: typeof pl.bySection === "object" && pl.bySection ? pl.bySection : {},
      localFileMeta: lm,
      pdfSetupLastVisitAt: typeof pl.pdfSetupLastVisitAt === "number" ? pl.pdfSetupLastVisitAt : undefined,
      pdfSetupMarkedCompleteAt: typeof pl.pdfSetupMarkedCompleteAt === "number" ? pl.pdfSetupMarkedCompleteAt : undefined,
    };
  }
  return o;
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return migrateAndNormalize(defaultState(), parsed);
  } catch (e) {
    try {
      const bad = localStorage.getItem(KEY);
      if (bad) {
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        localStorage.setItem(`${KEY}_corrupt_${stamp}`, bad);
      }
    } catch {
      /* ignore */
    }
    console.error("spt: failed to load state, using defaults", e);
    return defaultState();
  }
}

export function saveState(s: PersistedState) {
  const out: PersistedState = { ...s, schemaVersion: SCHEMA_VERSION };
  localStorage.setItem(KEY, JSON.stringify(out));
}

export function exportStateJson(s: PersistedState): string {
  return JSON.stringify({ ...s, schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString() }, null, 2);
}

export function importStateFromJson(str: string): { ok: true; state: PersistedState } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(str) as unknown;
    if (!parsed || typeof parsed !== "object") return { ok: false, error: "Root must be an object" };
    const copy = { ...(parsed as Record<string, unknown>) };
    delete copy.exportedAt;
    const d = defaultState();
    return { ok: true, state: migrateAndNormalize(d, copy) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON" };
  }
}

export { KEY, defaultState };
