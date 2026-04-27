import type { ReactNode } from "react";

type Props = {
  title: string;
  purpose?: ReactNode;
  eyebrow?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

export default function PageHeader({ title, purpose, eyebrow, badge, actions, children }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{eyebrow}</p>}
          <h1 className="h1">{title}</h1>
          {purpose && <p className="text-slate-400 text-sm max-w-2xl mt-1.5 leading-relaxed">{purpose}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {badge}
          {actions}
        </div>
      </div>
      {children}
    </div>
  );
}
