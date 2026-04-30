import type { StoredPdfTextRecord } from "../lib/pdfLibraryDb";
import { lessons, ORDERED_LESSON_IDS } from "../data/lessons";
import { snippetsForLesson } from "./lessonPdfMatch";

export type PdfLessonMatchRow = {
  lessonId: string;
  title: string;
  domain: string;
  score: number;
  matchStrength: "strong" | "medium" | "weak";
  reason: string;
};

/**
 * Lightweight lesson suggestions for one imported PDF (local text only).
 * Scans roadmap order with existing snippet matcher — not ML.
 */
export function topLessonsForImportedPdf(pdf: StoredPdfTextRecord, max = 6): PdfLessonMatchRow[] {
  const rows: PdfLessonMatchRow[] = [];
  for (const lessonId of ORDERED_LESSON_IDS) {
    const L = lessons[lessonId];
    if (!L) continue;
    const hits = snippetsForLesson(lessonId, L.title, [pdf], 1, 400, 3500, L.domain);
    const top = hits[0];
    if (!top) continue;
    rows.push({
      lessonId,
      title: L.title,
      domain: L.domain,
      score: top.score,
      matchStrength: top.matchStrength,
      reason: top.matchReason,
    });
  }
  rows.sort((a, b) => b.score - a.score);
  return rows.slice(0, max);
}
