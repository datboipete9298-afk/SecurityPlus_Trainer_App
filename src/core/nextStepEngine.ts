import { BOSS_FIGHTS } from "../data/bossFights";
import { lessons, ORDERED_LESSON_IDS } from "../data/lessons";
import type { PersistedState } from "../utils/storage";
import { computeExamReadiness } from "../utils/examReadinessScore";
import { isLessonHandsOnComplete } from "./trainingProgress";
import { buildLearningProfile, findLessonNeedingNotes } from "./learningObserver";

export type NextStep = {
  priority: 1 | 2 | 3 | 4 | 5;
  nextAction: string;
  why: string;
  href: string;
  buttonLabel: string;
  /** Three concrete steps — matches Smart Coach “Do this next” */
  steps: [string, string, string];
};

/**
 * Single source of truth: what the user should do right now.
 * Priority: incomplete lesson → weak domain → last quiz miss → spaced cards due → boss.
 */
export function getNextStep(s: PersistedState): NextStep {
  const step = computeNextStep(s);
  return applyExamRealismAccent(s, step);
}

function applyExamRealismAccent(s: PersistedState, step: NextStep): NextStep {
  const readiness = computeExamReadiness(s);
  const qa = Object.values(s.questionStats).reduce((a, st) => a + st.c + st.w, 0);
  if (readiness.score < 50 || qa < 10) return step;

  const prefix =
    readiness.score >= 68
      ? "You’re edging toward passing-level performance — mix domains soon so timing feels familiar."
      : "You’re gaining ground — weave in mixed practice when linear study stalls.";

  if (step.href === "/roadmap") {
    return {
      ...step,
      why: `${prefix} ${step.why}`,
      steps: [step.steps[0], step.steps[1], `Mix it up: open **Practice exams** from the menu, then hit your weakest domain quizzes.`],
    };
  }

  if (step.href.startsWith("/lesson/")) {
    return {
      ...step,
      why: `${prefix} ${step.why}`,
      steps: [
        step.steps[0],
        step.steps[1],
        `When drills feel repetitive, run a timed **Practice exam** from the menu before another long lesson block.`,
      ],
    };
  }

  return step;
}

function computeNextStep(s: PersistedState): NextStep {
  const firstIncomplete = ORDERED_LESSON_IDS.find((id) => lessons[id]?.hasFullContent && !s.completedLessons.includes(id));
  if (firstIncomplete) {
    const t = lessons[firstIncomplete]?.title ?? firstIncomplete;
    if (!isLessonHandsOnComplete(firstIncomplete, s)) {
      return {
        priority: 1,
        nextAction: `Hands-on training: ${t}`,
        why: "Labs, branching simulations, and a decision scenario turn reading into skill — same lesson, deeper layer.",
        href: `/lesson/${firstIncomplete}`,
        buttonLabel: "Continue",
        steps: [
          `Open **${t}** and scroll to **Hands-on labs** (two labs, two sims, one decision).`,
          `Complete checkpoints honestly — mock terminal is safe; real commands only on your own machine per instructions.`,
          `Then take the lesson quiz and flashcards for the same lesson (from the lesson page).`,
        ],
      };
    }
    return {
      priority: 1,
      nextAction: `Finish: ${t}`,
      why: "Next incomplete lesson in Messer order — your chain is the path.",
      href: `/lesson/${firstIncomplete}`,
      buttonLabel: "Continue",
      steps: [
        `Go to the lesson: **${t}** (video first).`,
        `Work through highlight → quick action → hands-on blocks → quiz → flashcards in order.`,
        `Check off the stepper on that lesson, then return here — **Continue** will update automatically.`,
      ],
    };
  }

  const quizAttempts = Object.values(s.questionStats).reduce((a, st) => a + st.c + st.w, 0);
  const hasPracticeSignal = s.completedLessons.length > 0 || quizAttempts > 0 || s.missedJournal.length > 0;

  const profile = buildLearningProfile(s);
  if (profile.thinkingAlerts.length && hasPracticeSignal) {
    const why0 = profile.thinkingAlerts[0]!.replace(/\*\*/g, "");
    return {
      priority: 2,
      nextAction: "Fix an active misconception",
      why: why0,
      href: "/weak",
      buttonLabel: "Repair weak areas",
      steps: [
        "Open the weak list — re-quiz the lesson tied to the alert.",
        "Write a two-column compare (term A vs term B) in Brain Book before the next quiz.",
        "Return home; Continue refreshes when the pattern stabilizes.",
      ],
    };
  }

  const weaks = Object.entries(s.domainScore).sort((a, b) => a[1] - b[1])[0];
  /** Avoid sending brand-new users to “weak” before they have any lesson/quiz history (default domain scores are low). */
  if (weaks && weaks[1] < 50 && hasPracticeSignal) {
    return {
      priority: 2,
      nextAction: `Strengthen Domain ${weaks[0]}`,
      why: "That domain is below 50 — the composite exam will test it.",
      href: "/weak",
      buttonLabel: "Open weak areas",
      steps: [
        `Run quizzes tied to **Domain ${weaks[0]}** (weak list).`,
        `Turn misses into cards and re-quiz the same pattern until it’s boring.`,
        `Re-check the coach — next priority may move to a boss or polish.`,
      ],
    };
  }

  const lastMiss = s.missedJournal[s.missedJournal.length - 1];
  if (lastMiss) {
    const missLessonTitle = lessons[lastMiss.lessonId]?.title ?? lastMiss.lessonId;
    return {
      priority: 3,
      nextAction: `Repair last miss (${missLessonTitle})`,
      why: "Your journal logged a wrong pattern — same stems come back on the exam.",
      href: `/quiz/${lastMiss.lessonId}`,
      buttonLabel: "Retake quiz",
      steps: [
        `Re-open the quiz for **${missLessonTitle}** (from the lesson page or quizzes list) and read every wrong-answer line.`,
        `Add the miss to Flashcards if prompted and say the rule once out loud.`,
        `Return Home — **Continue** refreshes when your journal looks cleaner.`,
      ],
    };
  }

  const thinNotesLesson = findLessonNeedingNotes(s);
  if (thinNotesLesson && hasPracticeSignal) {
    const t = lessons[thinNotesLesson]?.title ?? thinNotesLesson;
    return {
      priority: 3,
      nextAction: `Brain Book gap: ${t}`,
      why: "A completed lesson with zero hooks leaks on exam day — one row fixes recall.",
      href: `/lesson/${thinNotesLesson}`,
      buttonLabel: "Add one note row",
      steps: [
        `Open **${t}** → Brain Book (last block).`,
        `Save one row: topic + what it means + exam keyword from MUST highlights.`,
        `Say it out loud once, then check Continue.`,
      ],
    };
  }

  const now = Date.now();
  const due = [...s.spaced].filter((x) => x.nextReview <= now).sort((a, b) => a.nextReview - b.nextReview)[0];
  if (due) {
    return {
      priority: 4,
      nextAction: "Flashcard review (due)",
      why: "Spaced repetition says these cards are due now.",
      href: "/flashcards",
      buttonLabel: "Review flashcards",
      steps: [
        `Open **Flashcards** from the menu and clear due cards.`,
        `If you want fewer cards, narrow to one lesson via the Flashcards lesson filter.`,
        `After the stack feels lighter, tap **Continue** again on Home.`,
      ],
    };
  }

  const nextBoss = BOSS_FIGHTS.find((b) => !s.bossWins[b.id]);
  if (nextBoss) {
    return {
      priority: 5,
      nextAction: `Boss: ${nextBoss.name}`,
      why: "Mixed, exam-style practice when the linear chain has no open lesson.",
      href: `/boss/${nextBoss.id}`,
      buttonLabel: "Start boss",
      steps: [
        `Start **${nextBoss.name}** when you have energy for a focused drill.`,
        `Read each explanation — bosses train speed plus trap recognition.`,
        `Pass or rerun; your weak-area list updates from the scorecard.`,
      ],
    };
  }

  return {
    priority: 1,
    nextAction: "Review or polish",
    why: "Routine maintenance: confirm notes, re-quiz, or pick a goal zone.",
    href: "/roadmap",
    buttonLabel: "Open roadmap",
    steps: [
      "Scan the roadmap for anything not fully checked.",
      "Re-run a quiz in your lowest comfort domain (dashboard).",
      "Optional: **30-min session** for a full Messer + practice block.",
    ],
  };
}

export function getNextStepCoachingLines(step: NextStep): { todaysBestMove: string; why: string; doThisNext: [string, string, string] } {
  return {
    todaysBestMove: step.nextAction,
    why: step.why,
    doThisNext: step.steps,
  };
}
