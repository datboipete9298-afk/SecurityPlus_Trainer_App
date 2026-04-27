import type { PdfKind, PdfRegistryEntry } from "../types/pdfLibrary";
import { ORDERED_LESSON_IDS } from "./lessons";

const allLessonSections = ORDERED_LESSON_IDS.map((id) => ({
  id: `lesson-${id}`,
  title: `Section ${id}`,
  lessonIds: [id],
}));

export const PDF_REGISTRY: PdfRegistryEntry[] = [
  {
    id: "messer-course-notes-v107",
    title: "Professor Messer SY0-701 Course Notes (v107)",
    description:
      "Syncs with each Messer-ordered lesson: guided highlights, checkpoints, and notes while you read your own PDF copy.",
    type: "notes" as PdfKind,
    fileName: "professor-messer-sy0-701-comptia-security-plus-course-notes-v107(1).pdf",
    expectedFileNames: [
      "professor-messer-sy0-701-comptia-security-plus-course-notes-v107(1).pdf",
      "professor-messer-sy0-701-comptia-security-plus-course-notes-v107.pdf",
    ],
    aliases: [
      "messer course notes",
      "course notes v107",
      "sy0-701 course notes",
      "professor messer sy0-701",
    ],
    required: true,
    localOnly: true,
    setupInstructions: "Drag in the Course Notes PDF you received with your Messer course, or choose it from your files.",
    purchaseOrDownloadNote: "Purchase or access through your legal Professor Messer SY0-701 course — this app does not supply the file.",
    displayOrder: 1,
    sections: allLessonSections,
  },
  {
    id: "sy0-701-study-guide",
    title: "SY0-701 Study Guide (PDF)",
    description:
      "Parallel study track: same lesson mapping with study-guide style prompts (deeper framing, same exam hooks).",
    type: "study" as PdfKind,
    fileName: "SYO-701+Study+Guide.pdf",
    expectedFileNames: ["SYO-701+Study+Guide.pdf", "SYO-701 Study Guide.pdf", "sy0-701 study guide.pdf"],
    aliases: ["study guide", "sy0-701 study", "comptia security+ study guide", "701 study"],
    required: true,
    localOnly: true,
    setupInstructions: "Add the SY0-701 study guide PDF you legally obtained (publisher / retailer).",
    purchaseOrDownloadNote: "Obtain the study guide from the publisher or an authorized seller — not included here.",
    displayOrder: 2,
    sections: allLessonSections,
  },
  {
    id: "messer-practice-exams-v18",
    title: "Professor Messer Practice Exams (v18)",
    description:
      "Timing, review loops, and trap patterns for practice tests — use with this app’s quizzes, PBQs, and Messer exam modes.",
    type: "exams" as PdfKind,
    fileName: "professor-messer-sy0-701-comptia-security-plus-practice-exams-v18.pdf",
    expectedFileNames: [
      "professor-messer-sy0-701-comptia-security-plus-practice-exams-v18.pdf",
      "professor messer sy0-701 practice exams v18.pdf",
    ],
    aliases: ["practice exams v18", "messer practice", "sy0-701 practice exams"],
    required: true,
    localOnly: true,
    setupInstructions: "Add the Practice Exams PDF from your Messer course materials.",
    purchaseOrDownloadNote: "Purchase or access through your legal Professor Messer practice exam product.",
    displayOrder: 3,
    sections: [
      { id: "strategy", title: "Exam strategy & timing", lessonIds: [] },
      { id: "review-loop", title: "Review & mistake correction", lessonIds: [] },
      { id: "traps", title: "Trap patterns (general)", lessonIds: [] },
      { id: "domains", title: "Domain refresh links", lessonIds: [...ORDERED_LESSON_IDS] },
    ],
  },
].sort((a, b) => a.displayOrder - b.displayOrder);

export function getPdfRegistryEntry(pdfId: string): PdfRegistryEntry | undefined {
  return PDF_REGISTRY.find((p) => p.id === pdfId);
}

/** Legacy static path — optional dev copy only; production uses IndexedDB via /pdf-setup */
export function pdfPublicUrl(fileName: string): string {
  return `/pdfs/${encodeURIComponent(fileName)}`;
}
