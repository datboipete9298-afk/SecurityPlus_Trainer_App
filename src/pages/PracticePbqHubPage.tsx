import { Link } from "react-router-dom";
import { useEffect } from "react";
import { PBQ_SCENARIOS } from "../data/pbqCatalog";
import { useProgress } from "../context/ProgressContext";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import NextActionCard from "../components/NextActionCard";
import StatusBadge from "../components/StatusBadge";

const FIRST_PBQ = PBQ_SCENARIOS[0];

export default function PracticePbqHubPage() {
  const { bumpStudyResume } = useProgress();
  useEffect(() => {
    bumpStudyResume({ pbqHub: true });
  }, [bumpStudyResume]);

  return (
    <AppShell>
      <div className="max-w-3xl space-y-8">
        <div
          className="rounded-xl border border-amber-600/35 bg-amber-950/35 px-4 py-3 sm:px-5 sm:py-4"
          role="status"
        >
          <p className="text-sm font-semibold text-amber-100">These are hands-on exam-style questions</p>
          <p className="text-sm text-amber-200/85 mt-1 leading-relaxed">
            You reorder and match steps like performance-based items on the real Security+ exam — practice for how the test asks you to think, not a copy of any proprietary screen.
          </p>
          {FIRST_PBQ && (
            <Link
              to={`/pbq/${FIRST_PBQ.id}`}
              className="btn mt-3 w-full sm:w-auto text-center text-sm"
            >
              Try 1 now (takes 2–3 min) → {FIRST_PBQ.title}
            </Link>
          )}
        </div>

        <PageHeader
          title="PBQ-style skill labs"
          purpose="Original ordering and matching drills — not copies of proprietary exam screens. Each lab teaches exam thinking: correct process order, trade-offs, and what CompTIA rewards."
          badge={<StatusBadge tone="accent">Skill drills</StatusBadge>}
        />

        <SectionCard title="How to use these" subtitle="Safe, local practice">
          <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5 leading-relaxed">
            <li>Open a lab, read the scenario, then reorder steps with Up/Down.</li>
            <li>Lock your answer once you&apos;re confident — misses still nudge weak-area signals for that domain.</li>
            <li>Retry until the pattern sticks; pair with lesson quizzes in the same domain.</li>
          </ul>
        </SectionCard>

        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Labs</h2>
          <ul className="space-y-3">
            {PBQ_SCENARIOS.map((p) => (
              <li key={p.id} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-medium text-white">{p.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">Domain {p.domain}</p>
                </div>
                <Link to={`/pbq/${p.id}`} className="btn w-full sm:w-auto text-center shrink-0">
                  Open lab
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <NextActionCard label="Suggested next" description="After a lab, run a practice exam in study mode or review weak areas.">
          <div className="flex flex-col sm:flex-row gap-2">
            <Link to="/practice-exams" className="btn w-full sm:w-auto text-center">
              Practice exams →
            </Link>
            <Link to="/weak" className="btn-ghost w-full sm:w-auto text-center">
              Weak areas
            </Link>
          </div>
        </NextActionCard>
      </div>
    </AppShell>
  );
}
