import type { PersistedState } from "./storage";
import { getBossDef } from "../data/bossFights";
import { getPbq } from "../data/pbqCatalog";
import { practiceExamDisplayLabel } from "./practiceExamDraft";

export type StudyResumeState = {
  lessonId?: string;
  lessonAt?: number;
  /** Guided watch route `/watch/:id` */
  watchLessonId?: string;
  watchAt?: number;
  quizLessonId?: string;
  quizAt?: number;
  /** `null` = full deck */
  flashcardsLesson?: string | null;
  flashcardsAt?: number;
  pbqId?: string;
  pbqAt?: number;
  /** Visited PBQ hub `/practice-exams/pbq` */
  pbqHubAt?: number;
  practiceExamId?: string;
  practiceExamAt?: number;
  /** Visited practice exams hub */
  practiceExamsHubAt?: number;
  /** Visited boss list `/boss` */
  bossHubAt?: number;
  bossId?: string;
  bossAt?: number;
  /** 30-minute session page */
  session30At?: number;
  /** Labs & sims — `null` means `/sim` without lesson filter */
  simLessonId?: string | null;
  simAt?: number;
  roadmapAt?: number;
  progressPageAt?: number;
  searchAt?: number;
  importPageAt?: number;
  /** Last PDF lesson guide `/pdf-guides/:pdfId/:lessonId` */
  pdfGuidePdfId?: string;
  pdfGuideLessonId?: string;
  pdfGuideSectionTitle?: string;
  pdfGuideAt?: number;
  /** Video + note fusion — continue at `/watch/:id` */
  videoNotesLessonId?: string;
  videoNotesAt?: number;
};

export type StudyResumePatch = {
  lessonId?: string;
  watchLessonId?: string;
  /** Sets video-notes resume pointer (watch route, fusion copy) */
  videoNotesLessonId?: string;
  quizLessonId?: string;
  flashcardsLesson?: string | null;
  pbqId?: string;
  pbqHub?: boolean;
  practiceExamId?: string;
  practiceExamsHub?: boolean;
  bossHub?: boolean;
  bossId?: string;
  session30?: boolean;
  simLessonId?: string | null;
  roadmap?: boolean;
  progressPage?: boolean;
  search?: boolean;
  import?: boolean;
  pdfGuidePdfId?: string;
  pdfGuideLessonId?: string;
  pdfGuideSectionTitle?: string;
};

export function markEngaged(s: PersistedState): PersistedState {
  if (s.onboarding.hasSeenStartHere) return s;
  return { ...s, onboarding: { hasSeenStartHere: true } };
}

function patchHasResumeFields(patch: StudyResumePatch): boolean {
  return (
    patch.lessonId !== undefined ||
    patch.watchLessonId !== undefined ||
    patch.quizLessonId !== undefined ||
    patch.flashcardsLesson !== undefined ||
    patch.pbqId !== undefined ||
    patch.pbqHub !== undefined ||
    patch.practiceExamId !== undefined ||
    patch.practiceExamsHub !== undefined ||
    patch.bossHub !== undefined ||
    patch.bossId !== undefined ||
    patch.session30 !== undefined ||
    patch.simLessonId !== undefined ||
    patch.roadmap !== undefined ||
    patch.progressPage !== undefined ||
    patch.search !== undefined ||
    patch.import !== undefined ||
    (patch.pdfGuidePdfId !== undefined && patch.pdfGuideLessonId !== undefined) ||
    patch.videoNotesLessonId !== undefined
  );
}

/** Mark onboarding complete on first meaningful engagement + update resume timestamps. */
export function applyStudyResumeAndEngagement(s: PersistedState, patch: StudyResumePatch): PersistedState {
  if (!patchHasResumeFields(patch)) return markEngaged(s);
  const now = Date.now();
  const base = markEngaged(s);
  const prev = base.studyResume ?? {};
  const next: StudyResumeState = { ...prev };
  if (patch.lessonId !== undefined) {
    next.lessonId = patch.lessonId;
    next.lessonAt = now;
  }
  if (patch.watchLessonId !== undefined) {
    next.watchLessonId = patch.watchLessonId;
    next.watchAt = now;
  }
  if (patch.quizLessonId !== undefined) {
    next.quizLessonId = patch.quizLessonId;
    next.quizAt = now;
  }
  if (patch.flashcardsLesson !== undefined) {
    next.flashcardsLesson = patch.flashcardsLesson;
    next.flashcardsAt = now;
  }
  if (patch.pbqId !== undefined) {
    next.pbqId = patch.pbqId;
    next.pbqAt = now;
  }
  if (patch.pbqHub) {
    next.pbqHubAt = now;
  }
  if (patch.practiceExamId !== undefined) {
    next.practiceExamId = patch.practiceExamId;
    next.practiceExamAt = now;
  }
  if (patch.practiceExamsHub) {
    next.practiceExamsHubAt = now;
  }
  if (patch.bossHub) {
    next.bossHubAt = now;
  }
  if (patch.bossId !== undefined) {
    next.bossId = patch.bossId;
    next.bossAt = now;
  }
  if (patch.session30) {
    next.session30At = now;
  }
  if (patch.simLessonId !== undefined) {
    next.simLessonId = patch.simLessonId;
    next.simAt = now;
  }
  if (patch.roadmap) {
    next.roadmapAt = now;
  }
  if (patch.progressPage) {
    next.progressPageAt = now;
  }
  if (patch.search) {
    next.searchAt = now;
  }
  if (patch.import) {
    next.importPageAt = now;
  }
  if (patch.pdfGuidePdfId !== undefined && patch.pdfGuideLessonId !== undefined) {
    next.pdfGuidePdfId = patch.pdfGuidePdfId;
    next.pdfGuideLessonId = patch.pdfGuideLessonId;
    next.pdfGuideSectionTitle = patch.pdfGuideSectionTitle ?? prev.pdfGuideSectionTitle;
    next.pdfGuideAt = now;
  }
  if (patch.videoNotesLessonId !== undefined) {
    next.videoNotesLessonId = patch.videoNotesLessonId;
    next.videoNotesAt = now;
  }
  return { ...base, studyResume: next };
}

export type ResumeKind =
  | "lesson"
  | "watch"
  | "quiz"
  | "flashcards"
  | "pbq"
  | "pbqHub"
  | "practiceExam"
  | "practiceExamsHub"
  | "boss"
  | "bossHub"
  | "session30"
  | "sim"
  | "roadmap"
  | "progress"
  | "search"
  | "import"
  | "pdfGuide";

export type ResumeLinkItem = {
  kind: ResumeKind;
  label: string;
  /** Short type for icon/badge */
  typeLabel: string;
  to: string;
  at: number;
};

export function formatResumeTimestamp(at: number): string {
  try {
    return new Date(at).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

const KIND_ICON: Record<ResumeKind, string> = {
  lesson: "▪",
  watch: "▶",
  quiz: "?",
  flashcards: "⎔",
  pbq: "◇",
  pbqHub: "◇",
  practiceExam: "◈",
  practiceExamsHub: "◈",
  boss: "⚔",
  bossHub: "⚔",
  session30: "⏱",
  sim: "⌬",
  roadmap: "≡",
  progress: "◎",
  search: "⌕",
  import: "⤓",
  pdfGuide: "📄",
};

/** Tier 0 = study activity (shown first); tier 1 = navigation / tools (deprioritized vs study). */
export function resumeKindTier(kind: ResumeKind): 0 | 1 {
  return kind === "roadmap" || kind === "progress" || kind === "search" || kind === "import" ? 1 : 0;
}

export function resumeKindIcon(kind: ResumeKind): string {
  return KIND_ICON[kind];
}

export function buildResumeLinkList(
  sr: StudyResumeState | undefined,
  lessons: Record<string, { title: string }>,
): ResumeLinkItem[] {
  if (!sr) return [];
  const items: ResumeLinkItem[] = [];

  if (sr.lessonId && sr.lessonAt) {
    const t = lessons[sr.lessonId]?.title ?? sr.lessonId;
    items.push({
      kind: "lesson",
      typeLabel: "Lesson",
      label: t,
      to: `/lesson/${sr.lessonId}`,
      at: sr.lessonAt,
    });
  }
  const vnl = sr.videoNotesLessonId;
  const vna = sr.videoNotesAt;
  const wId = sr.watchLessonId;
  const wa = sr.watchAt;
  const sameVnWatch = vnl && wId && vnl === wId && vna && wa;
  if (sameVnWatch) {
    const t = lessons[vnl]?.title ?? vnl;
    const vnNewer = vna >= wa;
    items.push({
      kind: "watch",
      typeLabel: vnNewer ? "Video notes" : "Watch",
      label: vnNewer ? `Continue video notes: ${t}` : `Continue watching: ${t}`,
      to: `/watch/${vnl}`,
      at: Math.max(vna, wa),
    });
  } else {
    if (vnl && vna) {
      const t = lessons[vnl]?.title ?? vnl;
      items.push({
        kind: "watch",
        typeLabel: "Video notes",
        label: `Continue video notes: ${t}`,
        to: `/watch/${vnl}`,
        at: vna,
      });
    }
    if (wId && wa && !(vnl && vnl === wId)) {
      const t = lessons[wId]?.title ?? wId;
      items.push({
        kind: "watch",
        typeLabel: "Watch",
        label: `Continue watching: ${t}`,
        to: `/watch/${wId}`,
        at: wa,
      });
    }
  }
  if (sr.quizLessonId && sr.quizAt) {
    const t = lessons[sr.quizLessonId]?.title ?? sr.quizLessonId;
    items.push({
      kind: "quiz",
      typeLabel: "Quiz",
      label: t,
      to: `/quiz/${sr.quizLessonId}`,
      at: sr.quizAt,
    });
  }
  if (sr.flashcardsAt) {
    const q = sr.flashcardsLesson;
    const to = q ? `/flashcards?lesson=${encodeURIComponent(q)}` : "/flashcards";
    items.push({
      kind: "flashcards",
      typeLabel: "Cards",
      label: q ? lessons[q]?.title ?? q : "All decks",
      to,
      at: sr.flashcardsAt,
    });
  }
  if (sr.pbqId && sr.pbqAt) {
    const p = getPbq(sr.pbqId);
    items.push({
      kind: "pbq",
      typeLabel: "PBQ",
      label: p?.title ?? "PBQ lab",
      to: `/pbq/${sr.pbqId}`,
      at: sr.pbqAt,
    });
  }
  if (sr.pbqHubAt) {
    items.push({
      kind: "pbqHub",
      typeLabel: "PBQ hub",
      label: "PBQ skill labs",
      to: "/practice-exams/pbq",
      at: sr.pbqHubAt,
    });
  }
  if (sr.practiceExamId && sr.practiceExamAt) {
    items.push({
      kind: "practiceExam",
      typeLabel: "Exam",
      label: practiceExamDisplayLabel(sr.practiceExamId),
      to: `/quiz/${sr.practiceExamId}?mode=exam`,
      at: sr.practiceExamAt,
    });
  }
  if (sr.practiceExamsHubAt) {
    items.push({
      kind: "practiceExamsHub",
      typeLabel: "Exams",
      label: "Practice exam hub",
      to: "/practice-exams",
      at: sr.practiceExamsHubAt,
    });
  }
  if (sr.bossId && sr.bossAt) {
    const b = getBossDef(sr.bossId);
    items.push({
      kind: "boss",
      typeLabel: "Boss",
      label: b?.name ?? "Boss fight",
      to: `/boss/${sr.bossId}`,
      at: sr.bossAt,
    });
  }
  if (sr.bossHubAt) {
    items.push({
      kind: "bossHub",
      typeLabel: "Bosses",
      label: "Boss fights",
      to: "/boss",
      at: sr.bossHubAt,
    });
  }
  if (sr.session30At) {
    items.push({
      kind: "session30",
      typeLabel: "30 min",
      label: "Structured 30-minute session",
      to: "/session",
      at: sr.session30At,
    });
  }
  if (sr.simAt) {
    const lid = sr.simLessonId;
    const to = lid ? `/sim?lesson=${encodeURIComponent(lid)}` : "/sim";
    items.push({
      kind: "sim",
      typeLabel: "Labs",
      label: lid ? `Labs · ${lessons[lid]?.title ?? lid}` : "Labs & simulations",
      to,
      at: sr.simAt,
    });
  }
  if (sr.roadmapAt) {
    items.push({
      kind: "roadmap",
      typeLabel: "Roadmap",
      label: "Course path (Messer order)",
      to: "/roadmap",
      at: sr.roadmapAt,
    });
  }
  if (sr.progressPageAt) {
    items.push({
      kind: "progress",
      typeLabel: "Progress",
      label: "Progress & backup",
      to: "/progress",
      at: sr.progressPageAt,
    });
  }
  if (sr.searchAt) {
    items.push({
      kind: "search",
      typeLabel: "Search",
      label: "Search lessons & questions",
      to: "/search",
      at: sr.searchAt,
    });
  }
  if (sr.importPageAt) {
    items.push({
      kind: "import",
      typeLabel: "Import",
      label: "Import lesson (authors)",
      to: "/import",
      at: sr.importPageAt,
    });
  }
  if (sr.pdfGuidePdfId && sr.pdfGuideLessonId && sr.pdfGuideAt) {
    const title = sr.pdfGuideSectionTitle ?? lessons[sr.pdfGuideLessonId]?.title ?? sr.pdfGuideLessonId;
    items.push({
      kind: "pdfGuide",
      typeLabel: "PDF guide",
      label: `Continue PDF guide: ${title}`,
      to: `/pdf-guides/${sr.pdfGuidePdfId}/${sr.pdfGuideLessonId}`,
      at: sr.pdfGuideAt,
    });
  }

  return items.sort((a, b) => {
    const t = resumeKindTier(a.kind) - resumeKindTier(b.kind);
    if (t !== 0) return t;
    return b.at - a.at;
  });
}
