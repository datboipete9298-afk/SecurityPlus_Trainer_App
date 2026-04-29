import { useSearchParams, Link } from "react-router-dom";
import { useState, useMemo, useRef, useEffect } from "react";
import { cardsForLesson, flashcards } from "../data/flashcards";
import { lessons } from "../data/lessons";
import { useProgress } from "../context/ProgressContext";
import type { Flashcard } from "../types";
import FeedbackPanel from "../components/FeedbackPanel";
import { buildFlashcardTutorFeedback } from "../core/feedbackEngine";
import AppShell from "../components/AppShell";
import FlowPrimaryStrip from "../components/FlowPrimaryStrip";
import ContinueButton from "../components/ContinueButton";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import AITutorPanel from "../components/AITutorPanel";
import StatusBadge from "../components/StatusBadge";
import { buildFlashcardStreakIdentityLine, buildWeakCardRepairIdentityLine } from "../utils/identityPersonalization";
import CoachLine from "../components/CoachLine";

export default function FlashcardsPage() {
  const [sp] = useSearchParams();
  const lesson = sp.get("lesson");
  const { pushSpaced, state, patchLessonProgress, nextStep, takeExtensionIdentity, readiness, bumpStudyResume } = useProgress();

  const dueNow = useMemo(
    () => state.spaced.filter((s) => s.nextReview <= Date.now()).length,
    [state.spaced],
  );

  const weakAreas = useMemo(
    () =>
      (["1", "2", "3", "4", "5"] as const)
        .filter((d) => (state.domainScore[d] ?? 50) < 47)
        .map((d) => `Domain ${d}`),
    [state.domainScore],
  );

  const list = useMemo(() => {
    const base = lesson ? cardsForLesson(lesson) : flashcards;
    const mine = state.userFlashcards.filter((c) => !lesson || c.lessonId === lesson);
    const ids = new Set(base.map((c) => c.id));
    const add = mine.filter((c) => !ids.has(c.id));
    return [...base, ...add].sort((a, b) => {
      const wa = state.cardWrongStreak[a.id] ?? 0;
      const wb = state.cardWrongStreak[b.id] ?? 0;
      if (wb !== wa) return wb - wa;
      return a.id.localeCompare(b.id);
    });
  }, [lesson, state.userFlashcards, state.cardWrongStreak]);

  useEffect(() => {
    bumpStudyResume({ flashcardsLesson: lesson });
  }, [lesson, bumpStudyResume]);

  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const [grade, setGrade] = useState<{ card: Flashcard; gotRight: boolean } | null>(null);
  const [flashcardIdentityAside, setFlashcardIdentityAside] = useState<string | null>(null);
  const sessionRightStreakRef = useRef(0);

  const cardTopicHint = (card: Flashcard) => {
    const trap = card.trap?.trim();
    if (trap) return trap;
    if (lesson && lessons[lesson]?.title) return lessons[lesson]!.title;
    return "this deck";
  };

  if (!list.length) {
    return (
      <AppShell>
        <div className="max-w-5xl lg:grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-6 items-start">
          <div className="min-w-0 space-y-6 max-w-xl">
            <FlowPrimaryStrip>
              <Link to="/weak" className="btn w-full text-center min-h-[48px] touch-manipulation justify-center">
              Open weak spots hub →
            </Link>
            </FlowPrimaryStrip>
            <PageHeader
              title="Flashcards"
              purpose="No cards match this filter yet — that is normal early on. Open flashcards from a lesson that has cards, clear the lesson filter, or turn recent quiz misses into cards from Progress."
            />
            <SectionCard title="Empty deck" subtitle="Secondary paths">
              <details className="group">
                <summary className="cursor-pointer text-sm text-slate-400 touch-manipulation min-h-[44px] list-none [&::-webkit-details-marker]:hidden">
                  ▸ Other ways to get cards
                </summary>
                <div className="flex flex-col gap-2 mt-3">
                  <Link to="/practice-exams" className="btn-ghost w-full text-center">
                    Practice exams
                  </Link>
                  <Link to="/roadmap" className="btn-ghost w-full text-center">
                    Lesson path
                  </Link>
                </div>
              </details>
            </SectionCard>
          </div>
        <AITutorPanel
          className="lg:sticky lg:top-4 order-first lg:order-none"
          context={{
            surface: "lesson",
            lesson: lesson && lessons[lesson] ? { id: lesson, title: lessons[lesson]!.title } : undefined,
            weakAreas,
            userProgress: { deck: "empty" },
            coachLines: ["Add cards from missed questions or study a lesson with flashcard data."],
          }}
        />
        </div>
      </AppShell>
    );
  }

  const c = list[Math.min(i, list.length - 1)]!;

  const advanceAfterFeedback = () => {
    if (!grade) return;
    if (grade.gotRight) sessionRightStreakRef.current += 1;
    else sessionRightStreakRef.current = 0;
    pushSpaced(grade.card.id, grade.gotRight);
    bumpStudyResume({ flashcardsLesson: lesson });
    setFlashcardIdentityAside(null);
    setGrade(null);
    setFlip(false);
    setI((x) => (x + 1) % list.length);
  };

  const lessonTitle = lesson ? `Lesson ${lesson}` : "All sections";

  return (
    <AppShell>
      <div className="max-w-5xl lg:grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-6 items-start">
        <div className="min-w-0 space-y-6 max-w-xl">
          <FlowPrimaryStrip>
            <ContinueButton step={nextStep} className="btn w-full text-center min-h-[48px] touch-manipulation justify-center" coachHint="" />
          </FlowPrimaryStrip>
          <PageHeader
            title="Flashcards"
            purpose={lesson ? `Session started — Lesson ${lesson}. Flip the card when you're ready.` : "Deck ready — flip the card when you're ready."}
            badge={
              <div className="flex flex-wrap gap-1 justify-end">
                {dueNow > 0 && <StatusBadge tone="warn">{dueNow} due</StatusBadge>}
                <StatusBadge tone="neutral">{list.length} in deck</StatusBadge>
              </div>
            }
          />
          <CoachLine k="flashcardsBoring" />

          <details className="rounded-2xl border border-slate-700 bg-slate-900/30 group overflow-hidden">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-300 touch-manipulation min-h-[48px] flex items-center [&::-webkit-details-marker]:hidden">
              <span className="text-slate-500 mr-2 group-open:text-emerald-400">▸</span>
              How this deck works
            </summary>
            <div className="px-4 pb-4 border-t border-slate-800/80 pt-3">
              <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5 leading-relaxed">
                <li>
                  <strong className="text-white">Due:</strong> {dueNow} card{dueNow === 1 ? "" : "s"} past their review time (of {state.spaced.length} scheduled).
                </li>
                <li>
                  <strong className="text-white">Order:</strong> cards with more wrong streaks float up so you repair weak hooks first.
                </li>
                <li>
                  <strong className="text-white">Got it vs Again:</strong> like <em>Good</em> vs <em>Again</em> in other apps — &quot;Got it&quot; pushes the card out; &quot;Again&quot; brings it back sooner.
                </li>
                <li>
                  <strong className="text-white">Mistake cards:</strong> {state.userFlashcards.length} from your missed-question journal and quizzes.
                </li>
              </ul>
              {lesson && <p className="text-xs text-cyan-200/80 mt-2">Filtered to: {lessonTitle}</p>}
            </div>
          </details>

          {!grade && (
            <>
              <button
                id="flashcards-card"
                type="button"
                onClick={() => setFlip(!flip)}
                className="card w-full min-h-[200px] flex flex-col justify-center text-center cursor-pointer hover:border-emerald-700 transition-transform active:scale-[0.99] touch-manipulation"
              >
                <p className="text-slate-500 text-xs mb-1">{c.cardType}</p>
                <p className="text-xl text-white font-medium px-2 break-words">{flip ? c.back : c.front}</p>
                {c.trap && flip && <p className="text-amber-300 text-sm mt-3 px-2">Trap: {c.trap}</p>}
              </button>
              <div className="flex flex-col sm:flex-row gap-2 mt-4 justify-center">
                {flip && (
                  <>
                    <button
                      type="button"
                      className="btn w-full sm:flex-1 min-h-[48px]"
                      onClick={() => {
                        const wrongBefore = state.cardWrongStreak[c.id] ?? 0;
                        let aside: string | null = null;
                        const hint = cardTopicHint(c);
                        if (wrongBefore >= 2) {
                          if (takeExtensionIdentity("weak_card_repair")) {
                            aside = buildWeakCardRepairIdentityLine(hint, readiness.label, c.id);
                          }
                        } else if (sessionRightStreakRef.current >= 5) {
                          if (takeExtensionIdentity("flashcard_streak")) {
                            aside = buildFlashcardStreakIdentityLine(hint, readiness.label, c.id);
                          }
                        }
                        setFlashcardIdentityAside(aside);
                        setGrade({ card: c, gotRight: true });
                      }}
                    >
                      Got it
                    </button>
                    <button
                      type="button"
                      className="btn-ghost w-full sm:flex-1 min-h-[48px]"
                      onClick={() => {
                        sessionRightStreakRef.current = 0;
                        setFlashcardIdentityAside(null);
                        setGrade({ card: c, gotRight: false });
                      }}
                    >
                      Again
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {grade && (
            <div className="space-y-4">
              <FeedbackPanel feedback={buildFlashcardTutorFeedback(grade.card.front, grade.card.back, grade.gotRight, grade.card.trap)} />
              {flashcardIdentityAside && (
                <p className="text-xs text-slate-400/95 leading-relaxed border-l border-slate-600/80 pl-3">{flashcardIdentityAside}</p>
              )}
              <p className="text-xs text-slate-500">You control pacing — continue when the hook sticks.</p>
              <button type="button" className="btn w-full min-h-[48px]" onClick={advanceAfterFeedback}>
                Next flashcard →
              </button>
              <button
                type="button"
                className="btn-ghost text-sm w-full min-h-[44px]"
                onClick={() => {
                  setGrade(null);
                  setFlip(true);
                }}
              >
                Flip back &amp; review once more
              </button>
            </div>
          )}

          <p className="text-center text-slate-500 text-xs">
            {i + 1} / {list.length}
          </p>

          {lesson && (
            <div className="text-center">
              <button
                type="button"
                className="btn text-sm w-full sm:w-auto"
                onClick={() => patchLessonProgress(lesson, { flashcardsReviewed: true })}
              >
                I reviewed flashcards for this lesson
              </button>
            </div>
          )}

          <details className="rounded-xl border border-slate-700 bg-slate-900/30 group mt-6">
            <summary className="cursor-pointer list-none px-4 py-3 text-xs text-slate-500 touch-manipulation min-h-[44px] flex items-center [&::-webkit-details-marker]:hidden">
              <span className="mr-2 text-slate-600 group-open:text-emerald-400">▸</span>
              Leave flashcards · other paths
            </summary>
            <div className="px-4 pb-4 pt-1 border-t border-slate-800 space-y-2">
              <Link to="/" className="btn-ghost w-full text-center text-sm min-h-[44px] justify-center inline-flex items-center touch-manipulation">
                Home
              </Link>
              <Link to={nextStep.href} className="btn-ghost w-full text-center text-sm min-h-[44px] justify-center inline-flex items-center touch-manipulation">
                {nextStep.buttonLabel} (coach queue)
              </Link>
            </div>
          </details>
        </div>

        <AITutorPanel
          className="lg:sticky lg:top-4 order-first lg:order-none"
          context={{
            surface: "lesson",
            lesson: lesson && lessons[lesson] ? { id: lesson, title: lessons[lesson]!.title } : undefined,
            weakAreas,
            userProgress: { cardFront: c.front.slice(0, 120), lessonFilter: lesson, cardType: c.cardType },
            coachLines: [`Card type: ${c.cardType}`, c.trap ? `Trap: ${c.trap}` : ""].filter(Boolean) as string[],
          }}
        />
      </div>
    </AppShell>
  );
}
