/**
 * Professor Messer Practice Exams book — expected PDF table of contents (structure only).
 * Not lesson notes: always surface separately from Course Notes / Study Guide.
 */
import type { PracticeExamsBookTocRow, TocMapStatus } from "./tocTypes";

type PB = readonly [string, number, TocMapStatus, PracticeExamsBookTocRow["routeHint"]];

const RAW: readonly PB[] = [
  ["Introduction", 0, "practice_only", "intro"],
  ["The CompTIA SY0-701 Security+ Certification", 1, "practice_only", "intro"],
  ["How to Use This Book", 2, "practice_only", "intro"],
  ["Practice Exam A — Performance-Based Questions", 1, "practice_only", "exam_a"],
  ["Practice Exam A — Multiple Choice Questions", 5, "practice_only", "exam_a"],
  ["Practice Exam A — Multiple Choice Quick Answers", 33, "practice_only", "exam_a"],
  ["Practice Exam A — Detailed Answers", 35, "practice_only", "exam_a"],
  ["Practice Exam B — Performance-Based Questions", 131, "practice_only", "exam_b"],
  ["Practice Exam B — Multiple Choice Questions", 135, "practice_only", "exam_b"],
  ["Practice Exam B — Multiple Choice Quick Answers", 161, "practice_only", "exam_b"],
  ["Practice Exam B — Detailed Answers", 163, "practice_only", "exam_b"],
  ["Practice Exam C — Performance-Based Questions", 257, "practice_only", "exam_c"],
  ["Practice Exam C — Multiple Choice Questions", 261, "practice_only", "exam_c"],
  ["Practice Exam C — Multiple Choice Quick Answers", 289, "practice_only", "exam_c"],
  ["Practice Exam C — Detailed Answers", 291, "practice_only", "exam_c"],
] as const;

export const PRACTICE_EXAMS_BOOK_TOC: readonly PracticeExamsBookTocRow[] = RAW.map(([title, pdfPage, mapStatus, routeHint], i) => ({
  tocId: `pe-${String(i + 1).padStart(3, "0")}`,
  title,
  pdfPage,
  mapStatus,
  routeHint,
}));
