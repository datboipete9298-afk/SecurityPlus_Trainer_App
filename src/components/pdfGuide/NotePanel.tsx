import { useMemo, useState } from "react";
import type { BrainNote } from "../../types";
import { useProgress } from "../../context/ProgressContext";

type Props = {
  lessonId: string;
  writeThisDown: string;
};

export default function NotePanel({ lessonId, writeThisDown }: Props) {
  const { addNote } = useProgress();
  const [topic, setTopic] = useState("");
  const [simple, setSimple] = useState("");
  const [example, setExample] = useState("");
  const [why, setWhy] = useState("");
  const [kw, setKw] = useState("");
  const [memory, setMemory] = useState("");

  const heuristics = useMemo(() => {
    const m: string[] = [];
    const combined = `${simple} ${why} ${kw}`;
    if (simple.length > 0 && simple.length < 12) m.push("Simple meaning is very short — add one concrete clause.");
    if (kw.trim().length < 2) m.push("Add an exam keyword (the word CompTIA loves in stems).");
    if (/according to the book|as stated in the text|see page/i.test(combined)) m.push("Avoid copying textbook phrasing — rewrite in your own words.");
    if (simple.split(/\s+/).length > 40) m.push("Simple meaning looks like a paragraph — trim to 2 short lines.");
    return m;
  }, [simple, why, kw]);

  const canSave = simple.trim().length >= 3 && kw.trim().length >= 2;

  const save = () => {
    const note: BrainNote = {
      id: `pdf-note-${lessonId}-${Date.now()}`,
      lessonId,
      topic: topic.trim() || "PDF section",
      whatItMeans: simple.trim(),
      realLife: example.trim(),
      whyMatters: why.trim(),
      examKeyword: kw.trim(),
      memory: memory.trim(),
      created: Date.now(),
    };
    if (note.whatItMeans.length < 3) return;
    if (note.examKeyword.length < 2) return;
    addNote(note);
    setTopic("");
    setSimple("");
    setExample("");
    setWhy("");
    setKw("");
    setMemory("");
  };

  return (
    <section className="rounded-xl border border-emerald-800/40 bg-emerald-950/15 p-4 space-y-3">
      <h3 className="text-xs font-bold text-emerald-200 uppercase tracking-wide">Write this down (Brain Book)</h3>
      <p className="text-[11px] text-slate-500 leading-snug">
        Brain Book is <strong className="text-slate-300">your notes inside this app</strong> — not text saved into the PDF file.
      </p>
      <p className="text-xs text-slate-400">{writeThisDown}</p>
      <p className="text-[10px] text-slate-500 uppercase">
        Do not write: long paragraphs · raw PDF copy · obvious definitions without a keyword
      </p>
      <p className="text-[11px] text-cyan-200/80">
        After closing or minimizing the PDF, write the &quot;simple meaning&quot; in your own words — if you can&apos;t, you&apos;re still skimming.
      </p>
      {heuristics.length > 0 && (
        <div className="rounded-lg border border-amber-700/40 bg-amber-950/25 px-2 py-2 text-xs text-amber-100/90 space-y-1">
          <p className="font-semibold">Note coach (on-device check)</p>
          {heuristics.map((x, i) => (
            <p key={i}>• {x}</p>
          ))}
          <p className="text-[10px] text-slate-500 pt-1">Use AI tutor “Note help” for a tighter rewrite when live.</p>
        </div>
      )}
      <div className="grid gap-2 text-sm">
        <input className="rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-100" placeholder="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <input
          className="rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-100"
          placeholder="Simple meaning"
          value={simple}
          onChange={(e) => setSimple(e.target.value)}
        />
        <input
          className="rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-100"
          placeholder="Real example"
          value={example}
          onChange={(e) => setExample(e.target.value)}
        />
        <input className="rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-100" placeholder="Why it matters" value={why} onChange={(e) => setWhy(e.target.value)} />
        <input
          className="rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-100"
          placeholder="Exam keyword"
          value={kw}
          onChange={(e) => setKw(e.target.value)}
        />
        <input
          className="rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-100"
          placeholder="Memory trick"
          value={memory}
          onChange={(e) => setMemory(e.target.value)}
        />
        <button type="button" className="btn text-sm min-h-[44px] touch-manipulation" disabled={!canSave} onClick={save}>
          Save to Brain Book
        </button>
        {!canSave && simple.trim().length >= 3 && (
          <p className="text-[11px] text-amber-200/90">Add a short exam keyword (2+ characters) so this note stays searchable.</p>
        )}
      </div>
    </section>
  );
}
