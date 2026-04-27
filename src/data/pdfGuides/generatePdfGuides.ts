import type { PdfGuideSection, PdfInterruptKind } from "../../types/pdfLibrary";
import { lessons, ORDERED_LESSON_IDS } from "../lessons";
import { questionsByLesson } from "../quizzes";
import { cardsForLesson } from "../flashcards";

function miniQuizForLesson(lessonId: string) {
  const qs = questionsByLesson(lessonId);
  const pick = qs.slice(0, 3);
  return pick.map((q) => ({
    question: q.text,
    choices: q.options,
    correctIndex: q.correctIndex,
  }));
}

function interruptsFor(L: (typeof lessons)[string]): { kind: PdfInterruptKind; title: string; body: string }[] {
  const trap = L.examTraps[0];
  const out: { kind: PdfInterruptKind; title: string; body: string }[] = [
    { kind: "stop", title: "STOP AND KNOW THIS", body: L.instantRecognition[0] ? `${L.instantRecognition[0]!.keyword} → ${L.instantRecognition[0]!.answer}` : L.threeSecondRecall[0] ?? L.simpleExplanation.slice(0, 160) },
    { kind: "pause", title: "PAUSE AND EXPLAIN THIS", body: `In one breath: ${L.simpleExplanation.slice(0, 220)}` },
  ];
  if (trap) {
    out.push({
      kind: "trap",
      title: "EXAM TRAP",
      body: `Compare “${trap.a.slice(0, 80)}…” vs “${trap.b.slice(0, 80)}…”. Know which stem pattern points where.`,
    });
  }
  out.push({
    kind: "dont_miss",
    title: "DON’T MISS THIS",
    body: L.videoFocus[0] ? `Video/note hook: ${L.videoFocus[0]}` : L.writeDown.slice(0, 200),
  });
  out.push({
    kind: "quick_check",
    title: "QUICK CHECK",
    body: L.threeSecondRecall[0] ?? "Close the PDF — can you name the control type or keyword for this section in 10 seconds?",
  });
  return out;
}

function buildOne(pdfId: string, lessonId: string, angle: "notes" | "study"): PdfGuideSection | null {
  const L = lessons[lessonId];
  if (!L?.hasFullContent) return null;

  const must = L.highlightRules.filter((h) => h.importance === "must").map((h) => `${h.term}: ${h.meaning}`);
  const should = L.highlightRules.filter((h) => h.importance === "should" || h.importance === "good").map((h) => `${h.term}`);
  const cards = cardsForLesson(lessonId);

  const angleLine =
    angle === "notes"
      ? "Course-notes track: skim for lists, comparisons, and bold definitions — then anchor with hooks below."
      : "Study-guide track: read for narrative + examples — compress each subsection to one exam-ready line.";

  return {
    pdfId,
    lessonId,
    sectionTitle: L.title,
    pageRange: null,
    locatorHint: `Open your PDF; use bookmarks or search for this section title (“${L.sectionNumber ?? lessonId}” / “${L.title.slice(0, 48)}…”). Page numbers vary by edition — this app does not ship publisher page maps.`,
    summary: `${angleLine} ${L.simpleExplanation}`,
    keyConcepts: [...L.videoFocus.slice(0, 6), ...L.threeSecondRecall.slice(0, 3)],
    mustHighlight: must.length ? must : [`${L.title}: core definition (from lesson)`],
    shouldHighlight: should.length ? should : L.videoFocus.slice(0, 5),
    doNotHighlight: [
      "Long uninterrupted paragraphs (bookmark mentally, don’t neon the whole page).",
      "Repeated examples that restate the same definition.",
      "Introductory “what is Security+” fluff if you already know the objective.",
    ],
    writeThisDown: L.writeDown,
    explainLikeImDumb: L.simpleExplanation,
    examTrap: L.examTraps[0] ? `A: ${L.examTraps[0].a} — B: ${L.examTraps[0].b}` : "Watch for stems that swap look-alike controls or protocols.",
    realWorldExample: L.quickAction,
    memoryTrick: L.noteCoach?.memoryTrick ?? L.teachBackPrompt.slice(0, 200),
    quickCheck: L.miniQuizIntro || "One MCQ in this app’s quiz locks whether you recognized the keyword pattern.",
    miniQuiz: miniQuizForLesson(lessonId),
    linkedFlashcardIds: cards.slice(0, 8).map((c) => c.id),
    interrupts: interruptsFor(L),
    domain: L.domain,
  };
}

/** All per-lesson guides for notes + study PDFs (curriculum-aligned; not verbatim PDF text). */
export function generateAllLessonPdfGuides(): PdfGuideSection[] {
  const out: PdfGuideSection[] = [];
  for (const id of ORDERED_LESSON_IDS) {
    const n = buildOne("messer-course-notes-v107", id, "notes");
    const s = buildOne("sy0-701-study-guide", id, "study");
    if (n) out.push(n);
    if (s) out.push(s);
  }
  return out;
}
