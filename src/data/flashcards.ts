import type { Flashcard } from "../types";
import { lessons } from "./lessons";
import { generateFlashcardsForLessons } from "./flashcardEngine";

const manualFlashcards: Flashcard[] = [
  { id: "f1-1-1", lessonId: "1-1", front: "Managerial control (1 phrase)", back: "Policy, governance, risk program — *oversight*.", cardType: "def" },
  { id: "f1-1-2", lessonId: "1-1", front: "Preventive vs Detective", back: "Preventive: block first. Detective: see/log after (SIEM, IDS log review).", cardType: "compare" },
  { id: "f1-1-3", lessonId: "1-1", front: "Compensating control", back: "Alternate safeguard when main control infeasible; reduces residual risk a different way.", cardType: "def", trap: "Not the same as ‘extra AV only’" },
  { id: "f-cia-1", lessonId: "1-2-cia", front: "Availability loss example", back: "DoS, outage, ransomware *locking you out* of access.", cardType: "scenario" },
  { id: "f-cia-2", lessonId: "1-2-cia", front: "Integrity loss example", back: "Hash mismatch, defacement, tampered file.", cardType: "scenario" },
  { id: "f-nr-1", lessonId: "1-2-nr", front: "Non-repudiation", back: "Prove who did/signed; deny-after-the-fact is hard. Signatures, audit, time.", cardType: "def" },
  { id: "f-aaa-1", lessonId: "1-2-aaa", front: "AuthZ failure symptom", back: "Valid login, denied resource/403/‘no access’ to share/role issue.", cardType: "trap" },
  { id: "f-aaa-2", lessonId: "1-2-aaa", front: "4th A (Accounting) example", back: "Session length, data volume for billing, RADIUS start/stop records.", cardType: "def" },
  { id: "f-zt-1", lessonId: "1-2-zt", front: "Zero trust one-liner", back: "Never trust by location alone; verify identity+context each access; assume breach.", cardType: "def" },
  { id: "f-zt-2", lessonId: "1-2-zt", front: "Zero Trust vs ‘VPN = done’", back: "VPN may be *ingredient*; ZT = continuous policy + id + device posture per resource.", cardType: "compare" },
];

const genList = generateFlashcardsForLessons(lessons);
const genByLesson = new Map<string, Flashcard[]>();
for (const c of genList) {
  const a = genByLesson.get(c.lessonId) || [];
  a.push(c);
  genByLesson.set(c.lessonId, a);
}
const MIN_CARDS = 5;
function mergeFlash(): Flashcard[] {
  const out: Flashcard[] = [];
  const seen = new Set<string>();
  for (const L of Object.values(lessons)) {
    if (!L.hasFullContent) continue;
    const man = manualFlashcards.filter((c) => c.lessonId === L.id);
    const gen = genByLesson.get(L.id) || [];
    const add = man.length >= MIN_CARDS ? man : [...man, ...gen.slice(0, Math.max(0, MIN_CARDS - man.length))];
    for (const c of add) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        out.push(c);
      }
    }
  }
  return out;
}

/** Static + generated (≥5 per lesson with full content where needed). */
export const flashcards: Flashcard[] = mergeFlash();

export function cardsForLesson(lessonId: string) {
  return flashcards.filter((c) => c.lessonId === lessonId);
}

export function allStaticFlashcards() {
  return flashcards;
}
