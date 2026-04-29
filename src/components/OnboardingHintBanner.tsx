import { Link } from "react-router-dom";

type Props = {
  onDismiss: () => void;
};

/** Soft orientation — user is never trapped away from the dashboard. */
export default function OnboardingHintBanner({ onDismiss }: Props) {
  return (
    <div
      className="rounded-xl border border-amber-700/45 bg-amber-950/25 px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
      role="region"
      aria-label="Getting started"
    >
      <p className="text-sm text-amber-100/95 leading-relaxed">
        <span className="font-semibold text-amber-50">New here?</span>{" "}
        <Link to="/start-here" className="text-amber-200 underline font-medium">
          2-minute tour
        </Link>{" "}
        — or tap <strong className="font-medium text-amber-50">Do this next</strong> on Home. You can&apos;t take a wrong step.
      </p>
      <button type="button" className="btn-ghost text-sm shrink-0 min-h-[44px] touch-manipulation" onClick={onDismiss}>
        Got it
      </button>
    </div>
  );
}
