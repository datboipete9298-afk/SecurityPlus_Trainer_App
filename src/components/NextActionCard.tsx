import type { ReactNode } from "react";

type Props = {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export default function NextActionCard({ label, description, children, className }: Props) {
  return (
    <div className={`card border-emerald-800/50 bg-emerald-950/15 ring-1 ring-emerald-900/40 ${className ?? ""}`}>
      <p className="text-xs text-emerald-200/80 uppercase tracking-wide">{label}</p>
      {description && <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">{description}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}
