import type { DomainId } from "../types";

const KEY = "spt_v1_state";
const SCHEMA_VERSION = 3 as const;

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
  onboarding: { hasSeenStartHere: false },
  lessonProgress: {},
  practiceExamAttempts: [],
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
  o.userFlashcards = Array.isArray(o.userFlashcards) ? o.userFlashcards : [];
  o.missedJournal = Array.isArray(o.missedJournal) ? o.missedJournal : [];
  o.spaced = Array.isArray(o.spaced) ? o.spaced : [];
  o.notes = Array.isArray(o.notes) ? o.notes : [];
  o.completedLessons = Array.isArray(o.completedLessons) ? o.completedLessons : [];
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
