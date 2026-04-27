/** Browser session draft for in-progress Messer practice exams (exam mode). */

const PREFIX = "spt_exam_draft_v1_";

export function practiceExamDraftKey(examId: string): string {
  return `${PREFIX}${examId}`;
}

export type PracticeExamDraftPayload = {
  i: number;
  answers: Record<string, { single?: number; multi?: number[] }>;
};

export function readPracticeExamDraft(examId: string): PracticeExamDraftPayload | null {
  try {
    const raw = sessionStorage.getItem(practiceExamDraftKey(examId));
    if (!raw) return null;
    const o = JSON.parse(raw) as PracticeExamDraftPayload;
    if (typeof o?.i !== "number" || !o.answers || typeof o.answers !== "object") return null;
    return o;
  } catch {
    return null;
  }
}

export function writePracticeExamDraft(examId: string, d: PracticeExamDraftPayload) {
  sessionStorage.setItem(practiceExamDraftKey(examId), JSON.stringify(d));
}

export function clearPracticeExamDraft(examId: string) {
  sessionStorage.removeItem(practiceExamDraftKey(examId));
}

/** Exam ids that have a non-empty draft saved in this tab. */
export function listPracticeExamDraftExamIds(): string[] {
  if (typeof sessionStorage === "undefined") return [];
  const out: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const k = sessionStorage.key(i);
    if (k?.startsWith(PREFIX)) {
      const id = k.slice(PREFIX.length);
      if (readPracticeExamDraft(id)) out.push(id);
    }
  }
  return out;
}

export const PRACTICE_EXAM_SHORT_LABEL: Record<string, string> = {
  "messer-exam-a": "Exam A",
  "messer-exam-b": "Exam B",
  "messer-exam-c": "Exam C",
};

export function practiceExamDisplayLabel(examId: string): string {
  return PRACTICE_EXAM_SHORT_LABEL[examId] ?? examId.replace(/^messer-exam-/, "Exam ").toUpperCase();
}
