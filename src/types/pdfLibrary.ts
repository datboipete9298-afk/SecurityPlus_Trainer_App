import type { DomainId } from "./index";

export type PdfKind = "notes" | "study" | "exams";

export type PdfInterruptKind = "stop" | "pause" | "trap" | "dont_miss" | "quick_check";

export type PdfGuideMiniQ = {
  question: string;
  choices: string[];
  correctIndex: number;
};

export type PdfGuideSection = {
  pdfId: string;
  lessonId: string;
  sectionTitle: string;
  /** We do not ship third-party page numbers; use bookmarks/search in your PDF. */
  pageRange: null;
  locatorHint: string;
  summary: string;
  keyConcepts: string[];
  mustHighlight: string[];
  shouldHighlight: string[];
  doNotHighlight: string[];
  writeThisDown: string;
  explainLikeImDumb: string;
  examTrap: string;
  realWorldExample: string;
  memoryTrick: string;
  quickCheck: string;
  miniQuiz: PdfGuideMiniQ[];
  linkedFlashcardIds: string[];
  interrupts: { kind: PdfInterruptKind; title: string; body: string }[];
  domain: DomainId;
};

export type PdfRegistrySection = {
  id: string;
  title: string;
  lessonIds?: string[];
};

export type PdfRegistryEntry = {
  id: string;
  title: string;
  description: string;
  type: PdfKind;
  /** Canonical filename (for display / matching hints). */
  fileName: string;
  /** Primary expected names (often match the publisher download). */
  expectedFileNames: string[];
  /** Normalized substring aliases for matching user downloads. */
  aliases: string[];
  /** If true, guided flows assume the user should add this file in PDF setup. */
  required: boolean;
  /** PDF bytes live in IndexedDB only — never shipped with the app. */
  localOnly: boolean;
  /** Short steps for /pdf-setup. */
  setupInstructions: string;
  /** Honest pointer: user must legally obtain the file. */
  purchaseOrDownloadNote: string;
  /** Sort order on hub / setup (lower first). */
  displayOrder: number;
  sections: PdfRegistrySection[];
};

export type PdfSectionProgress = {
  lastOpenedAt: number;
  highlights: string[];
  checkpointsDone: Record<string, boolean>;
  interruptSeen: Record<string, boolean>;
  completedAt?: number;
};

/** Metadata mirrored from IndexedDB (small — safe in persisted JSON). Blobs are never stored here. */
export type PdfLocalFileMeta = {
  addedAt: number;
  name: string;
  size: number;
};

export type PdfLibraryProgress = {
  bySection: Record<string, PdfSectionProgress>;
  /** Keys = pdfId when a file is registered locally */
  localFileMeta?: Record<string, PdfLocalFileMeta>;
  /** Last time user opened /pdf-setup */
  pdfSetupLastVisitAt?: number;
  /** User acknowledged “all required PDFs added” (optional flag for coach) */
  pdfSetupMarkedCompleteAt?: number;
};
