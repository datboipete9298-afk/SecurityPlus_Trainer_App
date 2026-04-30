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
    <header className="space-y-4 pb-1 border-b border-slate-800/60">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {eyebrow && <p className="text-ds-micro text-slate-500 uppercase tracking-wider mb-1.5">{eyebrow}</p>}
          <h1 className="h1">{title}</h1>
          {purpose && <p className="text-ds-body text-slate-400 max-w-2xl mt-2 leading-relaxed">{purpose}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">{badge}{actions}</div>
      </div>
      {children}
    </header>
  );
}
