import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { lessons, getNextSectionId } from "../data/lessons";
import { useProgress, getNotesTodayCount } from "../context/ProgressContext";
import { isLessonUnlocked } from "../utils/adaptive";
import { questionsByLesson } from "../data/quizzes";
import { getLabsForLesson } from "../data/labs";
import type { BrainNote } from "../types";
import { isLessonProgressComplete } from "../types/beginner";
import VideoEmbed from "../components/VideoEmbed";
import LessonStepper from "../components/LessonStepper";
import ExplainSimplerModal from "../components/ExplainSimplerModal";
import GlossaryChips from "../components/GlossaryChips";
import ContinueButton from "../components/ContinueButton";
import { getVideoForLesson } from "../data/videoMap";
import { PROFESSOR_MESSER_COURSE_INDEX, PROFESSOR_MESSER_YOUTUBE_PLAYLIST } from "../data/videoConstants";
import { getBeginnerContent } from "../utils/beginnerLayer";
import { getHighlightBuckets } from "../utils/highlightBuckets";
import { getExamIntelligence } from "../utils/examIntelFromLesson";
import { LESSON_BLOCK_ORDER } from "../core/learningFlow";

export default function LessonPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { state, addNote, completeLesson, saveTeachBack, touchStreak, skipLab, patchLessonProgress, setBeginnerMode, seedHighlightMemory, nextStep } = useProgress();
  const t0 = useRef(Date.now());
  const L = id ? lessons[id] : null;
  const [note, setNote] = useState({
    topic: "",
    whatItMeans: "",
    realLife: "",
    whyMatters: "",
    examKeyword: "",
    memory: "",
  });
  const [teach, setTeach] = useState("");
  const [explainOpen, setExplainOpen] = useState(false);
  const [flowStep, setFlowStep] = useState(1);
  const [showFullDetail, setShowFullDetail] = useState(false);

  useEffect(() => {
    t0.current = Date.now();
    touchStreak();
  }, [id, touchStreak]);

  useEffect(() => {
    if (id) setTeach(state.teachBack[id] ?? "");
  }, [id, state.teachBack]);

  useEffect(() => {
    setFlowStep(1);
  }, [id]);

  if (!id) return <p>Missing id</p>;
  if (!L || !L.hasFullContent) {
    return (
      <div className="card max-w-2xl">
        <h1 className="h1">Section {id}</h1>
        <p className="text-slate-400 mt-2">
          Rich lesson not loaded yet. Add a full entry to <code className="text-amber-300">src/data/lessons.ts</code> (copy shape from 1-1) or use{" "}
          <Link to="/import" className="text-emerald-400 underline">
            Import
          </Link>{" "}
          to merge JSON. Follow Messer order — do not skip IDs.
        </p>
        <Link to="/roadmap" className="btn mt-4 inline-block">
          Back
        </Link>
      </div>
    );
  }

  if (!isLessonUnlocked(id, state)) {
    return (
      <div className="card">
        <h1 className="h1">Locked</h1>
        <p className="text-slate-400">Complete the previous lesson in the MVP chain first (Messer order).</p>
        <Link to="/roadmap" className="btn mt-3">
          Roadmap
        </Link>
      </div>
    );
  }

  const quizCount = questionsByLesson(id).length;
  const labs = getLabsForLesson(id);
  const notes = state.notes.filter((n) => n.lessonId === id);
  const notesToday = getNotesTodayCount(state.notes);

  const saveBrain = () => {
    if (notes.length >= 5) return;
    if (!note.topic.trim()) return;
    const b: BrainNote = {
      id: crypto.randomUUID(),
      lessonId: id,
      ...note,
      created: Date.now(),
    };
    addNote(b);
    setNote({ topic: "", whatItMeans: "", realLife: "", whyMatters: "", examKeyword: "", memory: "" });
  };

  const nxt = getNextSectionId(id) ?? null;
  const vMeta = getVideoForLesson(id);
  const beg = getBeginnerContent(L);
  const hb = getHighlightBuckets(L);
  const examI = getExamIntelligence(L);
  const lp = state.lessonProgress[id] ?? {};
  const teachOk = teach.trim().length >= 20 || (state.teachBack[id]?.trim().length ?? 0) >= 20;
  const canMark = isLessonProgressComplete({ ...lp, teachBackDone: teachOk }, { hasLab: labs.length > 0 });
  const glossarySource = `${L.title} ${L.simpleExplanation} ${beg.plainEnglish}`;

  const runComplete = (force: boolean) => {
    if (!id) return;
    if (!canMark && !force) return;
    if (!canMark && force) {
      if (!window.confirm("The stepper is not all checked. Mark this lesson complete anyway? (You can still review later.)")) {
        return;
      }
    }
    const sec = Math.max(1, Math.round((Date.now() - t0.current) / 1000));
    saveTeachBack(id, teach);
    patchLessonProgress(id, { teachBackDone: teachOk });
    completeLesson(id, sec);
    nav("/");
  };

  const block = (k: (typeof LESSON_BLOCK_ORDER)[number]["key"]) => LESSON_BLOCK_ORDER.find((b) => b.key === k);
  const titleOf = (k: (typeof LESSON_BLOCK_ORDER)[number]["key"]) => {
    const b0 = block(k);
    return b0 ? `${b0.emoji} ${b0.title}` : k;
  };

  const StepSection = ({ stepIndex, k, className, children }: { stepIndex: number; k: (typeof LESSON_BLOCK_ORDER)[number]["key"]; className?: string; children: React.ReactNode }) => {
    const t = titleOf(k);
    const locked = state.beginnerMode && stepIndex > flowStep;
    if (locked) {
      return (
        <div className="card border-slate-700 border-dashed">
          <p className="text-slate-500 text-sm">
            Step {stepIndex}: {t}
          </p>
          <p className="text-amber-200/80 text-xs mt-1">Finish step {flowStep} first (beginner mode keeps the path linear).</p>
        </div>
      );
    }
    return (
      <section className={className ?? "card border-slate-800"} data-step={stepIndex}>
        <h2 className="text-cyan-300 font-bold text-sm uppercase">{t}</h2>
        {state.beginnerMode && stepIndex === 1 && <p className="text-[10px] text-amber-200/80 mt-1">Do this first — the rest of the page builds on the video.</p>}
        {state.beginnerMode && stepIndex === 2 && <p className="text-[10px] text-amber-200/80 mt-1">This is important — 3–8 exam hooks, not whole paragraphs. You’ll see this on the exam as recognition questions.</p>}
        {state.beginnerMode && (stepIndex === 7 || stepIndex === 8) && (
          <p className="text-[10px] text-amber-200/80 mt-1">Test → recall. Same order for every lesson.</p>
        )}
        {state.beginnerMode && stepIndex === 9 && <p className="text-[10px] text-amber-200/80 mt-1">You’ll see this on the exam as trap / best-answer phrasing.</p>}
        {children}
        {state.beginnerMode && stepIndex < 10 && stepIndex === flowStep && (
          <button type="button" className="btn mt-4 w-full" onClick={() => setFlowStep((s) => Math.max(s, stepIndex + 1))}>
            Done with this step — show next
          </button>
        )}
      </section>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-slate-500">
          Domain {L.domain}
          {L.sectionNumber && (
            <span className="ml-2 text-slate-500">
              · Section <span className="text-slate-300">{L.sectionNumber}</span>
            </span>
          )}
        </p>
        <h1 className="h1 mt-0">{L.title}</h1>
        <p className="text-slate-500 text-sm mt-1">Follow the numbered blocks in order. One path: video → notes → understand → test → remember.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ContinueButton step={nextStep} />
        </div>
      </div>

      <div className="card border-slate-700 text-sm text-slate-300">
        <h2 className="text-xs text-slate-500 uppercase tracking-wide">This lesson, in six answers</h2>
        <ul className="mt-2 space-y-1.5 list-none text-slate-200">
          <li>
            <span className="text-emerald-300 font-medium">What do I watch? </span>
            The Messer video in step 1 (pause when you add highlights in step 2).
          </li>
          <li>
            <span className="text-emerald-300 font-medium">What do I highlight? </span>
            3–8 short hooks from the MUST/GOOD/SKIP list — not paragraphs.
          </li>
          <li>
            <span className="text-emerald-300 font-medium">What do I write? </span>
            At least one Brain Book row in the last block; optional extra fields in full mode.
          </li>
          <li>
            <span className="text-emerald-300 font-medium">What do I do? </span>
            {L.quickAction}
          </li>
          <li>
            <span className="text-emerald-300 font-medium">What do I quiz? </span>
            {quizCount} mini-quiz questions tagged to this section ({id}).
          </li>
          <li>
            <span className="text-emerald-300 font-medium">What do I review next? </span>
            Flashcards for this lesson, then mark complete — the home screen Continue picks your next best move.
          </li>
        </ul>
      </div>

      <LessonStepper
        lessonId={id}
        p={lp}
        hasLab={labs.length > 0}
        labDone={lp.labDone}
        nextHref={nxt && lessons[nxt!] ? `/lesson/${nxt}` : undefined}
      />

      {state.beginnerMode && (
        <div className="card border-violet-800/40 bg-violet-950/20 text-sm text-slate-300">
          <strong className="text-violet-200">Beginner mode on:</strong> you unlock the next block only after you click “Done with this step” on the
          current one. Turn it off in the sidebar to see the full page at once.
        </div>
      )}

      <StepSection stepIndex={1} k="watch" className="card border-cyan-800/30">
        <div className="flex flex-wrap items-start justify-between gap-2 mt-2">
          <p className="text-xs text-slate-500">Step 1 of 10</p>
          {vMeta.needsVideoUrl && (
            <span className="text-xs font-semibold rounded-full bg-amber-900/50 text-amber-200 px-2 py-0.5 border border-amber-600/50">Video link needs verification</span>
          )}
        </div>
        {vMeta.estimatedWatchTimeMin != null && <p className="text-xs text-slate-500 mt-1">~{vMeta.estimatedWatchTimeMin} min (estimate)</p>}
        <VideoEmbed embedUrl={vMeta.embedUrl} title={vMeta.videoTitle} />
        <ul className="mt-3 space-y-1 text-sm text-slate-300 list-disc pl-4">
          <li>Skim the first 2 minutes, then watch with pauses for highlights in step 2.</li>
          {!state.beginnerMode && (
            <>
              <li>Pause and highlight 3–8 terms in your notes in step 2.</li>
              <li>Optional: one Brain Book row in the final block.</li>
            </>
          )}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/session" className="btn-ghost text-sm">
            30-min session
          </Link>
          <button
            type="button"
            className="btn text-sm"
            onClick={() => {
              patchLessonProgress(id, { videoWatched: true, videoWatchedAt: Date.now() });
            }}
          >
            Mark video watched
          </button>
          {vMeta.youtubeUrl && (
            <a href={vMeta.youtubeUrl} className="btn-ghost text-sm" target="_blank" rel="noreferrer">
              YouTube
            </a>
          )}
          {vMeta.professorMesserPageUrl && (
            <a href={vMeta.professorMesserPageUrl} className="btn-ghost text-sm" target="_blank" rel="noreferrer">
              Messer page
            </a>
          )}
          <a href={PROFESSOR_MESSER_COURSE_INDEX} className="btn-ghost text-sm" target="_blank" rel="noreferrer">
            Course index
          </a>
          <a href={PROFESSOR_MESSER_YOUTUBE_PLAYLIST} className="btn-ghost text-sm" target="_blank" rel="noreferrer">
            Playlist
          </a>
          <Link to={`/watch/${id}`} className="btn-ghost text-sm">
            Guided watch
          </Link>
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() => {
              setBeginnerMode(true);
              setExplainOpen(true);
            }}
          >
            Need simpler explanation
          </button>
        </div>
        <GlossaryChips textSource={glossarySource} />
      </StepSection>

      <StepSection stepIndex={2} k="highlight" className="card border-amber-800/40">
        <p className="text-xs text-slate-500 mt-2">Max 3–8 hooks in your notes — terms and short lines only.</p>
        <div className="mt-4 grid md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border border-rose-800/50 bg-rose-950/20 p-3">
            <p className="text-rose-300 font-semibold text-xs uppercase mb-2">MUST</p>
            <ul className="space-y-2 text-slate-200 list-disc pl-4">
              {hb.mustHighlight.map((x, i) => (
                <li key={i} className="text-xs leading-snug">
                  {x.replace(/\*\*/g, "")}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/15 p-3">
            <p className="text-emerald-300 font-semibold text-xs uppercase mb-2">GOOD</p>
            <ul className="space-y-2 text-slate-200 list-disc pl-4">
              {hb.shouldHighlight.map((x, i) => (
                <li key={i} className="text-xs leading-snug">
                  {x.replace(/\*\*/g, "")}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-600/50 bg-slate-900/40 p-3">
            <p className="text-slate-400 font-semibold text-xs uppercase mb-2">SKIP</p>
            <ul className="space-y-2 text-slate-400 list-disc pl-4">
              {hb.skipHighlight.map((x, i) => (
                <li key={i} className="text-xs leading-snug">
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn text-sm"
            onClick={() => {
              patchLessonProgress(id, { highlightsDone: true });
              seedHighlightMemory(id);
            }}
          >
            I finished my highlights
          </button>
          <button type="button" className="btn-ghost text-sm" onClick={() => setExplainOpen(true)}>
            Explain simpler
          </button>
        </div>
        <GlossaryChips textSource={glossarySource} />
      </StepSection>

      <ExplainSimplerModal open={explainOpen} onClose={() => setExplainOpen(false)} b={beg} />

      <StepSection stepIndex={3} k="understand" className="card border-emerald-800/30">
        {state.beginnerMode ? (
          <div className="mt-2 space-y-2 text-slate-300 text-sm">
            <p>
              <span className="text-emerald-200 font-semibold">ELI5: </span>
              {beg.plainEnglish}
            </p>
            <p>
              <span className="text-emerald-200 font-semibold">One line: </span>
              {beg.oneSentenceSummary}
            </p>
            <p className="text-xs text-slate-500">Listen for: {beg.watchFor.slice(0, 2).join(" · ")}</p>
            <div className="pt-1">
              <button
                type="button"
                className="text-xs text-cyan-300 hover:underline"
                onClick={() => setShowFullDetail((v) => !v)}
              >
                {showFullDetail ? "Hide full detail" : "Show full detail (more examples & glossary help)"}
              </button>
            </div>
            {showFullDetail && (
              <div className="mt-2 space-y-2 border-t border-slate-800 pt-3 text-slate-300">
                <p>
                  <span className="text-emerald-200 font-semibold">Why it matters: </span>
                  {beg.whyItMatters}
                </p>
                <p>
                  <span className="text-emerald-200 font-semibold">Don’t overthink: </span>
                  {beg.dontOverthink}
                </p>
                <p>
                  <span className="text-emerald-200 font-semibold">Real-life: </span>
                  {beg.realLifeExample}
                </p>
                <p className="text-xs text-slate-500">Glossary and term chips: use the same lesson’s chips below the video block.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-2 space-y-4">
            <p className="text-slate-300 text-sm">
              <span className="text-emerald-200 font-semibold">Plain English: </span>
              {beg.plainEnglish}
            </p>
            <p className="text-slate-300 text-sm">{L.simpleExplanation}</p>
            <div>
              <h3 className="text-xs text-slate-500 font-semibold">Video — what to listen for</h3>
              <ul className="list-disc list-inside mt-1 text-slate-200 text-sm space-y-1">
                {L.videoFocus.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
            <p className="text-slate-300 text-sm">
              <span className="text-emerald-200 font-semibold">Why it matters: </span>
              {beg.whyItMatters}
            </p>
          </div>
        )}
      </StepSection>

      <StepSection stepIndex={4} k="hackers" className="card border-rose-900/40">
        <p className="text-slate-300 text-sm mt-2">
          <span className="text-rose-200 font-semibold">Why hackers care: </span>
          {L.examTraps[0]
            ? `Attacks that exploit ${L.examTraps[0]!.a} or confuse ${L.examTraps[0]!.b} show up on the test.`
            : "The exam tests whether you can spot the real control gap, not a product name."}
        </p>
        <h3 className="text-xs text-rose-300/90 font-semibold mt-3">Don&apos;t confuse (exam)</h3>
        <ul className="mt-2 space-y-1">
          {L.examTraps.map((t, i) => (
            <li key={i} className="text-slate-300 text-sm">
              <strong className="text-amber-300/90">{t.a}</strong> vs <strong className="text-cyan-300/90">{t.b}</strong>
            </li>
          ))}
        </ul>
        {!state.beginnerMode && (
          <p className="text-slate-400 text-sm mt-3">
            <span className="text-cyan-300 font-medium">ELI10: </span>
            {beg.explainLike10}
          </p>
        )}
      </StepSection>

      <StepSection stepIndex={5} k="defend" className="card">
        <p className="text-slate-300 text-sm mt-2">
          <span className="text-cyan-200 font-semibold">How it&apos;s defended: </span>
          {L.writeDown.split(".")[0] ?? "Layer controls, log, and verify critical changes."}
        </p>
        <h3 className="text-xs text-slate-500 font-semibold mt-3">What to write down (read-only here — you save a row in the last block)</h3>
        <p className="text-slate-300 text-sm mt-1">{L.writeDown}</p>
        <h3 className="text-xs text-slate-500 font-semibold mt-3">Instant recognition</h3>
        <ul className="mt-2 text-sm">
          {L.instantRecognition.map((x, i) => (
            <li key={i} className="border-b border-slate-800 py-1">
              <span className="text-slate-500">&quot;{x.keyword}&quot;</span> → <span className="text-white">{x.answer}</span>
            </li>
          ))}
        </ul>
        <h3 className="text-xs text-slate-500 font-semibold mt-2">3-second recall</h3>
        <ul className="list-disc list-inside text-slate-200 text-sm">
          {L.threeSecondRecall.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </StepSection>

      <StepSection stepIndex={6} k="handsOn" className="card border-cyan-900/40">
        <p className="text-slate-200 text-sm mt-2">{L.quickAction}</p>
        <button type="button" className="btn-ghost text-xs mt-2" onClick={() => patchLessonProgress(id, { quickActionDone: true })}>
          I did the quick action (safe, local)
        </button>
        {labs[0] && (
          <div className="text-xs text-slate-500 mt-3 space-y-2 border-t border-slate-800 pt-3">
            <p>
              <strong className="text-slate-300">Hands-on lab in app:</strong> {labs[0]!.title} — {labs[0]!.description}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to={`/sim?lesson=${id}`} className="btn text-xs">
                Open hands-on lab steps
              </Link>
              <button type="button" className="btn text-xs" onClick={() => patchLessonProgress(id, { labDone: true })}>
                I completed the lab
              </button>
            </div>
            <button type="button" className="text-amber-400/90 underline" onClick={() => skipLab(labs[0]!.id)}>
              Skip for now (coach will remind you)
            </button>
          </div>
        )}
        {!labs[0] && (
          <p className="text-xs text-slate-500 mt-3">
            More labs: <Link to="/sim" className="text-emerald-400 underline">Simulations & hands-on</Link>
          </p>
        )}
      </StepSection>

      <StepSection stepIndex={7} k="quiz" className="card">
        <p className="text-slate-400 text-sm mt-1">Prove recognition under a little pressure — same block as the lesson id.</p>
        <div className="mt-3">
          <Link to={`/quiz/${id}`} className="btn">
            Quick quiz ({quizCount} Q)
          </Link>
        </div>
      </StepSection>

      <StepSection stepIndex={8} k="flashcards" className="card">
        <p className="text-slate-400 text-sm mt-1">Spaced recall for this section — use ?lesson= for focus.</p>
        <div className="mt-3">
          <Link to={`/flashcards?lesson=${id}`} className="btn-ghost">
            Flashcard recall (this lesson)
          </Link>
        </div>
        <p className="text-xs text-slate-500 mt-2">Wrong answers auto-add cards and update weak areas.</p>
      </StepSection>

      <StepSection stepIndex={9} k="examIntel" className="card border-rose-900/40">
        <dl className="mt-2 space-y-2 text-sm text-slate-300">
          <div>
            <dt className="text-xs text-rose-300/90 font-semibold">EXAM TRAP</dt>
            <dd>{examI.examTrap.replace(/\*\*/g, "")}</dd>
          </div>
          <div>
            <dt className="text-xs text-rose-300/90 font-semibold">WHAT THEY ASK</dt>
            <dd>{examI.whatTheyAsk.replace(/\*\*/g, "")}</dd>
          </div>
          <div>
            <dt className="text-xs text-rose-300/90 font-semibold">HOW TO PICK (FAST)</dt>
            <dd>{examI.howToPick}</dd>
          </div>
          <div>
            <dt className="text-xs text-rose-300/90 font-semibold">KEYWORD TRIGGERS</dt>
            <dd className="flex flex-wrap gap-1 mt-1">
              {examI.triggerKeywords.map((k0) => (
                <span key={k0} className="text-xs bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-amber-100/90">
                  {k0}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </StepSection>

      <StepSection stepIndex={10} k="complete" className="card border-slate-700">
        <p className="text-slate-500 text-sm mt-1">Last step: one Brain Book row, teach-back, then mark the lesson done.</p>
        <h3 className="text-sm font-semibold text-white mt-3">Brain Book</h3>
        <p className="text-slate-500 text-xs">Max 5 rows this lesson · {notesToday} / 10 today</p>
        <div className="mt-2 grid gap-2 text-sm">
          <input
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
            placeholder="Topic"
            value={note.topic}
            onChange={(e) => setNote((n) => ({ ...n, topic: e.target.value }))}
          />
          <input
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
            placeholder="What it means (simple)"
            value={note.whatItMeans}
            onChange={(e) => setNote((n) => ({ ...n, whatItMeans: e.target.value }))}
          />
          <div className="grid sm:grid-cols-2 gap-2">
            <input
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
              placeholder="Exam keyword"
              value={note.examKeyword}
              onChange={(e) => setNote((n) => ({ ...n, examKeyword: e.target.value }))}
            />
            <input
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
              placeholder="Memory trick (optional)"
              value={note.memory}
              onChange={(e) => setNote((n) => ({ ...n, memory: e.target.value }))}
            />
          </div>
          {!state.beginnerMode && (
            <>
              <input
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                placeholder="Real-life example"
                value={note.realLife}
                onChange={(e) => setNote((n) => ({ ...n, realLife: e.target.value }))}
              />
              <input
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                placeholder="Why it matters"
                value={note.whyMatters}
                onChange={(e) => setNote((n) => ({ ...n, whyMatters: e.target.value }))}
              />
            </>
          )}
          <button type="button" className="btn-ghost" disabled={notes.length >= 5 || notesToday >= 10} onClick={saveBrain}>
            Save row
          </button>
        </div>
        {notes.length > 0 && (
          <ul className="mt-2 text-xs text-slate-400 list-disc pl-4">
            {notes.map((n) => (
              <li key={n.id}>
                {n.topic} — {n.examKeyword}
              </li>
            ))}
          </ul>
        )}

        <h3 className="text-sm font-semibold text-white mt-4">Teach-back</h3>
        <textarea
          className="w-full min-h-[100px] bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm mt-1"
          placeholder="20+ chars: one breath summary + an exam keyword + one confusion to avoid"
          value={teach}
          onChange={(e) => setTeach(e.target.value)}
          onBlur={(e) => {
            if (e.target.value.trim().length >= 20) patchLessonProgress(id, { teachBackDone: true });
          }}
        />

        <h3 className="text-sm font-semibold text-white mt-4">End of section</h3>
        <ul className="list-disc pl-4 mt-1 text-slate-300 text-sm space-y-1">
          {(L.endChecks ?? [
            "Can you explain this simply (one breath)?",
            "Can you pick the right answer in ~20s on a close stem?",
            "Are your highlights 3–8 short hooks, not paragraphs?",
          ]).map((line, j) => (
            <li key={j}>{line}</li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <button
            type="button"
            className="btn"
            disabled={!canMark}
            title={
              canMark
                ? "Mark this lesson done for the course chain"
                : "Finish the stepper (watch, highlight, note row, action, optional lab, quiz, cards, teach-back) first, or use “anyway”"
            }
            onClick={() => runComplete(false)}
          >
            Mark lesson complete
          </button>
          {!canMark && (
            <button type="button" className="btn-ghost text-sm" onClick={() => runComplete(true)}>
              Mark complete anyway…
            </button>
          )}
          {nxt && lessons[nxt] ? (
            <Link to={`/lesson/${nxt}`} className="btn-ghost">
              Or next in chain: {lessons[nxt]!.title}
            </Link>
          ) : (
            <Link to="/roadmap" className="btn-ghost">
              Roadmap
            </Link>
          )}
        </div>
        <div className="mt-4">
          <p className="text-xs text-slate-500 mb-2">System pick (same as Smart Coach + Continue everywhere):</p>
          <ContinueButton step={nextStep} />
        </div>
      </StepSection>
    </div>
  );
}
