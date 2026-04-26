import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { lessons } from "../data/lessons";
import { allQuestions } from "../data/quizzes";
import { flashcards } from "../data/flashcards";
import { labs } from "../data/labs";
import { SECTION_ORDER } from "../data/sectionOrder";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2)
      return { lessons: [] as string[], qu: [] as import("../types").QuizQuestion[], fc: [] as import("../types").Flashcard[], lab: [] as import("../types").Lab[], sec: [] as { id: string; label: string; domain: string }[] };
    const L = Object.values(lessons).filter(
      (l) =>
        l.title.toLowerCase().includes(s) ||
        l.simpleExplanation.toLowerCase().includes(s) ||
        l.writeDown.toLowerCase().includes(s)
    );
    const Q = allQuestions()
      .filter((x) => x.text.toLowerCase().includes(s) || x.examKeyword.toLowerCase().includes(s))
      .slice(0, 8);
    const F = flashcards
      .filter((c) => c.front.toLowerCase().includes(s) || c.back.toLowerCase().includes(s))
      .slice(0, 8);
    const Lab = labs.filter((l) => l.title.toLowerCase().includes(s) || l.description.toLowerCase().includes(s));
    const sec = SECTION_ORDER.filter((x) => x.label.toLowerCase().includes(s));
    return { lessons: L.map((l) => l.id), qu: Q, fc: F, lab: Lab, sec };
  }, [q]);

  return (
    <div>
      <h1 className="h1">Search</h1>
      <input
        className="w-full max-w-md mt-4 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2"
        placeholder="Term, port, attack, control…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {q.length >= 2 && (
        <div className="mt-6 space-y-4 text-sm">
          {results.sec.length > 0 && (
            <div>
              <h2 className="text-emerald-400 font-bold">Roadmap</h2>
              <ul>
                {results.sec.map((x) => (
                  <li key={x.id}>
                    <Link to={`/lesson/${x.id}`} className="text-slate-200 hover:underline">
                      {x.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {results.lessons.length > 0 && (
            <div>
              <h2 className="text-emerald-400 font-bold">Loaded lessons</h2>
              {results.lessons.map((id) => (
                <Link key={id} to={`/lesson/${id}`} className="block text-slate-300">
                  {lessons[id]?.title}
                </Link>
              ))}
            </div>
          )}
          {results.qu.length > 0 && (
            <div>
              <h2 className="text-emerald-400 font-bold">Questions</h2>
              {results.qu.map((x) => (
                <p key={x.id} className="text-slate-400 border-b border-slate-800 py-1">
                  {x.text.slice(0, 100)}…
                  <Link to={`/quiz/${x.lessonId}`} className="text-emerald-400 ml-2">
                    quiz
                  </Link>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
