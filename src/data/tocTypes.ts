/** How a TOC row ties to an app lesson / video / PDF (no copyrighted text). */
export type TocMapStatus =
  | "full_lesson"
  | "subtopic_under_lesson"
  | "pdf_supported"
  | "practice_only"
  | "needs_manual_review";

export type MesserCourseNotesTocRow = {
  tocId: string;
  /** e.g. "1.2" */
  objective: string;
  title: string;
  /** Starting page in the official Course Notes PDF (expected structure). */
  pdfPage: number;
  lessonId: string | null;
  mapStatus: TocMapStatus;
};

export type ExamStudyGuideTocRow = {
  tocId: string;
  /** e.g. "Section 1 - Summarize Fundamental Security Concepts" */
  sectionPath: string;
  /** Objective line e.g. "1.1 - Introduction…" */
  title: string;
  /** Rough domain for lesson-page filtering (1–5). */
  domainHint: "1" | "2" | "3" | "4" | "5";
  /** Optional best-fit lesson when we have a clear match. */
  lessonId: string | null;
  mapStatus: TocMapStatus;
};

export type PracticeExamsBookTocRow = {
  tocId: string;
  title: string;
  pdfPage: number;
  mapStatus: TocMapStatus;
  /** Hub / quiz route hints (in-app). */
  routeHint: "practice_hub" | "exam_a" | "exam_b" | "exam_c" | "pbq_hub" | "intro";
};
