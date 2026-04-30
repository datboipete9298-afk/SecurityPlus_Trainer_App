/**
 * Classify user-imported PDFs (IndexedDB text library) for hub / import / search labels.
 * Registry PDFs under PDF setup use `PdfKind` separately.
 */
export type ImportedPdfCategory =
  | "messer_course_notes"
  | "study_guide"
  | "practice_exams"
  | "user_imported"
  | "unknown";

export const IMPORTED_PDF_CATEGORY_LABEL: Record<ImportedPdfCategory, string> = {
  messer_course_notes: "Professor Messer Course Notes",
  study_guide: "Study Guide",
  practice_exams: "Practice Exams",
  user_imported: "User Imported PDFs",
  unknown: "Unknown / Uncategorized PDFs",
};

/** Short beginner-friendly explanations (Import / PDF hub). */
export const IMPORTED_PDF_CATEGORY_HELP: Record<ImportedPdfCategory, string> = {
  messer_course_notes: "Quick notes that follow the videos — same order as the course.",
  study_guide: "Deeper explanations — good when you want more context than a slide.",
  practice_exams: "Questions and review — pair with quizzes and practice modes here.",
  user_imported: "Your extra study files — anything else you legally added.",
  unknown: "We could not classify this yet from the filename — rename or pick a category next import.",
};

export function classifyImportedPdfCategory(fileName: string): ImportedPdfCategory {
  const n = fileName.toLowerCase().replace(/\+/g, " ");
  if (n.includes("practice exam") || (n.includes("practice") && n.includes("exam") && n.includes("messer"))) {
    return "practice_exams";
  }
  if (n.includes("course notes") || (n.includes("messer") && n.includes("notes") && n.includes("701"))) {
    return "messer_course_notes";
  }
  if (n.includes("study guide") || (n.includes("sy0") && n.includes("701") && n.includes("study"))) {
    return "study_guide";
  }
  if (n.endsWith(".pdf")) return "user_imported";
  return "unknown";
}

export function importedPdfCategoryLabel(cat: ImportedPdfCategory): string {
  return IMPORTED_PDF_CATEGORY_LABEL[cat];
}
