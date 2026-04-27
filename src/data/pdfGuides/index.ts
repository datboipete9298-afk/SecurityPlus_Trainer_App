import type { PdfGuideSection } from "../../types/pdfLibrary";
import { generateAllLessonPdfGuides } from "./generatePdfGuides";
import { PRACTICE_EXAM_STRATEGY } from "./practiceExamStrategy";
import { ORDERED_LESSON_IDS } from "../lessons";

const generated = generateAllLessonPdfGuides();

const byKey = new Map<string, PdfGuideSection>();
for (const g of generated) {
  byKey.set(`${g.pdfId}::${g.lessonId}`, g);
}

export const PDF_GUIDE_SECTIONS: readonly PdfGuideSection[] = generated;

export { PRACTICE_EXAM_STRATEGY };

export function pdfGuideSectionKey(pdfId: string, lessonId: string): string {
  return `${pdfId}::${lessonId}`;
}

export function getPdfGuideSection(pdfId: string, lessonId: string): PdfGuideSection | undefined {
  return byKey.get(pdfGuideSectionKey(pdfId, lessonId));
}

export function listLessonIdsForPdf(pdfId: string): string[] {
  const ids = new Set<string>();
  for (const g of generated) {
    if (g.pdfId === pdfId) ids.add(g.lessonId);
  }
  const order = new Map(ORDERED_LESSON_IDS.map((id, i) => [id, i]));
  return [...ids].sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999));
}
