import type { Lesson } from "../types";
import type { BeginnerContent } from "../types/beginner";

function takeTermsFromHighlights(lesson: Lesson, max: number): string[] {
  return lesson.highlightRules.slice(0, max).map((h) => h.term);
}

export function getBeginnerContent(lesson: Lesson): BeginnerContent {
  const titleShort = lesson.title.replace(/^[\d.]+\s+/, "");
  const o = lesson.beginner;

  return {
    beginnerIntro:
      o?.beginnerIntro ??
      `This lesson is about **${titleShort}** — one block of the CompTIA Security+ (SY0-701) exam. You do not need prior security experience; follow the order on screen.`,
    prerequisiteTerms: o?.prerequisiteTerms ?? takeTermsFromHighlights(lesson, 3),
    plainEnglish: o?.plainEnglish ?? lesson.simpleExplanation,
    realLifeExample:
      o?.realLifeExample ??
      `Like locking doors *and* having a log of who came in: **${titleShort}** is about how organizations actually reduce digital risk, not about memorizing one magic product.`,
    whyItMatters:
      o?.whyItMatters ??
      "The exam tells short stories and asks for the *best* answer. If you only memorize definitions without context, the wording will sound like a trick — this page fixes that with patterns.",
    watchFor: o?.watchFor ?? lesson.videoFocus,
    pausePrompts:
      o?.pausePrompts ??
      [
        "Pause: can you name the one idea this section is *really* about?",
        "Pause: which words would the exam use to hide a wrong answer (sound-alike)?",
        "Pause: can you connect this to your own phone or work setup in one line?",
      ],
    confusingParts:
      o?.confusingParts ?? [`Similar-sounding acronyms or controls that belong to a *different* layer than this lesson.`],
    dontConfuse: o?.dontConfuse ?? lesson.examTraps,
    oneSentenceSummary: o?.oneSentenceSummary ?? `**${titleShort}**: ` + lesson.simpleExplanation.split(". ")[0] + ".",
    dontOverthink:
      o?.dontOverthink ??
      "You are not being graded on the first pass. If a word sounds heavy, write it in one line and keep moving — recognition comes with reps.",
    explainLike10:
      o?.explainLike10 ??
      `Think of this lesson as: “${titleShort} is a rule (or a tool) that helps a company protect data and stay out of avoidable legal or outage trouble.”`,
    realWorldAnalogy:
      o?.realWorldAnalogy ?? "Like safety signs and procedures in a school or workplace: some stop problems, some detect, some fix after — security works the same way at many layers.",
    examWants:
      o?.examWants ??
      "The exam wants the *right category* and the *right timing* in the story: who, what was lost, and which control *best* matches — not a random fancy word.",
    oneSentenceForExam: o?.oneSentenceForExam ?? `If you only remember one thing: ${lesson.writeDown.split(". ")[0] ?? lesson.simpleExplanation}`.slice(0, 300),
    scenarioExample: o?.scenarioExample ?? `A manager asks: “We already have a firewall, why this ${titleShort} control?” A good one-line test answer: it closes a *gap* the story is showing (the stem always tells you the missing piece).`,
  };
}
