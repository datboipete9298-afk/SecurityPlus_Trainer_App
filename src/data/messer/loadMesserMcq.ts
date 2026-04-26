import type { DomainId, QuizQuestion } from "../../types";

/** Raw rows from JSON (see scripts/build-messer-mcq.mjs). */
export type MesserMcqRow = {
  id: string;
  domain: DomainId;
  text: string;
  options: string[];
  correct: number | number[];
  explain: string;
};

function wrongFill(options: string[], correct: number | number[]): string[] {
  const set = new Set(Array.isArray(correct) ? correct : [correct]);
  return options.map((_, i) =>
    set.has(i) ? "Part of the correct answer set." : "Not the best choice for this stem.",
  );
}

export function rowsToQuestions(rows: MesserMcqRow[], lessonId: string): QuizQuestion[] {
  return rows.map((r) => {
    const c = r.correct;
    const multi = Array.isArray(c);
    const idxs = multi ? [...c].sort((a, b) => a - b) : null;
    return {
      id: r.id,
      lessonId,
      domain: r.domain,
      type: "pbc",
      difficulty: 3,
      text: r.text,
      options: r.options,
      correctIndex: multi ? (idxs![0] ?? 0) : c,
      correctIndices: multi ? idxs! : undefined,
      explanation: r.explain,
      wrongExplanations: wrongFill(r.options, c),
      examKeyword: "Messer SY0-701 practice exam",
    };
  });
}
