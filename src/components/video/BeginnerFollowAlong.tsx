import { useMemo } from "react";
import type { Lesson } from "../../types";

export type FollowAlongSuggestion = {
  /** Pre-built one-line "main idea" text (≤180 chars) — derived from `lesson.writeDown` / `simpleExplanation`. */
  mainIdea: string;
  /** First exam keyword from `instantRecognition` or first highlight `term`. */
  keyword: string;
  /** First trap pair → "A vs B". Empty string if no traps in the lesson. */
  trap: string;
};

type Props = {
  lesson: Lesson;
  /** Fires when the user taps "Use this" — VideoStudyMode wires this to its inputs. */
  onUseThis: (s: FollowAlongSuggestion) => void;
  /** Optional dim background when the user has already filled the inputs from a prior tap. */
  alreadyApplied?: boolean;
};

function firstSentence(s: string, max = 180): string {
  const t = (s ?? "").trim();
  if (!t) return "";
  // Cut at first period or 180 chars, whichever comes first.
  const dot = t.indexOf(". ");
  const head = dot > 0 ? t.slice(0, dot + 1) : t;
  return head.length > max ? head.slice(0, max - 1) + "…" : head;
}

/**
 * Beginner follow-along strip.
 *
 * Reduces "what do I write?" paralysis by showing:
 *   1. What Messer is teaching (one-sentence explanation, sourced from `simpleExplanation`)
 *   2. Turn it into this (the exact note line they should consider, sourced from `writeDown`)
 *   3. One-tap "Use this" — fills the existing fusion-note inputs
 *   4. Visual chips: 🟡 keyword · 🔵 important · 🔴 trap — sourced from existing lesson data
 *
 * No new lesson content is invented; everything comes from the lesson's existing
 * `simpleExplanation`, `writeDown`, `highlightRules`, `instantRecognition`, `examTraps`.
 */
export default function BeginnerFollowAlong({ lesson, onUseThis, alreadyApplied }: Props) {
  const suggestion = useMemo<FollowAlongSuggestion>(() => {
    const writeDownLine = firstSentence(lesson.writeDown ?? "");
    const fallback = firstSentence(lesson.simpleExplanation ?? "");
    const mainIdea = (writeDownLine || fallback || `Topic: ${lesson.title}`).slice(0, 240);
    const keywordFromIr = lesson.instantRecognition?.[0]?.keyword ?? "";
    const keywordFromHighlights = lesson.highlightRules?.find((h) => h.importance === "must")?.term
      ?? lesson.highlightRules?.[0]?.term
      ?? "";
    const keyword = (keywordFromIr || keywordFromHighlights || "").replace(/\*\*/g, "").trim();
    const trapPair = lesson.examTraps?.[0];
    const trap = trapPair ? `${trapPair.a} vs ${trapPair.b}` : "";
    return { mainIdea, keyword, trap };
  }, [lesson]);

  const importantTerms = useMemo(
    () =>
      (lesson.highlightRules ?? [])
        .filter((h) => h.importance === "must")
        .map((h) => h.term.replace(/\*\*/g, ""))
        .slice(0, 3),
    [lesson.highlightRules],
  );

  const examKeywords = useMemo(
    () =>
      (lesson.instantRecognition ?? [])
        .map((r) => r.keyword.replace(/\*\*/g, ""))
        .slice(0, 3),
    [lesson.instantRecognition],
  );

  const trapPairs = useMemo(
    () =>
      (lesson.examTraps ?? [])
        .slice(0, 2)
        .map((t) => `${t.a} ↔ ${t.b}`),
    [lesson.examTraps],
  );

  return (
    <section
      className="rounded-xl border border-emerald-700/50 bg-emerald-950/25 px-3 py-3 space-y-3"
      aria-label="Beginner follow-along"
    >
      <p className="text-[11px] text-emerald-100/90 leading-snug">
        <strong className="text-emerald-50">Don’t think about studying.</strong> Just follow the steps.
      </p>

      <div className="space-y-1.5 border-t border-emerald-900/40 pt-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/95">
          Pause here · 5 seconds
        </p>
        <p className="text-sm text-slate-100 leading-relaxed">
          {firstSentence(lesson.simpleExplanation, 220) || "This section is one block of the SY0-701 exam path."}
        </p>
      </div>

      <div className="space-y-1.5 border-t border-emerald-900/40 pt-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200/95">
          Write this now
        </p>
        <p className="text-sm text-white leading-relaxed font-medium">
          {suggestion.mainIdea}
        </p>
        {suggestion.keyword && (
          <p className="text-xs text-slate-300">
            <span className="text-amber-200/90 font-semibold">This is key:</span>{" "}
            <strong className="text-amber-200">{suggestion.keyword}</strong>
            {suggestion.trap && (
              <>
                {" · "}Don’t mix up: <strong className="text-rose-200/95">{suggestion.trap}</strong>
              </>
            )}
          </p>
        )}
      </div>

      <button
        type="button"
        className="btn w-full text-sm min-h-[44px] touch-manipulation"
        onClick={() => onUseThis(suggestion)}
        aria-label="Write this — fills the note below"
      >
        {alreadyApplied ? "Write this again ↓" : "Write this ↓"}
      </button>

      <p className="text-[10px] text-emerald-200/75 text-center leading-snug">
        Then edit it below in your own words. Next part of the video unlocks after you save.
      </p>

      {(importantTerms.length > 0 || examKeywords.length > 0 || trapPairs.length > 0) && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-emerald-900/40">
          {importantTerms.map((t) => (
            <span
              key={`imp-${t}`}
              className="inline-flex items-center gap-1 rounded-full border border-cyan-700/55 bg-cyan-950/40 px-2 py-0.5 text-[10px] font-medium text-cyan-100"
              title="Important — likely to appear on the exam"
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              {t}
            </span>
          ))}
          {examKeywords.map((t) => (
            <span
              key={`kw-${t}`}
              className="inline-flex items-center gap-1 rounded-full border border-amber-700/55 bg-amber-950/35 px-2 py-0.5 text-[10px] font-medium text-amber-100"
              title="Exam keyword trigger"
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              {t}
            </span>
          ))}
          {trapPairs.map((p) => (
            <span
              key={`trap-${p}`}
              className="inline-flex items-center gap-1 rounded-full border border-rose-700/45 bg-rose-950/30 px-2 py-0.5 text-[10px] font-medium text-rose-100/95"
              title="Common mix-up — read carefully"
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-rose-300" />
              {p}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
