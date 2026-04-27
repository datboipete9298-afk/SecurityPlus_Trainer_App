import { useSearchParams, Link } from "react-router-dom";
import { useState, useMemo, useRef } from "react";
import { cardsForLesson, flashcards } from "../data/flashcards";
import { lessons } from "../data/lessons";
import { useProgress } from "../context/ProgressContext";
import type { Flashcard } from "../types";
import FeedbackPanel from "../components/FeedbackPanel";
import { buildFlashcardTutorFeedback } from "../core/feedbackEngine";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import NextActionCard from "../components/NextActionCard";
import AITutorPanel from "../components/AITutorPanel";
import StatusBadge from "../components/StatusBadge";
import { buildFlashcardStreakIdentityLine, buildWeakCardRepairIdentityLine } from "../utils/identityPersonalization";

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
            <PageHeader
              title="Flashcards"
              purpose="No cards in this deck yet. Add content in data files, convert quiz misses, or open flashcards from a lesson that has cards."
            />
            <SectionCard title="Empty deck" subtitle="Try one of these">
              <div className="flex flex-col gap-2">
                <Link to="/weak" className="btn w-full text-center">
                  Weak areas → flashcards from misses
                </Link>
                <Link to="/practice-exams" className="btn-ghost w-full text-center">
                  Practice exams
                </Link>
                <Link to="/roadmap" className="btn-ghost w-full text-center">
                  Lesson path
                </Link>
              </div>
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
          <PageHeader
            title="Flashcards"
            purpose="Spaced repetition in the browser: harder cards surface more often. Flip, recall, then grade yourself honestly — the schedule updates automatically."
            badge={
              <div className="flex flex-wrap gap-1 justify-end">
                {dueNow > 0 && <StatusBadge tone="warn">{dueNow} due</StatusBadge>}
                <StatusBadge tone="neutral">{list.length} in deck</StatusBadge>
              </div>
            }
          />

          <SectionCard
            title="How this deck works"
            subtitle="Spaced repetition + mistake heat"
          >
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
          </SectionCard>

          {!grade && (
            <>
              <button
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
                Continue to next card
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

          <NextActionCard label="Next step" description="Pair cards with a quiz or weak-area pass for the same topic.">
            <div className="flex flex-col sm:flex-row gap-2">
              <Link to="/" className="btn-ghost w-full sm:w-auto text-center">
                Dashboard
              </Link>
              <Link to={nextStep.href} className="btn w-full sm:w-auto text-center">
                {nextStep.buttonLabel} →
              </Link>
            </div>
          </NextActionCard>
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
