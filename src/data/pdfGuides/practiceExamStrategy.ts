/** Original exam-strategy copy — not extracted from third-party PDFs. */
export const PRACTICE_EXAM_STRATEGY = {
  timing: [
    "Skim every question once: answer easy wins, flag long PBQ-style stems for the second pass.",
    "Cap per-question time early; reserve a block at the end for flagged items only.",
    "On performance-based items, read constraints (firewall rule, ACL order, log fields) before clicking.",
  ],
  review: [
    "Wrong answers: write one line — “trap was X, rule is Y” — into Brain Book or PDF margin notes.",
    "Re-run missed items next day before new content; same-day second pass fixes pattern, not luck.",
    "When two answers look right, ask which one matches the *exam keyword* in the stem.",
  ],
  mistakeLoop: [
    "Log the *reason* you picked the wrong option (speed, keyword miss, definition slip).",
    "Pair each miss with one lesson id + one flashcard; use PDF guided view for that lesson.",
    "After three misses on the same topic, do a 5-minute “say the rule out loud” before more questions.",
  ],
  traps: [
    "“Most likely / best” → compare controls against the scenario outcome, not generic goodness.",
    "Absolute wording (“always”, “never”) → often false unless it’s a definition you know cold.",
    "Confusing similar protocols or ports → tie to one workplace story per family (HTTPS vs TLS vs port confusion).",
  ],
} as const;
