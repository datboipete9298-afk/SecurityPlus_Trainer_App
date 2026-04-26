import { useSearchParams, Link } from "react-router-dom";
import { useState } from "react";
import { cardsForLesson, flashcards } from "../data/flashcards";
import { useProgress } from "../context/ProgressContext";
import { useMemo } from "react";

export default function FlashcardsPage() {
  const [sp] = useSearchParams();
  const lesson = sp.get("lesson");
  const { pushSpaced, state, patchLessonProgress } = useProgress();
  const list = useMemo(() => {
    const base = lesson ? cardsForLesson(lesson) : flashcards;
    const mine = state.userFlashcards.filter((c) => !lesson || c.lessonId === lesson);
    const ids = new Set(base.map((c) => c.id));
    const add = mine.filter((c) => !ids.has(c.id));
    return [...base, ...add];
  }, [lesson, state.userFlashcards]);
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  if (!list.length) return <p className="p-4">No cards</p>;
  const c = list[Math.min(i, list.length - 1)]!;

  return (
    <div className="max-w-xl">
      <h1 className="h1">Flashcards</h1>
      <p className="text-slate-500 text-sm mb-4">
        Spaced: {state.spaced.length} cards scheduled · {state.userFlashcards.length} from mistakes · tap to flip
      </p>
      <button
        type="button"
        onClick={() => setFlip(!flip)}
        className="card w-full min-h-[200px] flex flex-col justify-center text-center cursor-pointer hover:border-emerald-700"
      >
        <p className="text-slate-500 text-xs mb-1">{c.cardType}</p>
        <p className="text-xl text-white font-medium px-2">{flip ? c.back : c.front}</p>
        {c.trap && flip && <p className="text-amber-300 text-sm mt-3">Trap: {c.trap}</p>}
      </button>
      <div className="flex gap-2 mt-4 justify-center">
        {flip && (
          <>
            <button type="button" className="btn" onClick={() => { pushSpaced(c.id, true); setFlip(false); setI((x) => (x + 1) % list.length); }}>
              Got it
            </button>
            <button type="button" className="btn-ghost" onClick={() => { pushSpaced(c.id, false); setFlip(false); setI((x) => (x + 1) % list.length); }}>
              Again
            </button>
          </>
        )}
      </div>
      <p className="text-center text-slate-500 text-xs mt-4">
        {i + 1} / {list.length}
      </p>
      {lesson && (
        <div className="mt-3 text-center">
          <button
            type="button"
            className="btn text-sm"
            onClick={() => patchLessonProgress(lesson, { flashcardsReviewed: true })}
          >
            I reviewed flashcards for this lesson
          </button>
        </div>
      )}
      <Link to="/" className="text-emerald-400 text-sm block text-center mt-4">
        Dashboard
      </Link>
    </div>
  );
}
