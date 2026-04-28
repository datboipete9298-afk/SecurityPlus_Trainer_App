/**
 * Video + note fusion — pause prompts (YouTube timecode optional, future use).
 */
export type PausePromptItem = {
  /** Short label for UI / analytics (e.g. "Pause 1", "Drill · keyword") */
  label: string;
  prompt: string;
  /** Reserved: start offset in seconds for deep-linking the embed — not implemented yet */
  optionalTimecode?: number;
};
