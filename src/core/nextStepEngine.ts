import { BOSS_FIGHTS } from "../data/bossFights";
import { lessons, ORDERED_LESSON_IDS } from "../data/lessons";
import type { PersistedState } from "../utils/storage";

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
  const firstIncomplete = ORDERED_LESSON_IDS.find((id) => lessons[id]?.hasFullContent && !s.completedLessons.includes(id));
  if (firstIncomplete) {
    const t = lessons[firstIncomplete]?.title ?? firstIncomplete;
    return {
      priority: 1,
      nextAction: `Finish: ${t}`,
      why: "Next incomplete lesson in Messer order — your chain is the path.",
      href: `/lesson/${firstIncomplete}`,
      buttonLabel: "Continue",
      steps: [
        `Go to the lesson: **${t}** (video first).`,
        `Complete highlight → quick action → quiz → flashcards for that lesson id.`,
        `Check off the stepper, then return here for the next **Continue** destination.`,
      ],
    };
  }

  const quizAttempts = Object.values(s.questionStats).reduce((a, st) => a + st.c + st.w, 0);
  const hasPracticeSignal = s.completedLessons.length > 0 || quizAttempts > 0 || s.missedJournal.length > 0;

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
    return {
      priority: 3,
      nextAction: `Repair last miss (${lastMiss.lessonId})`,
      why: "Your journal logged a wrong pattern — same stems come back on the exam.",
      href: `/quiz/${lastMiss.lessonId}`,
      buttonLabel: "Retake quiz",
      steps: [
        `Re-quiz **/quiz/${lastMiss.lessonId}** and read *every* wrong-answer line.`,
        `Add the mistake card in Flashcards and say the rule in one breath.`,
        `If green, the coach will reprioritize automatically.`,
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
        `Open **Flashcards** and clear due cards (Again / Got it).`,
        `If a lesson is weak, add **?lesson=** in the query for focus.`,
        `After the stack, return to the dashboard for the next **Continue** target.`,
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
        `Start **${nextBoss.name}** when you have a focused block.`,
        `Read every explanation — bosses train speed + trap recognition.`,
        `Pass or re-run; coach updates weak areas from results.`,
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
