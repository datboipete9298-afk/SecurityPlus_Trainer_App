import type { QuizQuestion } from "../types";

export function isMultiSelect(q: QuizQuestion): boolean {
  return Array.isArray(q.correctIndices) && q.correctIndices.length > 0;
}

export function gradeMulti(selected: number[], expected: number[]): boolean {
  const a = [...selected].sort((x, y) => x - y);
  const b = [...expected].sort((x, y) => x - y);
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** Human-readable correct answer(s) for flashcards and summaries. */
export function correctAnswerLabel(q: QuizQuestion): string {
  if (isMultiSelect(q) && q.correctIndices?.length) {
    return q.correctIndices.map((i) => q.options[i] ?? `Option ${i}`).join("; ");
  }
  return q.options[q.correctIndex] ?? "";
}

export function gradeQuestion(
  q: QuizQuestion,
  singleSel: number | null,
  multiSel: number[],
): boolean {
  if (isMultiSelect(q)) return gradeMulti(multiSel, q.correctIndices!);
  return singleSel === q.correctIndex;
}
