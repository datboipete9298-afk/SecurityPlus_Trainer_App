import type { Lesson } from "../types";

/** Map legacy highlight rules to coach buckets (MUST / GOOD / skip). */
export function getHighlightBuckets(L: Lesson): { mustHighlight: string[]; shouldHighlight: string[]; skipHighlight: string[] } {
  const mustHighlight: string[] = [];
  const shouldHighlight: string[] = [];
  const skipHighlight: string[] = [];
  for (const h of L.highlightRules) {
    const line = h.importance === "good" ? `(Nice) **${h.term}** — ${h.meaning}` : `**${h.term}** — ${h.meaning}`;
    if (h.importance === "must") mustHighlight.push(line);
    else shouldHighlight.push(line);
  }
  skipHighlight.push(
    "Long paragraphs, story-only examples, repeated explanations the exam will not name.",
    "Copying the slide verbatim — you want hooks, not a transcript."
  );
  return { mustHighlight, shouldHighlight, skipHighlight };
}
