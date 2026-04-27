/** Ordered steps for “never used a security app before” users — plain text only (rendered with normal typography in UI). */
export const BEGINNER_STEPS: { id: string; title: string; body: string }[] = [
  {
    id: "app",
    title: "1. How to use this app",
    body: "Go in Messer order (top to bottom on the Roadmap). Each lesson has: video, short notes in Brain Book, then quiz. Your dashboard always tells you the next best move.",
  },
  {
    id: "video",
    title: "2. How to watch a lesson",
    body: "Use the video on the lesson or open the Guided Watch page from the lesson. Watch about two minutes, pause, write one keyword you heard, then keep going. You do not need to memorize the first time.",
  },
  {
    id: "highlight",
    title: "3. How to highlight",
    body: "Only 3–8 short hooks in your course notes: terms, small definitions, process steps, lists. If you highlight a whole paragraph, you highlighted too much.",
  },
  {
    id: "notes",
    title: "4. How to take notes",
    body: "Use Brain Book in the lesson: one row = topic, what it means, one real-life or work example, one exam-style keyword. Stop at five rows per lesson max — quality over volume.",
  },
  {
    id: "quiz",
    title: "5. How to quiz",
    body: "After the video, open the mini-quiz for the same lesson. Read why wrong answers are wrong — that is where CompTIA hides patterns.",
  },
  {
    id: "weak",
    title: "6. Weak areas and mistakes",
    body: "Missed items go to Weak areas. You can turn recent misses into flashcards and replay quizzes until the story feels boring — that is when you are winning.",
  },
  {
    id: "understand",
    title: "7. How to know you understand",
    body: "You can name the idea in ten words, you picked the right answer on a new quiz stem, and you can teach it out loud in one minute. The lesson checklist tracks watch, notes, quiz, and teach-back.",
  },
];

export const BEGINNER_STEP_COUNT = BEGINNER_STEPS.length;

export const COURSE_TOUR_LINKS = {
  startHere: "/start-here",
  roadmap: "/roadmap",
  firstLesson: "/lesson/1-0",
  weak: "/weak",
  dashboard: "/",
};
