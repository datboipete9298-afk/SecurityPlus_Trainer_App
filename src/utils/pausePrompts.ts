import type { Lesson } from "../types";
import type { PausePromptItem } from "../types/videoFusion";
import { getBeginnerContent } from "./beginnerLayer";

const EXTRA_DRILLS: PausePromptItem[] = [
  { label: "Drill · main idea", prompt: "What is the main idea?" },
  { label: "Drill · exam keyword", prompt: "What keyword would the exam use?" },
  { label: "Drill · confusion", prompt: "What would this be confused with?" },
  { label: "Drill · example", prompt: "What is one real example?" },
];

/**
 * Future-ready pause list: coach strings from data + fixed drills.
 * `optionalTimecode` reserved for per-prompt YouTube sync (not populated yet).
 */
export function buildPausePromptPoolFromLesson(lesson: Lesson): PausePromptItem[] {
  const b = getBeginnerContent(lesson);
  const fromData: PausePromptItem[] = b.pausePrompts.map((prompt, i) => ({
    label: `Pause ${i + 1}`,
    prompt,
  }));
  return [...fromData, ...EXTRA_DRILLS];
}
