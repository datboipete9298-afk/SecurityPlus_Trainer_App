import type { DomainId, Lesson } from "../types";

type HI = { term: string; meaning: string; importance: "must" | "should" | "good" };

export function makeLesson(
  id: string,
  title: string,
  domain: DomainId,
  b: {
    videoFocus: [string, string, string];
    simpleExplanation: string;
    highlightRules: HI[];
    writeDown: string;
    examTraps: { a: string; b: string }[];
    instantRecognition: { keyword: string; answer: string }[];
    threeSecondRecall: [string, string, string];
    quickAction: string;
    miniQuizIntro: string;
    teachBackPrompt: string;
    endChecks?: [string, string, string];
  }
): Lesson {
  return {
    id,
    title,
    domain,
    order: 0,
    hasFullContent: true,
    videoFocus: [...b.videoFocus],
    simpleExplanation: b.simpleExplanation,
    highlightRules: b.highlightRules,
    writeDown: b.writeDown,
    examTraps: b.examTraps,
    instantRecognition: b.instantRecognition,
    threeSecondRecall: [...b.threeSecondRecall],
    quickAction: b.quickAction,
    miniQuizIntro: b.miniQuizIntro,
    teachBackPrompt: b.teachBackPrompt,
    endChecks: b.endChecks
      ? [...b.endChecks]
      : [
          "Can I explain the core idea in one breath?",
          "Do I have one exam keyword and one wrong-answer story?",
          "Can I point to the layer (people/process/tech) the stem is testing?",
        ],
  };
}

export function genericOutlineLesson(id: string, label: string, domain: DomainId): Lesson {
  const t = label.replace(/^\d+\.\d+\s+/, "");
  return makeLesson(id, label, domain, {
    videoFocus: [
      `Stems that reference ${t} and the “best” answer pattern`,
      "How this objective nests under its domain (architecture / ops / GRC)",
      "Sound-alike traps: similar controls or technologies in wrong context",
    ],
    simpleExplanation: `This section anchors **${t}** in your Messer-ordered run. On the exam, extract *who* has the problem, *what* failed, and *where* the fix applies (people, process, or technology). Match the *primary* job-to-be-done—don’t pick the first security word you recognize.`,
    highlightRules: [
      { term: t, meaning: "Define in one line; add one work example and one exam keyword.", importance: "must" },
      { term: "Scenario axis", meaning: "Governance vs technical vs physical—name the layer under stress.", importance: "must" },
      { term: "Least privilege", meaning: "When in doubt, narrow access, verify identity, and log the decision.", importance: "should" },
    ],
    writeDown: `1) ${t} one-liner. 2) One risk. 3) One control or process fix. 4) One keyword CompTIA loves.`,
    examTraps: [
      { a: "Similar technologies", b: "Wrong category (e.g. encryption vs authentication)" },
      { a: "“Always/never” answers", b: "Balanced or conditional wording is often correct" },
    ],
    instantRecognition: [
      { keyword: "policy, program, board", answer: "Often governance" },
      { keyword: "SIEM, log, alert", answer: "Often detective / operations" },
    ],
    threeSecondRecall: ["Name", "One risk", "One fix"],
    quickAction: `List 3 flashcard fronts for ${t}, then check against your notes.`,
    miniQuizIntro: "Scenario + definition mix for this section.",
    teachBackPrompt: `Teach ${t} to a peer in 30 seconds: definition, one story, one trap answer.`,
  });
}
