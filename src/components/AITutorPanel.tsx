import { useCallback, useEffect, useMemo, useState } from "react";
import type { AiRequestMode, AiTutorResponse } from "../types/aiTutor";
import { postAi, checkAiHealth, isAiApiBaseConfigured } from "../lib/aiClient";
import { examModeAiLockedResponse, rateLimitedAiResponse, smartCoachOfflineResponse } from "../lib/aiTutorFallback";
import { enforceStructuredAiResponse, isWeakAiResponse } from "../lib/aiResponseQuality";
import { useProgress } from "../context/ProgressContext";
import StatusBadge from "./StatusBadge";

export type AITutorLessonContext = {
  id: string;
  title: string;
  sectionNumber?: string;
  domain?: string;
  mustHighlights?: string[];
  examTraps?: { a: string; b: string }[];
  instantRecognition?: { keyword: string; answer: string }[];
  noteIntelLines?: string[];
  userNoteRows?: string[];
  simpleExplanation?: string;
};

export type AITutorQuizContext = {
  stem: string;
  options: string[];
  examKeyword?: string;
  explanation?: string;
  userWasCorrect?: boolean;
  selectedLabel?: string;
  correctLabel?: string;
};

export type AITutorPanelContext = {
  surface: "lesson" | "quiz" | "lab" | "sim" | "dashboard";
  /** Messer exam while taking — blocks all AI calls */
  examAiLocked?: boolean;
  lesson?: AITutorLessonContext;
  userProgress?: Record<string, unknown>;
  weakAreas?: string[];
  quiz?: AITutorQuizContext;
  noteDraft?: Record<string, string>;
  noteHeuristic?: string[];
  lab?:
    | { objective: string; category?: string; checkpoints?: string[] }
    | {
        objective: string;
        category?: string;
        checkpoints?: string[];
        eliteLabMentor?: {
          templateId: string;
          instanceId?: string;
          submissionPhase?: "before_score" | "after_score";
          rubricBullets?: string[];
          examPrinciples?: string[];
          guidingDirective?: string;
          currentDecisionTrace?: string[];
          mistakeHints?: string[];
          lastScore?: number;
          domainCoach?: {
            label: string;
            decisionPrinciple: string;
            examTrap: string;
            prioritize: string;
            doNotOvervalue: string;
            keywords: string;
          };
          debriefAnchors?: {
            prioritizedWell?: string;
            missedFocus?: string;
          };
        };
      };
  sim?: { title: string; narrative?: string; lastChoice?: string; wasGood?: boolean };
  coachLines?: string[];
  /** Video + note fusion — Professor Messer pause loop + hooks */
  videoFusion?: {
    pausePrompt: string;
    sectionLabel: string;
    highlightTargets: string[];
  };
  /** When set (PDF guided lesson view), tutor prompts include section + user highlights */
  pdfGuide?: {
    pdfId: string;
    lessonId: string;
    sectionTitle: string;
    summary: string;
    mustHighlight: string[];
    userHighlights?: string[];
    /** True when this pdfId is present in IndexedDB (metadata on persisted state). */
    pdfFileAvailable?: boolean;
  };
};

type Msg = { role: "user" | "assistant"; text: string; structured?: AiTutorResponse };

function lessonPayload(L: AITutorLessonContext) {
  return {
    id: L.id,
    title: L.title,
    sectionNumber: L.sectionNumber,
    domain: L.domain,
    highlightMust: L.mustHighlights,
    examTraps: L.examTraps,
    instantRecognition: L.instantRecognition,
    noteIntel: L.noteIntelLines,
    savedNotes: L.userNoteRows,
    simpleExplanation: L.simpleExplanation,
  };
}

type Props = {
  context: AITutorPanelContext;
  variant?: "full" | "compact";
  className?: string;
};

type AiConnState = "checking" | "live" | "guided" | "offline";

export default function AITutorPanel({ context, variant = "full", className }: Props) {
  const { state } = useProgress();
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiConn, setAiConn] = useState<AiConnState>(() => (isAiApiBaseConfigured() ? "checking" : "offline"));
  const [isLg, setIsLg] = useState(false);
  const [mobileCoachOpen, setMobileCoachOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => {
      const lg = mq.matches;
      setIsLg(lg);
      if (lg) setMobileCoachOpen(true);
      else setMobileCoachOpen(false);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const failSafe = window.setTimeout(() => {
      if (!cancelled) setAiConn((c) => (c === "checking" ? "offline" : c));
    }, 4500);
    if (!isAiApiBaseConfigured()) {
      setAiConn("offline");
      window.clearTimeout(failSafe);
      return () => {
        cancelled = true;
        window.clearTimeout(failSafe);
      };
    }
    void checkAiHealth().then((h) => {
      if (cancelled) return;
      window.clearTimeout(failSafe);
      if (!h) {
        setAiConn("offline");
        return;
      }
      if (h.ok === true && h.hasKey === true) setAiConn("live");
      else setAiConn("guided");
    });
    return () => {
      cancelled = true;
      window.clearTimeout(failSafe);
    };
  }, []);

  const coachFallback = useCallback(() => {
    return smartCoachOfflineResponse({
      coachLines: context.coachLines,
      lessonTitle: context.lesson?.title ?? context.pdfGuide?.sectionTitle,
      sectionId: context.lesson?.id ?? context.pdfGuide?.lessonId,
      pdfSectionTitle: context.pdfGuide?.sectionTitle,
      pdfLessonId: context.pdfGuide?.lessonId,
    });
  }, [
    context.coachLines,
    context.lesson?.id,
    context.lesson?.title,
    context.pdfGuide?.lessonId,
    context.pdfGuide?.sectionTitle,
  ]);

  type TutorLayer = "live" | "fallback" | "rate_limited" | "exam_lock";

  const pushAssistant = useCallback((structured: AiTutorResponse, _layer: TutorLayer = "fallback") => {
    const text =
      `${structured.answer}\n\n` +
      (structured.keyPoints.length ? `• ${structured.keyPoints.join("\n• ")}\n\n` : "") +
      (structured.examTip ? `Exam tip: ${structured.examTip}\n\n` : "") +
      (structured.nextAction ? `Next: ${structured.nextAction}` : "");
    setMsgs((m) => [...m, { role: "assistant", text: text.trim(), structured }]);
  }, []);

  const run = useCallback(
    async (mode: AiRequestMode, userQuestion: string) => {
      if (context.examAiLocked) {
        pushAssistant(examModeAiLockedResponse(), "exam_lock");
        return;
      }
      const q = userQuestion.trim();
      if (!q && mode === "tutor") return;

      setMsgs((m) => [...m, { role: "user", text: q || `(${mode})` }]);
      setLoading(true);
      try {
        const body = {
          userQuestion: q || undefined,
          lesson: context.lesson ? lessonPayload(context.lesson) : undefined,
          userProgress: context.userProgress,
          weakAreas: context.weakAreas,
          quizContext: context.quiz,
          pdfGuideContext: context.pdfGuide
            ? {
                pdfId: context.pdfGuide.pdfId,
                lessonId: context.pdfGuide.lessonId,
                sectionTitle: context.pdfGuide.sectionTitle,
                summary: context.pdfGuide.summary,
                mustHighlight: context.pdfGuide.mustHighlight,
                userHighlights: context.pdfGuide.userHighlights,
                pdfFileAvailable: context.pdfGuide.pdfFileAvailable,
              }
            : undefined,
          noteContext:
            context.noteDraft || context.noteHeuristic
              ? { draft: context.noteDraft, heuristic: context.noteHeuristic }
              : undefined,
          labContext: context.lab
            ? { ...context.lab, sim: context.sim }
            : context.sim
              ? { simTitle: context.sim.title, narrative: context.sim.narrative, lastChoice: context.sim.lastChoice }
              : undefined,
          simpleMode: state.beginnerMode,
        };

        const outRaw = await postAi(mode, body);
        if (outRaw.answer.includes("not configured") || outRaw.answer.toLowerCase().includes("openai_api_key")) {
          pushAssistant(coachFallback(), "fallback");
        } else if (isWeakAiResponse(outRaw)) {
          pushAssistant(coachFallback(), "fallback");
        } else {
          const out = enforceStructuredAiResponse(outRaw, mode);
          pushAssistant(out, "live");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg === "rate_limited") {
          pushAssistant(rateLimitedAiResponse(), "rate_limited");
        } else if (msg === "ai_network_timeout") {
          const fb = coachFallback();
          pushAssistant(
            {
              ...fb,
              answer:
                "**Tutor request timed out** — that’s usually Wi‑Fi/VPN or the API host waking cold. Your homework still works; this is coaching only.\n\n" +
                fb.answer,
            },
            "fallback",
          );
        } else {
          const fb = coachFallback();
          pushAssistant(
            {
              ...fb,
              answer:
                "**Request didn’t finish** — still giving you the same structured offline pattern (not a blank crash).\n\n" + fb.answer,
            },
            "fallback",
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [context, coachFallback, pushAssistant, state.beginnerMode],
  );

  const quick = useMemo(
    () =>
      [
        { label: "Explain simpler", mode: "explain" as const, q: "Explain this lesson’s main idea in simpler words for a beginner." },
        { label: "Real-world example", mode: "tutor" as const, q: "Give one realistic workplace example tied to this topic." },
        { label: "What to highlight?", mode: "tutor" as const, q: "What should I highlight in my notes for this lesson (3–8 hooks)?" },
        { label: "What to write down?", mode: "tutor" as const, q: "What should I write in my Brain Book for this lesson?" },
        { label: "Quiz me", mode: "tutor" as const, q: "Ask one short Security+ style question on this topic, then give the answer in one line." },
        { label: "Summarize lesson", mode: "tutor" as const, q: "Summarize this lesson in a few tight bullets for same-day exam review." },
        { label: "Exam will ask…", mode: "tutor" as const, q: "What is CompTIA most likely to ask about this topic (stem pattern + trap)?" },
        { label: "Why wrong?", mode: "quiz-help" as const, q: "Explain why my answer is wrong and what trap I fell for." },
        { label: "Why right?", mode: "quiz-help" as const, q: "Explain why the correct answer is right using exam keywords." },
        { label: "Exam keyword", mode: "quiz-help" as const, q: "List the top exam keyword triggers for this question." },
        { label: "Similar Q", mode: "quiz-help" as const, q: "Write one new practice question in the same style (with answer)." },
        { label: "Explain trap", mode: "quiz-help" as const, q: "Explain the distractor trap and how to eliminate it fast." },
        { label: "Note help", mode: "note-feedback" as const, q: "Improve my draft note: tighter wording, exam keyword, and a memory trick." },
        { label: "I’m stuck (lab)", mode: "lab-coach" as const, q: "I’m stuck on this lab — what should I check next and why?" },
        { label: "Explain step", mode: "lab-coach" as const, q: "Explain what this step is doing in plain English." },
        { label: "Why it matters", mode: "lab-coach" as const, q: "Why does this lab/sim matter for the exam?" },
        { label: "What to notice", mode: "lab-coach" as const, q: "What should I notice in the result or UI here?" },
        { label: "On the exam", mode: "lab-coach" as const, q: "How does this show up on the Security+ exam?" },
      ] as const,
    [],
  );

  const visibleQuick = useMemo(() => {
    const labelsBySurface: Record<AITutorPanelContext["surface"], Set<string>> = {
      lesson: new Set([
        "Explain simpler",
        "Real-world example",
        "What to highlight?",
        "What to write down?",
        "Quiz me",
        "Summarize lesson",
        "Exam will ask…",
        "Note help",
        "Help me find this in my PDF",
        "Check my note",
      ]),
      quiz: new Set(["Why wrong?", "Why right?", "Exam keyword", "Similar Q", "Explain trap"]),
      lab: new Set(["I’m stuck (lab)", "Explain step", "Why it matters", "What to notice", "On the exam"]),
      sim: new Set(["I’m stuck (lab)", "Explain step", "Why it matters", "What to notice", "On the exam"]),
      dashboard: new Set(["Explain simpler", "Real-world example", "Quiz me", "Summarize lesson", "Exam will ask…"]),
    };
    const videoExtras =
      context.videoFusion ?
        [
          {
            label: "Explain what Messer just said" as const,
            mode: "explain" as const,
            q: `I'm on pause: "${context.videoFusion.pausePrompt}" for ${context.videoFusion.sectionLabel}. Explain the main idea in plain words (Security+ exam angle).`,
          },
          {
            label: "What should I write down?" as const,
            mode: "tutor" as const,
            q: `At this pause "${context.videoFusion.pausePrompt}", what is the single best Brain Book line (keyword + tight meaning)? Targets: ${context.videoFusion.highlightTargets.slice(0, 4).join(", ")}.`,
          },
          {
            label: "Make this note better" as const,
            mode: "note-feedback" as const,
            q: "Improve my video-study draft: remove copy-paste tone, add exam keyword, shorten to one retrieval line.",
          },
          {
            label: "Quiz me from this part" as const,
            mode: "tutor" as const,
            q: `One SY0-701 style MCQ from this pause context and highlights: ${context.videoFusion.highlightTargets.slice(0, 4).join("; ")} — then give answer + one-line why.`,
          },
          {
            label: "What will the exam ask?" as const,
            mode: "tutor" as const,
            q: `For "${context.videoFusion.sectionLabel}", what stem pattern and trap is most likely?`,
          },
        ]
      : [];
    const pdfExtras =
      context.pdfGuide ?
        [
          {
            label: "Help me find this in my PDF" as const,
            mode: "tutor" as const,
            q:
              context.pdfGuide.pdfFileAvailable ?
                `I added my PDF under Add PDF files. For section "${context.pdfGuide.sectionTitle}", what should I search for in the PDF first, and which heading should I look under if search fails?`
              : `I have not added this PDF to the app yet. Tell me the first step, then how to find "${context.pdfGuide.sectionTitle}" after my file is added.`,
          },
          {
            label: "What matters here?" as const,
            mode: "tutor" as const,
            q: `I'm in PDF guided mode on "${context.pdfGuide.sectionTitle}". List the 5 highest-yield exam ideas and one trap for each.`,
          },
          {
            label: "Exam traps (PDF)" as const,
            mode: "tutor" as const,
            q: `For "${context.pdfGuide.sectionTitle}", what distractors does CompTIA love, and how do I eliminate them fast?`,
          },
          {
            label: "Turn into flashcards" as const,
            mode: "tutor" as const,
            q: `From this section summary and must-highlight list, propose 3 flashcard fronts with backs (definition-style).`,
          },
          {
            label: "Check my note" as const,
            mode: "note-feedback" as const,
            q: "Critique my Brain Book draft for this section: vagueness, missing exam keyword, or textbook copy-paste tone. Suggest one tighter rewrite.",
          },
        ]
      : [];
    const set = labelsBySurface[context.surface];
    return [...videoExtras, ...quick.filter((x) => set.has(x.label)), ...pdfExtras];
  }, [context.surface, context.pdfGuide, context.videoFusion, quick]);

  const title = variant === "compact" ? "Study tutor" : "Study tutor (optional AI)";
  const expanded = isLg || mobileCoachOpen;

  /**
   * Unified badge + subcopy — one promise: same structured answer (answer · key points · next).
   * Live = full model; Built-in = same structure from local coach. No "vague" labels.
   */
  const sub =
    context.examAiLocked && context.surface === "quiz"
      ? "Paused during exam mode — comes back at review so it can’t spoil answers."
      : aiConn === "live"
        ? "Same shape every time: answer · key points · next step."
        : aiConn === "guided"
          ? "Same shape every time: answer · key points · next step."
          : aiConn === "offline"
            ? "Same shape every time: answer · key points · next step."
            : "Connecting briefly, then either way you get the same shape.";

  const badgeLabel =
    context.examAiLocked ?
      "Paused"
    : aiConn === "live" ?
      "Tutor ready"
    : aiConn === "guided" ?
      "Tutor ready"
    : aiConn === "offline" ?
      "Built-in coach"
    : "Connecting";
  const badgeTone =
    context.examAiLocked ? "warn" : aiConn === "live" || aiConn === "guided" ? "accent" : "neutral";

  return (
    <aside
      className={`rounded-2xl border border-violet-900/45 bg-violet-950/20 overflow-hidden flex flex-col ${
        expanded ? "max-h-[min(70vh,560px)] lg:max-h-[min(80vh,640px)]" : "max-lg:max-h-[132px] max-h-[min(70vh,560px)] lg:max-h-[min(80vh,640px)]"
      } ${className ?? ""}`}
      aria-label="Study tutor"
    >
      <div className="px-3 py-2.5 border-b border-violet-900/40 bg-violet-950/40 shrink-0">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <h2 className="text-sm font-bold text-violet-100">{title}</h2>
            <StatusBadge tone={badgeTone}>{badgeLabel}</StatusBadge>
          </div>
          {!isLg &&
            (mobileCoachOpen ? (
              <button
                type="button"
                className="text-xs font-medium rounded-lg border border-violet-700/60 bg-violet-950/50 text-violet-100 px-3 py-2.5 min-h-[44px] min-w-[44px] touch-manipulation shrink-0"
                aria-expanded="true"
                onClick={() => setMobileCoachOpen(false)}
              >
                Hide
              </button>
            ) : (
              <button
                type="button"
                className="text-xs font-medium rounded-lg border border-violet-700/60 bg-violet-950/50 text-violet-100 px-3 py-2.5 min-h-[44px] min-w-[44px] touch-manipulation shrink-0"
                aria-expanded="false"
                onClick={() => setMobileCoachOpen(true)}
              >
                Open
              </button>
            ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{sub}</p>
        {context.pdfGuide && context.pdfGuide.pdfFileAvailable === false && (
          <p className="text-[11px] text-amber-200/90 mt-2 leading-snug">
            This PDF isn&apos;t on this device yet — use <strong className="text-amber-100">Add PDF files</strong> in the menu. What you type here still
            saves in the app.
          </p>
        )}
      </div>

      {expanded && (
        <>
      <div
        className="flex-1 min-h-[140px] overflow-y-auto px-3 py-2 space-y-2 text-sm"
        role="region"
        aria-label="Study tutor conversation"
        aria-live="polite"
        aria-relevant="additions"
      >
        {msgs.length === 0 && (
          <p className="text-xs text-slate-500">
            Ask anything about this screen, or tap a shortcut. If live AI isn’t available, you’ll get the same structured help (answer, key points, next step) from built-in coaching — never an empty error.
          </p>
        )}
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
              m.role === "user" ? "bg-slate-800/80 text-slate-200 ml-4" : "bg-slate-900/80 text-slate-100 mr-2 border border-slate-800"
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <p className="text-xs text-violet-200/80 animate-pulse" role="status" aria-live="polite">
            Thinking…
          </p>
        )}
      </div>

      <div className="border-t border-violet-900/35 bg-slate-950/40 px-2 py-2 space-y-2 shrink-0">
        <div className="flex flex-wrap gap-1 max-h-[104px] overflow-y-auto">
          {visibleQuick.map((b) => (
            <button
              key={b.label}
              type="button"
              disabled={loading}
              onClick={() => void run(b.mode, b.q)}
              className="text-[10px] sm:text-[11px] rounded-lg border border-violet-800/50 bg-violet-950/30 px-2 py-1.5 text-violet-100/95 hover:bg-violet-900/40 disabled:opacity-40 touch-manipulation min-h-[44px] sm:min-h-[36px]"
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 min-w-0 rounded-lg bg-slate-900 border border-slate-700 px-2 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 text-xs text-slate-100 placeholder:text-slate-600"
            placeholder="Ask in plain English…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const t = input.trim();
                if (!t || loading) return;
                setInput("");
                void run("tutor", t);
              }
            }}
          />
          <button
            type="button"
            className="btn text-xs shrink-0 px-3 py-2.5 min-h-[44px] sm:min-h-0 sm:py-2 touch-manipulation"
            disabled={loading || !input.trim()}
            onClick={() => {
              const t = input.trim();
              setInput("");
              void run("tutor", t);
            }}
          >
            Send
          </button>
        </div>
      </div>
        </>
      )}
    </aside>
  );
}
