import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
};

export default function SectionCard({ title, subtitle, children, className, headerRight }: Props) {
  return (
    <section className={`card border-slate-800 ${className ?? ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div>
          <h2 className="text-sm font-bold text-slate-100">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {headerRight}
      </div>
      {children}
    </section>
  );
}
