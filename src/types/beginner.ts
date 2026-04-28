export interface BeginnerContent {
  beginnerIntro: string;
  prerequisiteTerms: string[];
  plainEnglish: string;
  realLifeExample: string;
  whyItMatters: string;
  watchFor: string[];
  pausePrompts: string[];
  confusingParts: string[];
  dontConfuse: { a: string; b: string }[];
  oneSentenceSummary: string;
  /** Short reassurance line for anxious beginners */
  dontOverthink: string;
  explainLike10: string;
  realWorldAnalogy: string;
  examWants: string;
  oneSentenceForExam: string;
  /** Optional extra scenario for “Explain simpler” modal */
  scenarioExample?: string;
}

export interface LessonProgress {
  videoWatched?: boolean;
  videoWatchedAt?: number;
  highlightsDone?: boolean;
  notesSaved?: boolean;
  /** Watch + pause + one note + quick check (VideoStudyMode) */
  videoFusionChecklist?: {
    paused?: boolean;
    wroteOneNote?: boolean;
    saidAloud?: boolean;
    /** Submitted a quick-check answer (right or wrong) */
    quickCheckAttempted?: boolean;
    /** Selected the correct option */
    quickCheckPassed?: boolean;
  };
  /** In-lesson “quick action” (safe, local) acknowledged */
  quickActionDone?: boolean;
  quizCompleted?: boolean;
  flashcardsReviewed?: boolean;
  labDone?: boolean;
  teachBackDone?: boolean;
}

export function isLessonProgressComplete(
  p: LessonProgress,
  opts?: { hasLab: boolean; handsOnComplete?: boolean },
): boolean {
  const needLab = opts?.hasLab ?? false;
  const handsOn = opts?.handsOnComplete ?? true;
  return !!(
    p.videoWatched &&
    p.highlightsDone &&
    p.notesSaved &&
    p.quickActionDone &&
    p.quizCompleted &&
    p.flashcardsReviewed &&
    p.teachBackDone &&
    (!needLab || p.labDone) &&
    handsOn
  );
}

/** Simple lesson mode: video → hooks → one note → action → mini-quiz only (no flashcards/teach-back/lab required). */
export function isSimpleLessonProgressComplete(p: LessonProgress): boolean {
  return !!(p.videoWatched && p.highlightsDone && p.notesSaved && p.quickActionDone && p.quizCompleted);
}
