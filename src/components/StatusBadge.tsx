import type { ReactNode } from "react";

type Tone = "neutral" | "ok" | "warn" | "accent";

const tones: Record<Tone, string> = {
  neutral: "border-slate-600 bg-slate-800/60 text-slate-200",
  ok: "border-emerald-700/60 bg-emerald-950/30 text-emerald-200/90",
  warn: "border-amber-700/60 bg-amber-950/25 text-amber-100/90",
  accent: "border-cyan-700/60 bg-cyan-950/25 text-cyan-100/90",
};

type Props = { children: ReactNode; tone?: Tone; className?: string };

export default function StatusBadge({ children, tone = "neutral", className }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tones[tone]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
