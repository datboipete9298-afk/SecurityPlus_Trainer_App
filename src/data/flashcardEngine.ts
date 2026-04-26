import type { Flashcard, Lesson } from "../types";

/** At least 5 cards per lesson: def, reverse, keyword, compare (if useful), trap (if useful). */
export function generateFlashcardsForLessons(lessons: Record<string, Lesson>): Flashcard[] {
  const out: Flashcard[] = [];
  for (const L of Object.values(lessons)) {
    if (!L.hasFullContent) continue;
    const term = L.title.replace(/^[\d.]+\s*/, "").slice(0, 80);
    out.push(
      {
        id: `fgen-${L.id}-def`,
        lessonId: L.id,
        front: `Define: ${term}`,
        back: L.simpleExplanation.slice(0, 400) + (L.simpleExplanation.length > 400 ? "…" : ""),
        cardType: "def",
      },
      {
        id: `fgen-${L.id}-rev`,
        lessonId: L.id,
        front: L.simpleExplanation.slice(0, 220) + (L.simpleExplanation.length > 220 ? "…" : ""),
        back: `Term/section: ${term}`,
        cardType: "reverse",
      },
      {
        id: `fgen-${L.id}-kw`,
        lessonId: L.id,
        front: `Exam keyword cluster for ${term}`,
        back: L.writeDown.slice(0, 350),
        cardType: "def",
      }
    );
    const c0 = L.highlightRules[0];
    const c1 = L.highlightRules[1];
    if (c0 && c1) {
      out.push({
        id: `fgen-${L.id}-cmp`,
        lessonId: L.id,
        front: `Compare: ${c0.term} vs ${c1.term}`,
        back: `${c0.meaning} | ${c1.meaning}`,
        cardType: "compare",
      });
    }
    out.push({
      id: `fgen-${L.id}-do`,
      lessonId: L.id,
      front: `Hands-on (this lesson): what do you DO?`,
      back: L.quickAction.slice(0, 400),
      cardType: "scenario",
    });
    const trap = L.examTraps[0];
    if (trap) {
      out.push({
        id: `fgen-${L.id}-trap`,
        lessonId: L.id,
        front: `Trap: do not confuse ${trap.a} with?`,
        back: `Think: ${trap.b}`,
        cardType: "trap",
        trap: `${trap.a} / ${trap.b}`,
      });
    } else {
      out.push({
        id: `fgen-${L.id}-ex`,
        lessonId: L.id,
        front: `Instant recognition (${term})`,
        back: L.instantRecognition.map((i) => `${i.keyword} → ${i.answer}`).join(" · "),
        cardType: "scenario",
      });
    }
  }
  return out;
}
