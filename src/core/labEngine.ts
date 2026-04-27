import type { DomainId } from "../types";
import { lessons } from "../data/lessons";
import { labs as staticLabs } from "../data/labs";
import { pick, pickN } from "./trainingHash";

export type LabCategory =
  | "SYSTEM_INTERACTION"
  | "NETWORK_SIMULATION"
  | "BROWSER_BASED"
  | "MOCK_TERMINAL"
  | "VISUAL_INTERACTIVE"
  | "DECISION"
  | "SECURITY_ANALYSIS";

export type TrainingLab = {
  id: string;
  lessonId: string;
  category: LabCategory;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedTimeMin: number;
  toolsRequired: string[];
  objective: string;
  realWorldContext: string;
  environmentType: string;
  stepByStep: string[];
  checkpoints: { id: string; label: string; hint?: string }[];
  expectedResult: string;
  failureModes: string[];
  hints: string[];
  recoverySteps: string[];
  examConnection: string;
  memoryHook: string;
  /** Optional mock terminal scenario id */
  terminalScenarioId?: string;
  /** Correct top-to-bottom order for visual ordering labs */
  orderingCanonical?: string[];
};

const CATS: LabCategory[] = [
  "SYSTEM_INTERACTION",
  "NETWORK_SIMULATION",
  "BROWSER_BASED",
  "MOCK_TERMINAL",
  "VISUAL_INTERACTIVE",
  "DECISION",
  "SECURITY_ANALYSIS",
];

function lessonContext(lessonId: string) {
  const L = lessons[lessonId];
  const term = L?.highlightRules?.[0]?.term ?? "this objective";
  const domain = (L?.domain ?? "1") as DomainId;
  const title = L?.title ?? lessonId;
  const explain = L?.simpleExplanation?.slice(0, 200) ?? "Security+ concepts for this section.";
  return { L, term, domain, title, explain };
}

function staticToTraining(lessonId: string): TrainingLab[] {
  return staticLabs
    .filter((l) => l.relatedLessonIds.includes(lessonId))
    .map((l, i) => ({
      id: `static-${l.id}`,
      lessonId,
      category: pick(
        ["SYSTEM_INTERACTION", "NETWORK_SIMULATION", "BROWSER_BASED", "SECURITY_ANALYSIS"] as const,
        lessonId,
        `cat-${l.id}`,
      ),
      difficulty: 2,
      estimatedTimeMin: 12,
      toolsRequired: ["Your PC or lab VM", "Read-only mindset"],
      objective: l.description,
      realWorldContext: l.safeWarning,
      environmentType: "LOCAL_SAFE",
      stepByStep: l.steps,
      checkpoints: l.steps.map((_step, j) => ({ id: `cp-${i}-${j}`, label: `Step ${j + 1} done`, hint: undefined })),
      expectedResult: "You can explain one defender takeaway tied to this lesson in one sentence.",
      failureModes: ["Skipping steps", "Running commands on systems you do not own"],
      hints: ["Write one sentence per step — exam rewards concise recall.", "If blocked, note why and move on; return later."],
      recoverySteps: ["Re-read the lesson trap list", "Redo only the step you skipped"],
      examConnection: `Maps to Domain ${l.domain} — procedure + recognition questions.`,
      memoryHook: `${l.title.slice(0, 40)}… → local evidence + safe habit.`,
    }));
}

function synthLab(lessonId: string, category: LabCategory, slot: number): TrainingLab {
  const { term, domain, title, explain } = lessonContext(lessonId);
  const id = `gen-lab-${lessonId}-${category}-${slot}`;

  const templates: Record<LabCategory, Omit<TrainingLab, "id" | "lessonId" | "category">> = {
    SYSTEM_INTERACTION: {
      difficulty: 2,
      estimatedTimeMin: 10,
      toolsRequired: ["Windows PC or VM", "Event Viewer (eventvwr.msc)"],
      objective: `Relate **${term}** to a local visibility control (read-only).`,
      realWorldContext: "Analysts prove intent with logs — you practice the habit without changing production.",
      environmentType: "WINDOWS_READ_ONLY",
      stepByStep: [
        "Win+R → `eventvwr.msc` → Windows Logs → System (or Security if present).",
        "Sort by Date/Time; find one Information and one Warning if available.",
        "Write: which log *source* would you cite on a ticket? (one line)",
      ],
      checkpoints: [
        { id: "c1", label: "Opened Event Viewer locally" },
        { id: "c2", label: "Identified time-ordered evidence" },
        { id: "c3", label: "Wrote one-line source + relevance" },
      ],
      expectedResult: "You named a log source and why it matters for " + term + ".",
      failureModes: ["Clicking random filters without a hypothesis", "Clearing logs (never in this lab)"],
      hints: ["Look for Source + Event ID pattern — exam loves ‘where to look first’.", "Stay read-only."],
      recoverySteps: ["Re-open the lesson ‘instant recognition’ list", "Retry only checkpoint 3"],
      examConnection: `Domain ${domain}: detective vs preventive controls, evidence basics.`,
      memoryHook: `${term} → Event Viewer = detective trail.`,
    },
    NETWORK_SIMULATION: {
      difficulty: 2,
      estimatedTimeMin: 8,
      toolsRequired: ["cmd/PowerShell", "Your network only"],
      objective: `Connect **${term}** to reachability vs confidentiality.`,
      realWorldContext: "Ping/tracert are first-hop triage — safe when aimed at allowed hosts.",
      environmentType: "CLI_SIMULATION_ALLOWED",
      stepByStep: [
        "Run `ipconfig` — note IPv4, gateway, DNS.",
        "Ping your gateway OR 1.1.1.1 with `-n 2` only.",
        "Optional: `tracert` with one hop read — where would loss impact availability?",
      ],
      checkpoints: [
        { id: "n1", label: "Recorded IP + gateway" },
        { id: "n2", label: "Ping completed (non-destructive)" },
        { id: "n3", label: "One-sentence CIA tie-in" },
      ],
      expectedResult: "You can state what ping proves vs what it does not.",
      failureModes: ["Flooding pings", "Tracing unrelated third-party hosts aggressively"],
      hints: ["Availability stems often mention latency/loss.", "Don’t post full public IP traces online."],
      recoverySteps: ["Redo ipconfig only", "Write CIA-A one-liner"],
      examConnection: `Domain ${domain}: network troubleshooting + segmentation vocabulary.`,
      memoryHook: "Ping = reachability; it is not encryption.",
      terminalScenarioId: `net-${lessonId}-${slot}`,
    },
    BROWSER_BASED: {
      difficulty: 2,
      estimatedTimeMin: 7,
      toolsRequired: ["Modern browser"],
      objective: `Tie **${term}** to TLS trust decisions (view only).`,
      realWorldContext: "Users defeat HTTPS warnings daily — you learn the safe response.",
      environmentType: "BROWSER_READ_ONLY",
      stepByStep: [
        "Open a site you legitimately use over HTTPS.",
        "Padlock / certificate → note issuer, expiry, SAN vs hostname.",
        "Write: would you ‘click through’? Why is that wrong on the exam?",
      ],
      checkpoints: [
        { id: "b1", label: "Viewed certificate panel" },
        { id: "b2", label: "Noted expiry + name match concept" },
        { id: "b3", label: "Wrote exam-safe user guidance" },
      ],
      expectedResult: "You explain name mismatch vs expiry in plain English.",
      failureModes: ["Installing unknown roots", "Entering creds on warning pages"],
      hints: ["SAN/CN traps show up as PBQ-style stems.", "Integrity + confidentiality in transit."],
      recoverySteps: ["Pick a different trusted site", "Re-read lesson exam traps"],
      examConnection: `Domain ${domain}: PKI, certificates, secure protocols.`,
      memoryHook: "Cert warning = stop, verify chain, don’t train users to bypass.",
    },
    MOCK_TERMINAL: {
      difficulty: 2,
      estimatedTimeMin: 6,
      toolsRequired: ["In-app mock terminal (safe)"],
      objective: `Practice a harmless command pattern related to **${term}**.`,
      realWorldContext: "We simulate output — nothing leaves your browser.",
      environmentType: "MOCK_TERMINAL",
      stepByStep: [
        "Open the Mock Terminal block under this lab in the UI.",
        "Run `help` then the suggested safe command.",
        "Read the fake output — what would you escalate?",
      ],
      checkpoints: [
        { id: "t1", label: "Ran help" },
        { id: "t2", label: "Ran suggested command" },
        { id: "t3", label: "One-line interpretation" },
      ],
      expectedResult: "You interpreted simulated CLI output without touching a real server.",
      failureModes: ["Pasting unknown scripts into a real shell"],
      hints: ["Exams test interpretation, not memorizing vendor CLI flags.", "Use the in-app terminal only."],
      recoverySteps: ["Click Reset in mock terminal", "Retry checkpoint 2"],
      examConnection: `Domain ${domain}: log/command output triage questions.`,
      memoryHook: "Read output → classify → then act.",
      terminalScenarioId: `mock-${lessonId}-${slot}`,
    },
    VISUAL_INTERACTIVE: {
      difficulty: 2,
      estimatedTimeMin: 5,
      toolsRequired: ["This app UI"],
      objective: `Order concepts for **${term}** — active recall.`,
      realWorldContext: "Ordering mirrors drag/drop PBQs without copying proprietary screens.",
      environmentType: "VISUAL_UI",
      stepByStep: [
        "Review the shuffled list in the lab runner.",
        "Move items into exam-logical order (general → specific, or lifecycle order).",
        "Submit and read why the canonical order matters.",
      ],
      checkpoints: [
        { id: "v1", label: "Reordered items" },
        { id: "v2", label: "Submitted once" },
        { id: "v3", label: "Read explanation" },
      ],
      expectedResult: "You can reproduce the order from memory after one retry.",
      failureModes: ["Random order without reasoning"],
      hints: ["IR: prepare → detect → contain → eradicate → recover → lessons.", "ZT: verify every request."],
      recoverySteps: ["Hit Retry", "Re-read memory hook below"],
      examConnection: "Ordering PBQs — process and architecture flows.",
      memoryHook: title + " → sequence matters on the exam.",
      orderingCanonical:
        slot % 2 === 0
          ? ["Preparation", "Detection & analysis", "Containment", "Recovery"]
          : ["Identify the asset", "Assess impact & likelihood", "Choose treatment", "Monitor & review"],
    },
    DECISION: {
      difficulty: 3,
      estimatedTimeMin: 6,
      toolsRequired: ["Judgment"],
      objective: `Choose the least-bad first action for a **${term}** situation.`,
      realWorldContext: "Managers freeze — you practice a 30-second decision.",
      environmentType: "BRANCHING_CHOICE",
      stepByStep: [
        "Read the scenario in the lab card.",
        "Pick ONE first response (no multi-task heroics).",
        "Read every branch explanation — the exam punishes ‘feel-good’ wrong order.",
      ],
      checkpoints: [
        { id: "d1", label: "Read scenario" },
        { id: "d2", label: "Committed a choice" },
        { id: "d3", label: "Read why others fail" },
      ],
      expectedResult: "You justify first action with risk, not vibes.",
      failureModes: ["Skipping ‘why wrong’ text"],
      hints: ["First step = contain evidence + stop bleeding, not blame.", "Legal/PR come after safety."],
      recoverySteps: ["Re-open Decision panel for this lesson"],
      examConnection: `Domain ${domain}: BEST / FIRST / MOST LIKELY stems.`,
      memoryHook: "First = safety + evidence + scope.",
    },
    SECURITY_ANALYSIS: {
      difficulty: 3,
      estimatedTimeMin: 10,
      toolsRequired: ["Notepad", "Sample text in UI"],
      objective: `Triage a synthetic alert tied to **${explain.slice(0, 60)}…**`,
      realWorldContext: "SOC hires for pattern recognition — you train on harmless text.",
      environmentType: "TEXT_ANALYSIS",
      stepByStep: [
        "Read the synthetic email/log snippet in the Scenario viewer.",
        "Classify: phishing, misconfig, or user error — pick one primary.",
        "Write one containment action appropriate for an enterprise.",
      ],
      checkpoints: [
        { id: "a1", label: "Read snippet" },
        { id: "a2", label: "Primary classification chosen" },
        { id: "a3", label: "Containment sentence written" },
      ],
      expectedResult: "You prioritized user safety + evidence preservation.",
      failureModes: ["Clicking links in real suspicious mail — never; this lab is text-only"],
      hints: ["Look for sender mismatch, urgency, odd URLs.", "Report via security channel, not reply-all."],
      recoverySteps: ["Re-read snippet", "Compare with lesson phishing traps"],
      examConnection: `Domain ${domain}: social engineering, logging, IR basics.`,
      memoryHook: "Urgency + money + odd sender = pause.",
    },
  };

  const base = templates[category];
  return { id, lessonId, category, ...base };
}

/** ≥2 labs per lesson: static curriculum labs first, then generated to fill. */
export function generateTrainingLabsForLesson(lessonId: string): TrainingLab[] {
  const fromStatic = staticToTraining(lessonId);
  const cats = pickN(CATS, lessonId, "lab-cats", 2);
  const synth: TrainingLab[] = [];
  let slot = 0;
  for (const c of cats) {
    synth.push(synthLab(lessonId, c, slot++));
  }
  const merged = [...fromStatic, ...synth];
  const seen = new Set<string>();
  const out: TrainingLab[] = [];
  for (const L of merged) {
    if (seen.has(L.id)) continue;
    seen.add(L.id);
    out.push(L);
    if (out.length >= 2) break;
  }
  while (out.length < 2) {
    const c = CATS[out.length % CATS.length]!;
    out.push(synthLab(lessonId, c, slot++));
  }
  return out;
}
