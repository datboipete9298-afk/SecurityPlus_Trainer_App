/**
 * Ensures PDF registry + generated guides cover all full-content lessons for notes/study PDFs.
 */
import { PDF_REGISTRY } from "../src/data/pdfRegistry";
import { getPdfGuideSection, PDF_GUIDE_SECTIONS } from "../src/data/pdfGuides";
import { lessons, ORDERED_LESSON_IDS } from "../src/data/lessons";

const fullLessonIds = ORDERED_LESSON_IDS.filter((id) => lessons[id]?.hasFullContent);

function fail(msg: string): never {
  console.error("validate-pdf-guides:", msg);
  process.exit(1);
}

function main() {
  for (const p of PDF_REGISTRY) {
    if (!p.fileName?.endsWith(".pdf")) fail(`Registry ${p.id}: fileName must end with .pdf`);
    if (!Array.isArray(p.expectedFileNames) || p.expectedFileNames.length === 0) fail(`Registry ${p.id}: expectedFileNames required`);
    if (!Array.isArray(p.aliases) || p.aliases.length === 0) fail(`Registry ${p.id}: aliases required`);
    if (typeof p.required !== "boolean") fail(`Registry ${p.id}: required boolean required`);
    if (typeof p.localOnly !== "boolean") fail(`Registry ${p.id}: localOnly boolean required`);
    if (typeof p.displayOrder !== "number") fail(`Registry ${p.id}: displayOrder required`);
  }

  const ids = new Set(PDF_REGISTRY.map((p) => p.id));
  if (ids.size !== PDF_REGISTRY.length) fail("Duplicate pdf id in registry");

  for (const pdfId of ["messer-course-notes-v107", "sy0-701-study-guide"] as const) {
    for (const lessonId of fullLessonIds) {
      const g = getPdfGuideSection(pdfId, lessonId);
      if (!g) fail(`Missing guide for ${pdfId} / ${lessonId}`);
      if (!g.summary?.trim()) fail(`Empty summary ${pdfId} / ${lessonId}`);
      if (!g.mustHighlight.length) fail(`No mustHighlight ${pdfId} / ${lessonId}`);
      if (g.interrupts.length < 3) fail(`Too few interrupts ${pdfId} / ${lessonId}`);
      if (!g.miniQuiz.length) fail(`No miniQuiz ${pdfId} / ${lessonId}`);
    }
  }

  const exams = PDF_REGISTRY.find((p) => p.id === "messer-practice-exams-v18");
  if (!exams || exams.type !== "exams") fail("Practice exams PDF registry missing");

  const expectedPerPdf = fullLessonIds.length * 2;
  if (PDF_GUIDE_SECTIONS.length !== expectedPerPdf) {
    fail(`Expected ${expectedPerPdf} guide sections (2 PDFs × lessons), got ${PDF_GUIDE_SECTIONS.length}`);
  }

  console.log(
    `validate-pdf-guides: OK — ${PDF_REGISTRY.length} PDFs, ${PDF_GUIDE_SECTIONS.length} lesson guides, ${fullLessonIds.length} full lessons`,
  );
}

main();
