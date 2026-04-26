import type { DomainId, Lesson, QuizQuestion } from "../types";

function w4(): [string, string, string, string] {
  return [
    "Not the *primary* issue named in the stem; reread the loss.",
    "Confuses *layers* (people vs policy vs product).",
    "A real control but wrong for this *order* in the story.",
    "Seductive word choice without matching the scenario’s axis.",
  ];
}

function qid(lessonId: string, tag: string) {
  return `qgen-${lessonId}-${tag}`;
}

/** Ensures 7+ questions per lesson: 3 beginning (mcq), 3 scenario, 1 best/trap. */
export function generateQuestionsForLessons(lessons: Record<string, Lesson>): QuizQuestion[] {
  const out: QuizQuestion[] = [];
  for (const L of Object.values(lessons)) {
    if (!L.hasFullContent) continue;
    const d = L.domain as DomainId;
    const t = L.title;
    out.push(
      {
        id: qid(L.id, "b1"),
        lessonId: L.id,
        domain: d,
        type: "mcq",
        difficulty: 1,
        text: `Which best describes a *primary* thing to remember for “${t}” on the exam?`,
        options: [
          "Match the stem’s *primary* loss to the *named* control or concept, not a nearby word.",
          "Assume internal users are always trusted for easier administration.",
          "Pick the longest, most technical option because it looks advanced.",
          "Security is mainly a one-time product purchase, not a process.",
        ],
        correctIndex: 0,
        explanation: "CompTIA scenario questions want the *primary* best fix or classification—read who/what/when, then the named topic.",
        wrongExplanations: w4(),
        examKeyword: `${L.id}, primary impact, best`,
      },
      {
        id: qid(L.id, "b2"),
        lessonId: L.id,
        domain: d,
        type: "mcq",
        difficulty: 1,
        text: `For “${t}”, which study habit most improves recall under exam time pressure?`,
        options: [
          "3–8 highlight hooks + one 3-second sentence per hook",
          "Highlight entire paragraphs in yellow for 'coverage'",
          "Reread the chapter 10x without quizzing",
          "Only memorize acronyms without definitions",
        ],
        correctIndex: 0,
        explanation: "Sparse highlights + quick verbal recall match how this app is structured; volume highlighting reduces signal.",
        wrongExplanations: w4(),
        examKeyword: "active recall, hooks",
      },
      {
        id: qid(L.id, "b3"),
        lessonId: L.id,
        domain: d,
        type: "mcq",
        difficulty: 2,
        text: `A coworker conflates two similar terms from “${t}.” What is your best first step?`,
        options: [
          "Separate *definitions* and map each to one exam *keyword* and one *wrong* answer story.",
          "Choose whichever term is longer.",
          "Skip it—Security+ will not test definitions.",
          "Trust forum opinions over CompTIA objective language.",
        ],
        correctIndex: 0,
        explanation: "Definition precision + a trap story turns confusion into easy points on the exam.",
        wrongExplanations: w4(),
        examKeyword: "definition, trap answer",
      },
      {
        id: qid(L.id, "s1"),
        lessonId: L.id,
        domain: d,
        type: "scenario",
        difficulty: 2,
        text: `A scenario mentions miscommunication between teams about **${t}** controls. The *first* business risk is often:`,
        options: [
          "Inconsistent application of the right control for the *actual* loss (policy gap/execution).",
          "Only lack of 4K monitor resolution in the NOC room.",
          "Lack of a single VPN vendor marketing brochure.",
          "The color scheme of the security awareness slides.",
        ],
        correctIndex: 0,
        explanation: "Process/governance and correct control selection are common exam 'people & process' angles.",
        wrongExplanations: w4(),
        examKeyword: "stakeholder, control selection",
      },
      {
        id: qid(L.id, "s2"),
        lessonId: L.id,
        domain: d,
        type: "scenario",
        difficulty: 3,
        text: `Logs show a partial implementation related to “${t}” with exceptions approved by a manager. The exam-style takeaway is:`,
        options: [
          "Document risk acceptance, compensating controls, and re-measure *residual* risk on a schedule.",
          "Delete all logs to reduce liability.",
          "Ignore exceptions because the manager approved them forever.",
          "Assume zero residual risk if a ticket exists with no follow-up.",
        ],
        correctIndex: 0,
        explanation: "GRC and operational reality: exceptions exist; residual risk, documentation, and review are exam-friendly.",
        wrongExplanations: w4(),
        examKeyword: "exception, compensating, residual",
      },
      {
        id: qid(L.id, "s3"),
        lessonId: L.id,
        domain: d,
        type: "scenario",
        difficulty: 3,
        text: `An auditor asks for **evidence** you understood “${t}” in production (not a slide deck). A strong answer is:`,
        options: [
          "Config screenshots/runbooks, tickets, and logs showing the control *operating* + periodic review records.",
          "Only a signed statement with no evidence.",
          "A generic policy PDF from 10 years ago with no version control",
          "A team chat saying 'we are secure'",
        ],
        correctIndex: 0,
        explanation: "Evidence = artifacts that prove the control is real and reviewed—classic audit-style pattern.",
        wrongExplanations: w4(),
        examKeyword: "evidence, audit, operational effectiveness",
      },
      {
        id: qid(L.id, "trap"),
        lessonId: L.id,
        domain: d,
        type: "best",
        difficulty: 4,
        text: `**Exam trap (BEST):** A stem says “we bought the market-leading product for ${t} so we are done.” The *best* challenge to that claim is:`,
        options: [
          "Security outcomes depend on *people/process/tech* and continuous validation—products are ingredients, not outcomes.",
          "A single product always eliminates all business risk with no residual risk.",
          "Vendor market share is the only valid risk metric in CompTIA.",
          "The exam never tests process—only acronyms.",
        ],
        correctIndex: 0,
        explanation: "CompTIA often punishes 'product = security' and 'set and forget' absolutes. Layer, operate, and verify.",
        wrongExplanations: w4(),
        examKeyword: "exam trap, product vs program, continuous",
      }
    );
  }
  return out;
}
