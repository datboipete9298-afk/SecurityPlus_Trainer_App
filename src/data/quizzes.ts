import type { QuizQuestion } from "../types";
import { lessons } from "./lessons";
import { generateQuestionsForLessons } from "./quizGenerator";
import { rowsToQuestions } from "./messer/loadMesserMcq";
import { examARows } from "./messer/examA.rows";
import { examBRows } from "./messer/examB.rows";
import { examCRows } from "./messer/examC.rows";

const messerExamQuestions: QuizQuestion[] = [
  ...rowsToQuestions(examARows, "messer-exam-a"),
  ...rowsToQuestions(examBRows, "messer-exam-b"),
  ...rowsToQuestions(examCRows, "messer-exam-c"),
];

const manualQuestions: QuizQuestion[] = [
  {
    id: "q1-1-1",
    lessonId: "1-1",
    domain: "1",
    type: "best",
    difficulty: 2,
    text: "Which control type best describes a written acceptable use policy signed by employees?",
    options: ["Technical", "Managerial", "Operational", "Physical"],
    correctIndex: 1,
    explanation: "Written policy and governance lives under managerial (oversight). Operational would be day-to-day execution of that policy.",
    wrongExplanations: [
      "Technical controls use technology to enforce.",
      "Correct — managerial.",
      "Operational = procedures executed regularly; policy drafting/governance is managerial.",
      "Physical = tangible perimeter/device controls.",
    ],
    examKeyword: "policy, governance, acceptable use",
  },
  {
    id: "q1-1-2",
    lessonId: "1-1",
    domain: "1",
    type: "mcq",
    difficulty: 2,
    text: "A firewall rule blocking inbound traffic is best classified as which control function?",
    options: ["Detective", "Preventive", "Corrective", "Deterrent"],
    correctIndex: 1,
    explanation: "Blocking before harm is preventive. Detective would be logs/alerts after traffic seen.",
    wrongExplanations: ["Detective = detect after/bad activity observed.", "Preventive blocks first.", "Corrective fixes after incident.", "Deterrent discourages; may not block."],
    examKeyword: "firewall, block, preventive",
  },
  {
    id: "q1-1-3",
    lessonId: "1-1",
    domain: "1",
    type: "scenario",
    difficulty: 3,
    text: "Legacy SCADA cannot be patched. You add network segmentation and extra monitoring. The added monitoring is primarily:",
    options: ["Compensating control", "Physical control", "Corrective control", "Managerial control only"],
    correctIndex: 0,
    explanation: "When primary control (patching) is infeasible, alternate controls that reduce risk are compensating; monitoring is often detective + risk reduction in that story.",
    wrongExplanations: ["Compensating fits alternate when ideal missing.", "Physical is wrong layer.", "Monitoring is not mainly corrective unless fixing after fact.", "Managerial alone doesn’t capture technical monitoring."],
    examKeyword: "legacy, compensating, segmentation",
  },
  {
    id: "q-cia-1",
    lessonId: "1-2-cia",
    domain: "1",
    type: "scenario",
    difficulty: 2,
    text: "A website is defaced (content replaced). Which CIA principle is MOST directly impacted?",
    options: ["Confidentiality", "Integrity", "Availability", "Non-repudiation only"],
    correctIndex: 1,
    explanation: "Unauthorized change to data = integrity. If site is also down, availability can be second, but defacement = integrity first.",
    wrongExplanations: ["No major disclosure described.", "Integrity = tampering.", "Might be down, stem says defaced = change.", "NR not primary here."],
    examKeyword: "deface, tamper, integrity",
  },
  {
    id: "q-cia-2",
    lessonId: "1-2-cia",
    domain: "1",
    type: "mcq",
    difficulty: 1,
    text: "Encryption of data at rest primarily supports:",
    options: ["Availability", "Confidentiality", "Non-repudiation", "Accounting"],
    correctIndex: 1,
    explanation: "Encryption at rest limits disclosure = confidentiality (also can support integrity depending on design; exam default = confidentiality for ‘data at rest’).",
    wrongExplanations: ["Availability is uptime/readiness, not the main point of at-rest encryption.", "Confidentiality is primary.", "NR needs signing/identity, not just encryption at rest word.", "Accounting is AAA usage log."],
    examKeyword: "encryption at rest, disclosure",
  },
  {
    id: "q-nr-1",
    lessonId: "1-2-nr",
    domain: "1",
    type: "best",
    difficulty: 3,
    text: "Which BEST supports non-repudiation for an email contract?",
    options: [
      "AES encryption of the message body only",
      "Digital signature with sender’s private key and trusted verification",
      "Strong password on mailbox",
      "Hiding the email in a private folder",
    ],
    correctIndex: 1,
    explanation: "Non-repudiation needs cryptographic proof of who signed. Digital signature + PKI is the standard exam answer pattern.",
    wrongExplanations: ["Confidentiality, not origin proof alone.", "Signature proves sender intent.", "AuthN, not full NR proof.", "Obscurity is not legal proof."],
    examKeyword: "digital signature, non-repudiation",
  },
  {
    id: "q-aaa-1",
    lessonId: "1-2-aaa",
    domain: "1",
    type: "scenario",
    difficulty: 2,
    text: "User logs in successfully but cannot open a finance share. The failure is in:",
    options: ["Authentication", "Authorization", "Accounting", "Physical security"],
    correctIndex: 1,
    explanation: "Identity proven (AuthN); permission denied to resource = AuthZ.",
    wrongExplanations: ["Login worked.", "Access rights = AuthZ.", "Not logging here.", "Not physical."],
    examKeyword: "403, permission, authorization",
  },
  {
    id: "q-aaa-2",
    lessonId: "1-2-aaa",
    domain: "1",
    type: "acronym",
    difficulty: 1,
    text: "The “first A” in AAA stands for:",
    options: ["Authorization", "Accounting", "Authentication", "Auditing only"],
    correctIndex: 2,
    explanation: "Authentication first in AAA (who are you), then AuthZ, then Accounting in common teaching order.",
    wrongExplanations: ["That’s 2nd conceptually.", "That’s 3rd A.", "Authentication is first in AAA acronyms.", "Auditing ≠ first A in AAA trinity."],
    examKeyword: "AAA, AuthN",
  },
  {
    id: "q-zt-1",
    lessonId: "1-2-zt",
    domain: "1",
    type: "best",
    difficulty: 3,
    text: "Which statement aligns with Zero Trust principles?",
    options: [
      "Internal network traffic is always trusted to reduce latency",
      "Verify identity and context for every access request, assume breach",
      "VPN alone replaces all other controls",
      "Firewalls on the perimeter are sufficient for modern enterprise",
    ],
    correctIndex: 1,
    explanation: "Zero Trust: continuous verification, no implied trust, assume breach.",
    wrongExplanations: ["Opposite of ZT.", "Correct — verify + assume breach.", "VPN alone is a classic trap answer.", "Castle-and-moat fallacy in ZT questions."],
    examKeyword: "zero trust, verify, assume breach",
  },
  {
    id: "q-zt-2",
    lessonId: "1-2-zt",
    domain: "1",
    type: "mcq",
    difficulty: 2,
    text: "Micro-segmentation in Zero Trust mostly improves:",
    options: [
      "Print server compatibility",
      "Lateral movement containment / blast-radius reduction",
      "DNS cache speed",
      "Physical key management",
    ],
    correctIndex: 1,
    explanation: "Smaller trust zones = limit east-west spread (blast radius).",
    wrongExplanations: ["Not the goal.", "Segmentation = smaller zones.", "Unrelated.", "Physical keys — wrong layer."],
    examKeyword: "micro-segmentation, east-west",
  },
];

const genByLesson = new Map<string, QuizQuestion[]>();
for (const q of generateQuestionsForLessons(lessons)) {
  const a = genByLesson.get(q.lessonId) || [];
  a.push(q);
  genByLesson.set(q.lessonId, a);
}

const MIN_PER = 7;
function mergeWithGenerated(): QuizQuestion[] {
  const out: QuizQuestion[] = [];
  const got = new Set<string>();
  for (const L of Object.values(lessons)) {
    if (!L.hasFullContent) continue;
    const man = manualQuestions.filter((q) => q.lessonId === L.id);
    const gen = genByLesson.get(L.id) || [];
    const need = Math.max(0, MIN_PER - man.length);
    const add = man.length >= MIN_PER ? man : [...man, ...gen.slice(0, need)];
    for (const q of add) {
      if (!got.has(q.id)) {
        got.add(q.id);
        out.push(q);
      }
    }
  }
  return out;
}

/** Curriculum quizzes + Messer practice exam banks (deduped by id). */
export const quizQuestions: QuizQuestion[] = (() => {
  const core = mergeWithGenerated();
  const seen = new Set(core.map((q) => q.id));
  const out = [...core];
  for (const q of messerExamQuestions) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    out.push(q);
  }
  return out;
})();

export function questionsByLesson(lessonId: string): QuizQuestion[] {
  return quizQuestions.filter((q) => q.lessonId === lessonId);
}

export function allQuestions() {
  return quizQuestions;
}
