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
    <section className={`card border-slate-800/90 ${className ?? ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="text-ds-section text-white tracking-tight">{title}</h2>
          {subtitle && <p className="text-ds-helper text-slate-500 mt-1 leading-relaxed">{subtitle}</p>}
        </div>
        {headerRight}
      </div>
      {children}
    </section>
  );
}
