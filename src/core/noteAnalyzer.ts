import type { BrainNote } from "../types";
import type { Lesson } from "../types";
export type NoteAnalysisSeverity = "ok" | "warn" | "block";

export type NoteAnalysis = {
  severity: NoteAnalysisSeverity;
  messages: string[];
  /** True if note looks pasted / not in learner voice */
  likelyCopied: boolean;
  missingKeywords: string[];
};

const MAX_TOPIC = 120;
const MAX_FIELD = 600;
const MIN_MEANINGFUL = 12;

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function overlapWithLesson(text: string, lessonBlob: string): number {
  const words = new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4),
  );
  const lessonWords = new Set(
    lessonBlob
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4),
  );
  let n = 0;
  for (const w of words) {
    if (lessonWords.has(w)) n++;
  }
  return words.size ? n / words.size : 0;
}

/**
 * Analyzes a draft Brain Book row before save. Heuristic only — not ML.
 */
export function analyzeDraftNote(
  draft: Pick<BrainNote, "topic" | "whatItMeans" | "examKeyword" | "memory" | "realLife" | "whyMatters">,
  lesson: Lesson,
): NoteAnalysis {
  const messages: string[] = [];
  const lessonBlob = [
    lesson.simpleExplanation,
    lesson.writeDown,
    ...lesson.instantRecognition.map((x) => x.keyword + " " + x.answer),
  ].join(" ");

  const combined = [draft.topic, draft.whatItMeans, draft.examKeyword, draft.memory, draft.realLife, draft.whyMatters].join(" ");

  if (wordCount(combined) > 220) {
    messages.push("Too much detail — simplify. The exam rewards one-line hooks, not transcripts.");
  }

  if (draft.whatItMeans.trim().length > 0 && draft.whatItMeans.trim().length < MIN_MEANINGFUL) {
    messages.push("“What it means” is too vague — add one clear sentence tying idea to an exam trigger.");
  }

  if (!draft.examKeyword.trim()) {
    messages.push("Missing exam keyword — add at least one trigger you expect in a stem.");
  }

  const expectedKw = lesson.instantRecognition.map((x) => x.keyword.toLowerCase());
  const lowCombined = combined.toLowerCase();
  const missingKeywords = expectedKw.filter((k) => k.length > 2 && !lowCombined.includes(k));
  if (missingKeywords.length >= 4 && expectedKw.length >= 3) {
    messages.push(`Missing key concepts — weave at least one of: ${expectedKw.slice(0, 3).join(", ")}.`);
  }

  const copiedRatio = overlapWithLesson(combined, lessonBlob);
  const likelyCopied = combined.length > 80 && copiedRatio > 0.55 && wordCount(combined) > 40;
  if (likelyCopied) {
    messages.push("This reads like copied lesson text — rewrite in your own words or you don’t understand it yet.");
  }

  if (draft.topic.length > MAX_TOPIC || draft.whatItMeans.length > MAX_FIELD) {
    messages.push("Trim the note — long notes rarely get reviewed. Split into two rows tomorrow if needed.");
  }

  let severity: NoteAnalysisSeverity = "ok";
  if (messages.some((m) => m.includes("don’t understand") || m.includes("copied"))) severity = "block";
  else if (messages.length >= 2) severity = "warn";
  else if (messages.length === 1) severity = "warn";

  return {
    severity,
    messages: messages.length ? messages : ["Looks focused — save when it still makes sense tomorrow."],
    likelyCopied,
    missingKeywords: missingKeywords.slice(0, 5),
  };
}

/** Session / lesson limit coach copy */
export function overNotingMessage(lessonCount: number, sessionCount: number): string | null {
  if (lessonCount >= 5) return "You are over-noting for this lesson (5 max). Focus on key ideas only — merge or edit an existing row.";
  if (sessionCount >= 10) return "You are over-noting this session (10 max). Stop adding — review what you already saved.";
  return null;
}

/** Bundles heuristic analysis + fields to send to `/api/ai/note-feedback` from the client. */
export function buildNoteAiAugment(
  draft: Pick<BrainNote, "topic" | "whatItMeans" | "examKeyword" | "memory" | "realLife" | "whyMatters">,
  lesson: Lesson,
) {
  const heuristic = analyzeDraftNote(draft, lesson);
  return {
    heuristic,
    apiNoteContext: {
      draft,
      heuristicMessages: heuristic.messages,
      missingKeywords: heuristic.missingKeywords,
      likelyCopied: heuristic.likelyCopied,
      severity: heuristic.severity,
    },
  };
}
