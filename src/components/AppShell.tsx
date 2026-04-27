import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Shared vertical rhythm for pages (keeps spacing consistent with AI panel + sticky footer). */
export default function AppShell({ children, className }: Props) {
  return <div className={className ?? "space-y-6"}>{children}</div>;
}
