import type { Lesson } from "../types";

/** Unified “note intelligence” surface for every lesson — derived from existing fields + optional overrides. */
export type LessonNoteIntelligence = {
  whatToHighlight: string[];
  writeThisDown: string;
  doNotWrite: string[];
  examSnapshot: string[];
  memoryTrick: string;
  sayItOutLoud: string;
  teachIt: string;
  examMindset: {
    howThisShowsOnExam: string;
    keywordRecognition: string;
    eliminationStrategy: string;
    fastDecision: string;
  };
};

export function emptyLessonNoteIntelligence(): LessonNoteIntelligence {
  return {
    whatToHighlight: [],
    writeThisDown: "",
    doNotWrite: [],
    examSnapshot: [],
    memoryTrick: "",
    sayItOutLoud: "",
    teachIt: "",
    examMindset: {
      howThisShowsOnExam: "",
      keywordRecognition: "",
      eliminationStrategy: "",
      fastDecision: "",
    },
  };
}

function stripMd(s: string): string {
  return s.replace(/\*\*/g, "").trim();
}

/**
 * Builds the 7-part note system + exam mindset for UI. No per-lesson JSON edits required —
 * optional `lesson.noteCoach` can override slices later.
 */
export function getLessonNoteIntelligence(L: Lesson): LessonNoteIntelligence {
  const must = L.highlightRules.filter((h) => h.importance === "must").map((h) => `${h.term}: ${stripMd(h.meaning)}`);
  const should = L.highlightRules.filter((h) => h.importance === "should").map((h) => `${h.term}: ${stripMd(h.meaning)}`);
  const whatToHighlight = [...must, ...should.slice(0, Math.max(0, 8 - must.length))];
  const writeThisDown = L.noteCoach?.writeThisDownOverride ?? L.writeDown;
  const doNotWrite =
    L.noteCoach?.doNotWrite ??
    [
      ...L.examTraps.flatMap((t) => [`Long paragraphs copying the video verbatim`, `Definitions of **${t.a}** and **${t.b}** without your own one-line distinction`]),
      "Vendor product names unless the stem forces them",
      "Every acronym on the slide — only the ones in MUST highlights",
    ].slice(0, 6);
  const examSnapshot =
    L.noteCoach?.examSnapshotOverride ??
    L.instantRecognition.map((x) => `When you see “${x.keyword}” → ${stripMd(x.answer)}`).slice(0, 8);
  const memoryTrick =
    L.noteCoach?.memoryTrick ??
    (L.threeSecondRecall[0]
      ? `3-second drill: ${L.threeSecondRecall[0]}`
      : `Link “${L.title.split(" ")[0] ?? "this topic"}” to one control story you can say in 10 words.`);
  const sayItOutLoud =
    L.noteCoach?.sayItOutLoud ??
    `I can explain ${L.title} in one breath: ${stripMd(L.simpleExplanation).slice(0, 160)}${L.simpleExplanation.length > 160 ? "…" : ""}`;
  const teachIt = L.noteCoach?.teachIt ?? L.teachBackPrompt;
  const examMindset = {
    howThisShowsOnExam:
      L.noteCoach?.examMindset?.howThisShowsOnExam ??
      `Stems will pair a short story with **BEST / FIRST / MOST** and answers that sound plausible. Your job: match the story’s primary risk to ${L.title} vocabulary — not the first “security” word.`,
    keywordRecognition:
      L.noteCoach?.examMindset?.keywordRecognition ??
      `Circle triggers in the stem: ${L.instantRecognition
        .slice(0, 4)
        .map((x) => x.keyword)
        .join(", ") || "policy, control type, CIA property, failure mode"}.`,
    eliminationStrategy:
      L.noteCoach?.examMindset?.eliminationStrategy ??
      "Two-pass: (1) cross out answers that fix the *wrong layer* (policy vs technical vs physical). (2) Of the last two, pick the one the auditor would defend.",
    fastDecision:
      L.noteCoach?.examMindset?.fastDecision ??
      "15-second rule: name the objective in the stem in five words, then lock the option that serves that objective only.",
  };
  return {
    whatToHighlight,
    writeThisDown,
    doNotWrite,
    examSnapshot,
    memoryTrick,
    sayItOutLoud,
    teachIt,
    examMindset,
  };
}
