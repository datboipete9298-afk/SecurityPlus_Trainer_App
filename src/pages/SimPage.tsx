import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { simulations } from "../data/simulations";
import { getLabsForLesson } from "../data/labs";
import { useProgress } from "../context/ProgressContext";
import ContinueButton from "../components/ContinueButton";
import FlowPrimaryStrip from "../components/FlowPrimaryStrip";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";

export default function SimPage() {
  const { grantXp, nextStep, bumpStudyResume } = useProgress();
  const [search] = useSearchParams();
  const lesson = search.get("lesson");
  const lessonLabs = lesson ? getLabsForLesson(lesson) : [];
  const sim = simulations[0]!;
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [picked, setPicked] = useState(false);
  const st = sim.steps[step];
  const finished = step >= sim.steps.length;

  useEffect(() => {
    bumpStudyResume({ simLessonId: lesson || null });
  }, [lesson, bumpStudyResume]);

  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        <FlowPrimaryStrip>
          <ContinueButton step={nextStep} className="btn w-full text-center min-h-[48px] touch-manipulation" coachHint="" />
        </FlowPrimaryStrip>
        <PageHeader
          title="Labs & simulations"
          purpose="Tap a choice below, or follow Next step above."
          badge={<StatusBadge tone="accent">Local only</StatusBadge>}
        />
        <details className="rounded-xl border border-slate-700 bg-slate-900/35 text-sm text-slate-400 group">
          <summary className="cursor-pointer list-none px-3 py-2.5 touch-manipulation min-h-[44px] flex items-center [&::-webkit-details-marker]:hidden">
            <span className="mr-2 text-slate-600 group-open:text-emerald-400">▸</span>
            What this page is
          </summary>
          <p className="px-3 pb-3 border-t border-slate-800 pt-3 leading-relaxed">
            Optional local drill. Link a lesson from the menu to see that section&apos;s hands-on checklist.
          </p>
        </details>

        {lesson && lessonLabs.length > 0 && (
          <SectionCard
            title={`Hands-on for this lesson (${lesson})`}
            subtitle="Steps from your catalog — run on your own machine. Resume on the dashboard remembers this lesson link only, not which checklist line you last did (offline labs have no step sync)."
          >
            <div className="space-y-4">
              {lessonLabs.map((lab) => (
                <div key={lab.id} className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 text-sm">
                  <p className="text-white font-medium">{lab.title}</p>
                  <p className="text-slate-400 mt-1">{lab.description}</p>
                  {lab.safeWarning && <p className="text-amber-200/80 text-xs mt-2">{lab.safeWarning}</p>}
                  <ol className="list-decimal list-inside text-slate-300 mt-2 space-y-1">
                    {lab.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
            <Link to={`/lesson/${lesson}`} className="btn-ghost w-full sm:w-auto text-center inline-block mt-4 min-h-[44px] touch-manipulation">
              ← Back to lesson
            </Link>
          </SectionCard>
        )}

        <SectionCard title={sim.title} subtitle="Starter simulation — tap a choice to continue">
          <p className="text-slate-300 text-sm leading-relaxed">{sim.intro}</p>

          {!finished && st && (
            <div className="card mt-4 border-slate-700">
              <p className="text-white font-medium">{st.prompt}</p>
              {feedback && <p className="text-xs text-amber-200/80 mt-2 whitespace-pre-line">{feedback}</p>}
              <ul className="mt-3 space-y-2">
                {st.choices.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      disabled={picked}
                      onClick={() => {
                        if (picked) return;
                        setPicked(true);
                        setFeedback(c.why);
                        if (c.isBest) grantXp(15);
                        setTimeout(() => {
                          setFeedback(null);
                          setPicked(false);
                          setStep((s) => s + 1);
                        }, 1200);
                      }}
                      className="w-full text-left btn-ghost text-sm min-h-[48px] touch-manipulation rounded-xl"
                    >
                      {c.text}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {finished && (
            <p className="text-emerald-400 mt-4 text-sm font-medium">Module complete — nice work. Run it again anytime or return to your lesson for the quiz.</p>
          )}
        </SectionCard>

        <details className="rounded-xl border border-slate-700 bg-slate-900/35 group">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm text-slate-400 touch-manipulation min-h-[44px] flex items-center [&::-webkit-details-marker]:hidden">
            <span className="mr-2 text-slate-600 group-open:text-emerald-400">▸</span>
            Other links
          </summary>
          <div className="px-3 pb-3 border-t border-slate-800 pt-3 flex flex-col gap-2">
            {lesson ? (
              <Link to={`/lesson/${lesson}`} className="btn-ghost w-full text-center min-h-[44px] touch-manipulation border border-slate-600">
                Continue lesson
              </Link>
            ) : (
              <Link to="/roadmap" className="btn-ghost w-full text-center min-h-[44px] touch-manipulation border border-slate-600">
                Lesson path
              </Link>
            )}
          </div>
        </details>
      </div>
    </AppShell>
  );
}
