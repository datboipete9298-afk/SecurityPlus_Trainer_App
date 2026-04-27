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

/** For multi-select feedback: indices missed vs wrongly selected. */
export function multiSelectGapSummary(q: QuizQuestion, multiSel: number[]): { missed: number[]; wrongPicks: number[] } {
  const need = q.correctIndices!;
  const set = new Set(multiSel);
  const missed = need.filter((i) => !set.has(i));
  const wrongPicks = multiSel.filter((i) => !need.includes(i));
  return { missed, wrongPicks };
}

/** Short label for option index in feedback (A, B, C, …). */
export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

/**
 * One-line learner-facing note for each option (correct vs distractor).
 * Uses `wrongExplanations[i]` when present; falls back to the main explanation for the keyed correct answer(s).
 */
export function learnerNoteForOption(q: QuizQuestion, optionIndex: number): string {
  const raw = q.wrongExplanations[optionIndex];
  if (raw != null && String(raw).trim() !== "") return raw;
  if (isMultiSelect(q) && q.correctIndices!.includes(optionIndex)) return q.explanation;
  if (!isMultiSelect(q) && optionIndex === q.correctIndex) return q.explanation;
  return "This choice doesn’t match what the stem is asking for.";
}
