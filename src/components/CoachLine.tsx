import type { ReactNode } from "react";
import { COACH_COPY, type CoachCopyKey } from "../utils/coachingMicroCopy";

type Props = {
  /** Pick a known key for consistency, or pass `children` for custom moments. */
  k?: CoachCopyKey;
  children?: ReactNode;
  className?: string;
};

/**
 * Visual signature for embedded coaching: small emerald arrow + italic text.
 * Reused everywhere a coach would whisper at the moment of action.
 *
 * - Stays calm (no badge, no border).
 * - Uses `role="note"` so screen readers can group it as supplemental info.
 */
export default function CoachLine({ k, children, className = "" }: Props) {
  const text = children ?? (k ? COACH_COPY[k] : "");
  if (!text) return null;
  return (
    <p
      className={`text-[11px] text-emerald-200/85 italic leading-relaxed flex items-start gap-2 ${className}`}
      role="note"
    >
      <span aria-hidden className="text-emerald-300/95 mt-0.5 shrink-0 not-italic">
        ▸
      </span>
      <span>{text}</span>
    </p>
  );
}
