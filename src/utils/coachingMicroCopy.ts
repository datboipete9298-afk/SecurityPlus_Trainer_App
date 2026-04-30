/**
 * Embedded coaching micro-copy.
 *
 * One short line per moment of action. Placed via `<CoachLine>` exactly where
 * the action happens — never on a separate "how-to" page. Goal: teach users
 * HOW to study with this app while they're using it, without overloading the UI.
 *
 * Keep each line ≤ 22 words. No emoji. No punishment language.
 */

export const COACH_COPY = {
  /** Lesson page Brain Book input — "1-note rule" */
  oneNoteRule: "1-note rule: capture only what would surprise you on the exam — your own words, not the lesson’s.",

  /** VideoStudyMode pause section — gentle 5-second cue */
  pauseFiveSeconds: "Pause 5 seconds before writing. The first word that comes to mind is usually your exam keyword.",

  /** Quiz page top — coaching the goal */
  quizGoal: "Aim to understand each miss, not to score 100 %. Wrong answers teach more than easy wins.",

  /** Flashcards top — repetition tone */
  flashcardsBoring: "Review wrong cards 3 times before moving on. Boring is the goal — that’s when recall is automatic.",

  /** Weak page top — repair posture */
  weakPosture: "Fix one mistake at a time. The same trap rarely catches you twice once you’ve named it.",

  /** Practice exams hub — when to take a full exam */
  practiceExamWhen: "Take a full exam after about 10 lessons. Score doesn’t matter yet — track which domains tripped you.",

  /** Dashboard returning user — daily session pacing */
  sessionPacing: "20–30 minutes a day beats two-hour cram days. End each session with one quiz, not one more video.",

  /** Boss hub — set posture for the "I'll lose first try" feeling */
  bossPosture: "Bosses surface weak patterns fast. Losing the first run is normal — follow the lesson it points to, then retry.",
} as const;

export type CoachCopyKey = keyof typeof COACH_COPY;
