import type { QuizQuestion } from "../types";
import type { TrainingLab } from "./labEngine";
import type { DecisionScenario, DecisionChoice } from "./decisionEngine";
import { correctAnswerLabel, gradeQuestion, isMultiSelect, learnerNoteForOption } from "../utils/quizHelpers";
import {
  buildAdaptiveAddendum,
  buildThinkingTraining,
  computeAdaptiveTier,
  conceptKey,
  type AdaptiveTier,
} from "./adaptiveEngine";

export type TutorFeedbackResult = "correct" | "incorrect";

/** Structured tutor-style feedback for any interaction surface. */
export type TutorFeedback = {
  result: TutorFeedbackResult;
  /** Reserved for analytics; user confidence is stored separately in app state. */
  confidenceLevel: number;
  explanationSimple: string;
  explanationDetailed: string;
  whyCorrect: string;
  whyWrongOptions: { optionIndex: number; label: string; reason: string }[];
  examRecognitionRule: string;
  realWorldMeaning: string;
  memoryHook: string;
  nextActionSuggestion: string;
  commonMistakeAlert: string;
  /** Process / pattern training (not the keyed letter). */
  thinkingTraining: string;
  /** Tiered addendum from adaptive engine (may be empty). */
  adaptiveAddendum: string;
};

const EXAM_GENERIC =
  "CompTIA loves stems that pair a situation with the *best* control type, CIA property, or process step — read for “MOST,” “BEST,” and “FIRST.”";

function firstSentence(text: string): string {
  const t = text.trim();
  if (!t) return "Review the objective and the exam keyword below.";
  const cut = t.split(/(?<=[.!?])\s/)[0];
  return cut && cut.length <= 220 ? cut : t.slice(0, 200) + (t.length > 200 ? "…" : "");
}

function realWorldFromDomain(domain: string): string {
  const d = domain?.[0] ?? "1";
  const map: Record<string, string> = {
    "1": "Shows up in policy workshops, risk registers, and “why we can’t just buy a box to fix this” conversations.",
    "2": "Shows up in architecture reviews, segmentation debates, and incident scoping.",
    "3": "Shows up in SOC triage, log reviews, and “is this normal?” investigations.",
    "4": "Shows up in IAM projects, phishing response, and access reviews.",
    "5": "Shows up in IR playbooks, backups, and business continuity tests.",
  };
  return map[d] ?? map["1"]!;
}

/** If the learner has missed this pattern before, simplify the opening line. */
export function adaptExplanationSimple(base: string, missStreak: number): string {
  if (missStreak <= 1) return base;
  if (missStreak >= 3) {
    return `Let’s slow down: ${base.replace(/^./, (c) => c.toLowerCase())} (You’ve seen this idea before — repetition is the point.)`;
  }
  return `${base} Tip: say the rule in one breath, then match the stem to that rule.`;
}

function resolveMissBefore(correct: boolean, opts?: { missStreak?: number; missStreakBefore?: number }): number {
  if (opts?.missStreakBefore !== undefined) return opts.missStreakBefore;
  if (opts?.missStreak !== undefined) {
    return correct ? opts.missStreak : Math.max(0, opts.missStreak - 1);
  }
  return 0;
}

export function buildQuizTutorFeedback(
  q: QuizQuestion,
  singleSel: number | null,
  multiSel: number[],
  opts?: {
    /** @deprecated Prefer missStreakBefore — this was post-record `questionStats.w`. */
    missStreak?: number;
    missStreakBefore?: number;
    falseConfidenceHitsAfterAttempt?: number;
    confusionHits?: number;
    feedbackLoop?: { confusionSignalByConcept?: Record<string, number> };
  },
): TutorFeedback {
  const multi = isMultiSelect(q);
  const correct = gradeQuestion(q, singleSel, multiSel);
  const result: TutorFeedbackResult = correct ? "correct" : "incorrect";
  const missBefore = resolveMissBefore(correct, opts);
  const missAfterAttempt = missBefore + (correct ? 0 : 1);
  const fc = opts?.falseConfidenceHitsAfterAttempt ?? 0;
  const ck = conceptKey(q.lessonId, q.examKeyword);
  const confusionHits =
    opts?.confusionHits ?? (opts?.feedbackLoop?.confusionSignalByConcept?.[ck] ?? 0);
  const tier: AdaptiveTier = computeAdaptiveTier({
    missStreakOnQuestion: missAfterAttempt,
    falseConfidenceHits: fc,
    confusionHitsOnConcept: confusionHits,
  });
  const falseConf = fc >= 1 && !correct;
  const adaptiveAddendum = buildAdaptiveAddendum({
    tier,
    correct,
    falseConfidence: falseConf,
    confusionHits,
  });
  const thinkingTraining = buildThinkingTraining(q, correct);

  const whyWrongOptions = q.options.map((label, j) => ({
    optionIndex: j,
    label,
    reason: learnerNoteForOption(q, j),
  }));

  const simpleBase = correct
    ? `This is correct because ${firstSentence(q.explanation).replace(/^./, (c) => c.toLowerCase())}`
    : `The best answer is “${correctAnswerLabel(q)}” because ${firstSentence(q.explanation).replace(/^./, (c) => c.toLowerCase())}`;

  const adaptStreakForCopy = missAfterAttempt;
  const commonMistake = correct
    ? "Don’t speed-read past “MOST/BEST/FIRST” — those words change the keyed answer."
    : `Many people pick a “true but not best” option. The exam wants the choice that *most directly* matches the stem’s primary ask — use the keyword list: ${q.examKeyword}.`;

  const examRule = `If you see keywords like “${q.examKeyword.split(",")[0]?.trim() ?? "policy, control, CIA"}” in the stem → think: ${multi ? "select every option that fully applies (no partial credit on the real exam)." : "eliminate the two weakest distractors first, then compare the last two."}`;

  const memoryHook =
    (q.examKeyword.split(",")[0]?.trim() || "this objective") +
    " → " +
    (correct ? "link the stem to the rule you just confirmed." : `tie it to “${correctAnswerLabel(q).slice(0, 48)}${correctAnswerLabel(q).length > 48 ? "…" : ""}”.`);

  let nextAction = correct
    ? "Next: try the next question, or retry this one for speed if you want automatic recognition."
    : "Next: reread the breakdown, add a card if it still feels fuzzy, then retry this question or continue when ready.";
  if (!correct && missAfterAttempt >= 3) {
    nextAction =
      "Same item missed 3+ times — pause forward progress: use lesson labs, priority flashcards, or retry until this stem feels easy.";
  } else if (!correct && tier >= 2) {
    nextAction =
      "Next: build a mini table — stem keyword → each option’s job → eliminate two fast, then decide.";
  }

  return {
    result,
    confidenceLevel: correct ? 0.75 : 0.35,
    explanationSimple: adaptExplanationSimple(simpleBase, adaptStreakForCopy),
    explanationDetailed: q.explanation,
    whyCorrect: q.explanation,
    whyWrongOptions,
    examRecognitionRule: `${examRule} ${EXAM_GENERIC}`,
    realWorldMeaning: realWorldFromDomain(q.domain),
    memoryHook,
    nextActionSuggestion: nextAction,
    commonMistakeAlert: commonMistake,
    thinkingTraining,
    adaptiveAddendum,
  };
}

export function buildLabTutorFeedback(lab: TrainingLab, passed: boolean): TutorFeedback {
  const result: TutorFeedbackResult = passed ? "correct" : "incorrect";
  return {
    result,
    confidenceLevel: passed ? 0.8 : 0.4,
    explanationSimple: passed
      ? `Nice — you completed the checkpoints for: ${firstSentence(lab.objective)}`
      : `Review the steps you skipped — the lab expects you to internalize: ${firstSentence(lab.objective)}`,
    explanationDetailed: [lab.objective, lab.realWorldContext, lab.expectedResult].filter(Boolean).join("\n\n"),
    whyCorrect: lab.expectedResult + " " + lab.examConnection,
    whyWrongOptions: lab.failureModes.map((f, i) => ({ optionIndex: i, label: `Gap ${i + 1}`, reason: f })),
    examRecognitionRule: lab.examConnection,
    realWorldMeaning: lab.realWorldContext,
    memoryHook: lab.memoryHook,
    nextActionSuggestion: passed ? "Retry for speed, or move on to the simulations when ready." : "Use hints, then retry the lab — no timer.",
    commonMistakeAlert: lab.failureModes[0] ?? "Skipping the “why” behind each step weakens exam recall.",
    thinkingTraining:
      "Think: what evidence would you show an auditor? Each checkpoint should leave a trace you could explain in one sentence.",
    adaptiveAddendum: "",
  };
}

export function buildSimChoiceTutorFeedback(params: {
  choiceText: string;
  wasBest: boolean;
  narrative: string;
  feedback: string;
  examWhy: string;
  outcomeChain?: string;
}): TutorFeedback {
  const { choiceText, wasBest, narrative, feedback, examWhy, outcomeChain } = params;
  const pickedPreview = choiceText.length > 100 ? `${choiceText.slice(0, 100)}…` : choiceText;
  const chain = outcomeChain
    ? `\n\n**Outcome chain:** ${outcomeChain}`
    : "";
  return {
    result: wasBest ? "correct" : "incorrect",
    confidenceLevel: wasBest ? 0.7 : 0.3,
    explanationSimple: wasBest
      ? `Strong choice (“${pickedPreview}”) — aligns with containment and evidence.`
      : `This branch (“${pickedPreview}”) costs you — read the consequence and exam angle.`,
    explanationDetailed: [narrative, feedback, chain].join("\n\n"),
    whyCorrect: feedback,
    whyWrongOptions: [],
    examRecognitionRule: examWhy,
    realWorldMeaning: "SOC and IR run on ordered decisions; the exam tests whether you pick the next safe action.",
    memoryHook: "Triage → scope → preserve evidence → escalate — order matters.",
    nextActionSuggestion: "Continue the simulation when the feedback sits right; retry the sim from the start if you want a clean run.",
    commonMistakeAlert: wasBest
      ? "Don’t skip documenting handoff details — exams love “what to log first.”"
      : "Watch for “fastest looking” answers that skip evidence or policy.",
    thinkingTraining:
      "Simulation pattern: containment beats heroics; evidence beats assumptions; escalate when scope grows — say it before you click.",
    adaptiveAddendum: wasBest
      ? ""
      : "Adaptive: wrong branches here mirror real escalation — reread the outcome chain before continuing.",
  };
}

export function buildDecisionTutorFeedback(scenario: DecisionScenario, choice: DecisionChoice): TutorFeedback {
  const best = scenario.choices.find((c) => c.isBest)!;
  return {
    result: choice.isBest ? "correct" : "incorrect",
    confidenceLevel: choice.isBest ? 0.85 : 0.25,
    explanationSimple: choice.isBest
      ? `Strong call: ${firstSentence(choice.explanation)}`
      : `The exam-best path is: ${best.text.slice(0, 120)}${best.text.length > 120 ? "…" : ""}`,
    explanationDetailed: [choice.result, choice.explanation].join("\n\n"),
    whyCorrect: best.explanation,
    whyWrongOptions: scenario.choices
      .map((c, idx) => ({ c, idx }))
      .filter(({ c }) => !c.isBest)
      .map(({ c, idx }) => ({
        optionIndex: idx,
        label: c.text,
        reason: c.explanation + (c.examTrap ? ` Trap: ${c.examTrap}` : ""),
      })),
    examRecognitionRule: choice.examTrap
      ? `Exam trap pattern: ${choice.examTrap}`
      : "Leadership pressure + shortcuts → pick the option that documents risk and keeps controls honest.",
    realWorldMeaning:
      "These scenarios mirror real change windows, exception requests, and “just this once” asks — governance wins long-term.",
    memoryHook: scenario.memoryHook,
    nextActionSuggestion: choice.isBest
      ? "Solid — move on or reread the other branches to see how they fail."
      : "Compare each option’s risk: data loss, compliance, and repeatability — then retry the scenario.",
    commonMistakeAlert:
      "People often pick the option that feels fastest instead of the one that preserves evidence and accountability.",
    thinkingTraining:
      "Decisions under pressure: default to document + least privilege + time-bound exceptions — if an option skips those, it’s usually wrong on the exam.",
    adaptiveAddendum: choice.isBest ? "" : "Adaptive: compare legal/regulatory blast radius for each branch before retrying.",
  };
}

export function buildFlashcardTutorFeedback(front: string, back: string, gotRight: boolean, trap?: string): TutorFeedback {
  return {
    result: gotRight ? "correct" : "incorrect",
    confidenceLevel: gotRight ? 0.75 : 0.35,
    explanationSimple: gotRight
      ? "Good recall — keep linking the front of the card to the rule on the back."
      : "That’s the gap to close: read the back slowly, then say it without looking.",
    explanationDetailed: back,
    whyCorrect: back,
    whyWrongOptions: [],
    examRecognitionRule: trap
      ? `Trap keyword to watch: ${trap}`
      : "On the exam, recognition beats memorizing long paragraphs — own the one-line rule.",
    realWorldMeaning: "These cards mirror how teams shorthand controls and pitfalls in standups.",
    memoryHook: (front.slice(0, 40) + (front.length > 40 ? "…" : "")) + " → " + firstSentence(back),
    nextActionSuggestion: gotRight
      ? "Continue when ready — spaced repetition will bring this card back."
      : "Hit Again to reschedule sooner; add your own note in Brain Book if a word keeps tripping you.",
    commonMistakeAlert: "Mixing similar acronyms or control types is the #1 flashcard miss — compare pairs on purpose.",
    thinkingTraining: "Flashcard pattern: front = trigger phrase you’ll see on the exam; back = one rule you’d tell a new hire.",
    adaptiveAddendum: "",
  };
}

