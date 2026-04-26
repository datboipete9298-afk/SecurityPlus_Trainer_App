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
  /** In-lesson “quick action” (safe, local) acknowledged */
  quickActionDone?: boolean;
  quizCompleted?: boolean;
  flashcardsReviewed?: boolean;
  labDone?: boolean;
  teachBackDone?: boolean;
}

export function isLessonProgressComplete(p: LessonProgress, opts?: { hasLab: boolean }): boolean {
  const needLab = opts?.hasLab ?? false;
  return !!(
    p.videoWatched &&
    p.highlightsDone &&
    p.notesSaved &&
    p.quickActionDone &&
    p.quizCompleted &&
    p.flashcardsReviewed &&
    p.teachBackDone &&
    (!needLab || p.labDone)
  );
}
