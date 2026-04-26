import type { Lesson } from "../types";

export type ExamIntelligence = {
  examTrap: string;
  whatTheyAsk: string;
  howToPick: string;
  triggerKeywords: string[];
};

export function getExamIntelligence(L: Lesson): ExamIntelligence {
  const trap = L.examTraps[0];
  const kw = L.instantRecognition.map((i) => i.keyword).slice(0, 6);
  return {
    examTrap: trap ? `Do not confuse **${trap.a}** with **${trap.b}** on scenario stems.` : "Sound-alike answers: pick the control that matches the *layer* the story stressed (not the first “security” word).",
    whatTheyAsk: `Stems that hide the right answer in **${L.title.split(" ")[0] ?? "this"}** context — look for who failed, what broke, and which objective (CIA, least privilege, etc.) is in play.`,
    howToPick: "Eliminate two answers for wrong *category* → pick the *best* remaining match to the last sentence of the story → sanity-check against an exam keyword you wrote in Brain Book.",
    triggerKeywords: kw.length ? kw : ["best", "BEST", "MOST", "LEAST", "governance", "detective", "compensating control"],
  };
}
