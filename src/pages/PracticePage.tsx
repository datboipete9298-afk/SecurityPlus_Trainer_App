import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useProgress } from "../context/ProgressContext";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import NextActionCard from "../components/NextActionCard";
import AITutorPanel from "../components/AITutorPanel";
import DailyMinimumCard from "../components/DailyMinimumCard";

export default function PracticePage() {
  const { state, nextStep, nextLesson } = useProgress();
  const weakAreas = useMemo(
    () =>
      (["1", "2", "3", "4", "5"] as const)
        .filter((d) => (state.domainScore[d] ?? 50) < 47)
        .map((d) => `Domain ${d} (${state.domainScore[d]})`),
    [state.domainScore],
  );

  return (
    <AppShell>
      <div className="max-w-5xl lg:grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-6 items-start">
        <div className="min-w-0 space-y-8 max-w-2xl">
          <PageHeader
            title="Practice"
            purpose="Test yourself, then recall: quizzes, full practice exams, flashcards, PBQ drills, and weak-area repair — same rhythm as every lesson."
          />

          <DailyMinimumCard lessonId={nextLesson ?? undefined} />

          <NextActionCard
            label="Smart Coach pick"
            description="Pick one block below. If you are unsure, use Continue — same next step as the dashboard green bar."
          >
            <Link to={nextStep.href} className="btn w-full text-center">
              {nextStep.buttonLabel} →
            </Link>
          </NextActionCard>

          <SectionCard title="Full-length practice" subtitle="Exam mode vs study mode">
            <p className="text-sm text-slate-400 mb-3">
              Exam A/B/C simulate timing discipline; study mode explains after each question. Readiness moves when you review misses.
            </p>
            <Link to="/practice-exams" className="btn w-full sm:w-auto text-center inline-block">
              Practice exams hub →
            </Link>
          </SectionCard>

          <SectionCard title="Quick tools" subtitle="Search, cards, weak domains">
            <div className="flex flex-col gap-2">
              <Link to="/flashcards" className="btn w-full text-center">
                Flashcards
              </Link>
              <Link to="/practice-exams/pbq" className="btn-ghost w-full text-center">
                PBQ-style skill labs
              </Link>
              <Link to="/search" className="btn-ghost w-full text-center">
                Search questions &amp; terms
              </Link>
              <Link to="/weak" className="btn-ghost w-full text-center">
                Weak areas
              </Link>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Missed journal: {state.missedJournal.length} · Your flashcards: {state.userFlashcards.length}
            </p>
          </SectionCard>

          <NextActionCard label="When you are done" description="Return to the dashboard or open the lesson path for the next section.">
            <div className="flex flex-col sm:flex-row gap-2">
              <Link to="/" className="btn-ghost w-full sm:w-auto text-center">
                Dashboard
              </Link>
              <Link to="/roadmap" className="btn-ghost w-full sm:w-auto text-center">
                Lesson path
              </Link>
            </div>
          </NextActionCard>
        </div>

        <AITutorPanel
          className="lg:sticky lg:top-4 order-first lg:order-none"
          context={{
            surface: "dashboard",
            weakAreas,
            userProgress: { missedJournal: state.missedJournal.length, userCards: state.userFlashcards.length },
            coachLines: [`Next system step: ${nextStep.nextAction.replace(/\*\*/g, "").slice(0, 120)}`],
          }}
        />
      </div>
    </AppShell>
  );
}
