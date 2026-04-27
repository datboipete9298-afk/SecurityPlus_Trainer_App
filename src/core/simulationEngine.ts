import type { DomainId } from "../types";
import { lessons } from "../data/lessons";
import { hashLessonId, pick } from "./trainingHash";

export type SimKind =
  | "SOC_ANALYST"
  | "INCIDENT_RESPONSE"
  | "PHISHING_TRIAGE"
  | "NETWORK_ATTACK"
  | "IDENTITY_BREACH"
  | "POLICY_DECISION"
  | "RISK_ASSESSMENT"
  | "LOG_ANALYSIS"
  | "ZERO_TRUST_DECISION";

export type SimChoice = {
  id: string;
  text: string;
  nextNodeId: string | "END";
  scoreDelta: number;
  feedback: string;
  examWhy: string;
  /** Narrative consequence chain — wrong = escalation, right = containment */
  outcomeChain?: string;
};

export type SimNode = {
  id: string;
  title?: string;
  narrative: string;
  choices: SimChoice[];
};

export type TrainingSimulation = {
  id: string;
  lessonId: string;
  kind: SimKind;
  title: string;
  intro: string;
  startNodeId: string;
  nodes: Record<string, SimNode>;
  passingScore: number;
  maxScore: number;
};

function ctx(lessonId: string) {
  const L = lessons[lessonId];
  return {
    title: L?.title ?? lessonId,
    term: L?.highlightRules?.[0]?.term ?? "this control",
    domain: (L?.domain ?? "1") as DomainId,
  };
}

function buildLinearSim(
  lessonId: string,
  kind: SimKind,
  idSuffix: string,
  title: string,
  intro: string,
  steps: { narrative: string; best: string; wrong: [string, string] }[],
): TrainingSimulation {
  const nodes: Record<string, SimNode> = {};
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i]!;
    const id = `n${i}`;
    const next = i < steps.length - 1 ? `n${i + 1}` : "END";
    const [w1, w2] = s.wrong;
    const cBest: SimChoice = {
      id: "ok",
      text: s.best,
      nextNodeId: next,
      scoreDelta: 40,
      feedback: "You got this right because you prioritized evidence, safety, and least harm first.",
      examWhy: "You’ll see this on the exam as BEST / FIRST / MOST APPROPRIATE phrasing.",
      outcomeChain:
        "Containment holds: scope stays limited, logs stay intact, leadership gets facts not panic — the kind of outcome auditors and insurers expect.",
    };
    const c1: SimChoice = {
      id: "x1",
      text: w1,
      nextNodeId: next,
      scoreDelta: -15,
      feedback: "You missed this because this action spreads risk or skips verification.",
      examWhy: "Traps reward ‘fast’ but unsafe moves — slow is smooth on the exam.",
      outcomeChain:
        "Escalation path: the blast radius widens, evidence gets muddier, and post-incident review pins the bad call on whoever skipped playbook order.",
    };
    const c2: SimChoice = {
      id: "x2",
      text: w2,
      nextNodeId: next,
      scoreDelta: -10,
      feedback: "Partially plausible, but not the primary exam answer pattern.",
      examWhy: "Look for containment + verification before public drama.",
      outcomeChain:
        "Partial win, partial loss: you slow the fire but leave gaps — attackers or auditors find the hole later and the story gets harder to defend.",
    };
    const bundle = [cBest, c1, c2];
    const rot = hashLessonId(lessonId + id) % 3;
    const choices = [...bundle.slice(rot), ...bundle.slice(0, rot)];
    nodes[id] = { id, narrative: s.narrative, choices };
  }
  const maxScore = steps.length * 40;
  return {
    id: `sim-${lessonId}-${idSuffix}`,
    lessonId,
    kind,
    title,
    intro,
    startNodeId: "n0",
    nodes,
    passingScore: Math.floor(maxScore * 0.55),
    maxScore,
  };
}

/** Two branching simulations per lesson — kinds rotate by lesson hash. */
export function generateTrainingSimulationsForLesson(lessonId: string): TrainingSimulation[] {
  const { term, domain, title } = ctx(lessonId);
  const k1 = pick(
    [
      "SOC_ANALYST",
      "PHISHING_TRIAGE",
      "LOG_ANALYSIS",
      "NETWORK_ATTACK",
      "IDENTITY_BREACH",
    ] as const,
    lessonId,
    "sk1",
  );
  const k2 = pick(
    [
      "INCIDENT_RESPONSE",
      "POLICY_DECISION",
      "RISK_ASSESSMENT",
      "ZERO_TRUST_DECISION",
    ] as const,
    lessonId,
    "sk2",
  );

  const simA = simFactory(lessonId, k1, "a", term, domain, title);
  const simB = simFactory(lessonId, k2, "b", term, domain, title);
  return [simA, simB];
}

function simFactory(
  lessonId: string,
  kind: SimKind,
  suffix: string,
  term: string,
  _domain: DomainId,
  lessonTitle: string,
): TrainingSimulation {
  switch (kind) {
    case "SOC_ANALYST":
      return buildLinearSim(lessonId, kind, suffix, `SOC desk: ${lessonTitle}`, "Tickets are piling up — triage like the exam wants: evidence, scope, escalate.", [
        {
          narrative: `Alert: multiple failed logins for CFO account from new country. Related to **${term}**. First move?`,
          best: "Contain session / disable risky auth path per playbook; preserve logs; notify IR lead.",
          wrong: ["Email the CFO the password", "Ignore — it’s probably travel"],
        },
        {
          narrative: "Logs show successful login after failures. What do you document first?",
          best: "Timeline + source IP + user agent + correlation id for handoff.",
          wrong: ["Delete old logs to save space", "Close ticket as benign without evidence"],
        },
      ]);
    case "INCIDENT_RESPONSE":
      return buildLinearSim(lessonId, kind, suffix, `IR sim: ${lessonTitle}`, "Order matters — don’t jump to eradication before containment.", [
        {
          narrative: `Ransom note on a workstation. **${term}** is in scope. First priority?`,
          best: "Isolate host from network; snapshot evidence if policy allows; notify stakeholders.",
          wrong: ["Pay immediately", "Reimage everything company-wide"],
        },
        {
          narrative: "Containment is live. Next best step?",
          best: "Identify patient zero + lateral movement paths from logs.",
          wrong: ["Post details on social media", "Turn off all firewalls"],
        },
      ]);
    case "PHISHING_TRIAGE":
      return buildLinearSim(lessonId, kind, suffix, `Phishing: ${lessonTitle}`, "Users forward ‘urgent’ mail — you decide safe handling.", [
        {
          narrative: `User clicked a link related to **${term}** topic. They’re panicked. First?`,
          best: "Have user stop interacting; reset session per policy; preserve mail headers for analysis.",
          wrong: ["Ask user to forward to everyone", "Let user keep clicking to ‘confirm’"],
        },
        {
          narrative: "Classification for ticket — primary?",
          best: "Social engineering / phishing — user targeted.",
          wrong: ["Definitely APT nation-state with no evidence", "Hardware failure"],
        },
      ]);
    case "NETWORK_ATTACK":
      return buildLinearSim(lessonId, kind, suffix, `Network stress: ${lessonTitle}`, "Availability vs integrity — pick defenses exam-style.", [
        {
          narrative: `Spike in SYN traffic toward **${term}**-adjacent service. First response idea?`,
          best: "Engage WAF/scrubbing/rate limits with provider; divert if architecture supports it.",
          wrong: ["Unplug the internet for the whole company forever", "Hope it stops"],
        },
        {
          narrative: "After initial choke, what improves long-term resilience?",
          best: "Capacity planning + segmentation + monitoring baselines.",
          wrong: ["Remove all logging for performance", "Single perimeter only"],
        },
      ]);
    case "IDENTITY_BREACH":
      return buildLinearSim(lessonId, kind, suffix, `Identity: ${lessonTitle}`, "Credential abuse paths — think like defender.", [
        {
          narrative: `MFA fatigue + helpdesk resets tied to **${term}**. What’s the exam-smart control theme?`,
          best: "Strong phishing-resistant MFA + helpdesk verification + session revocation.",
          wrong: ["SMS-only MFA forever", "Share admin passwords for speed"],
        },
        {
          narrative: "Suspected token theft. What now?",
          best: "Invalidate sessions, rotate critical secrets per playbook, hunt lateral movement.",
          wrong: ["Tell users to ignore alerts", "Disable MFA globally"],
        },
      ]);
    case "POLICY_DECISION":
      return buildLinearSim(lessonId, kind, suffix, `Policy: ${lessonTitle}`, "GRC tone — acceptable risk vs mandate.", [
        {
          narrative: `A vendor wants blanket exemption from **${term}** controls. Best stance?`,
          best: "Document exception with compensating controls + owner + expiry.",
          wrong: ["Verbal okay with no record", "Reject all vendors outright"],
        },
        {
          narrative: "Auditor asks for evidence of policy review. You provide?",
          best: "Versioned policy, approval trail, attestation dates.",
          wrong: ["A screenshot of a chat", "‘We talked about it’"],
        },
      ]);
    case "RISK_ASSESSMENT":
      return buildLinearSim(lessonId, kind, suffix, `Risk: ${lessonTitle}`, "Quantify qualitatively if needed — exam loves treatment verbs.", [
        {
          narrative: `Legacy app can’t patch — tied to **${term}**. Best treatment pattern?`,
          best: "Mitigate + compensate (segment, monitor, alternate controls) + document residual.",
          wrong: ["Pretend risk is zero", "Hide from the risk register"],
        },
        {
          narrative: "Business accepts residual risk. Required?",
          best: "Signed acceptance + review date + triggers for re-assessment.",
          wrong: ["Silent acceptance", "Delete the risk entry"],
        },
      ]);
    case "LOG_ANALYSIS":
      return buildLinearSim(lessonId, kind, suffix, `Logs: ${lessonTitle}`, "Pattern → hypothesis → action.", [
        {
          narrative: `SIEM rule fires: spikes of 4625 then single 4624 on admin. Connect to **${term}**.`,
          best: "Assume credential attack — disable account pending verification; preserve logs.",
          wrong: ["Ignore 4625 as noise", "Announce breach publicly immediately"],
        },
        {
          narrative: "You need one more artifact to escalate. Best?",
          best: "Correlate source IP across VPN, endpoint, and identity provider logs.",
          wrong: ["Delete duplicates in SIEM", "Turn off the rule"],
        },
      ]);
    case "ZERO_TRUST_DECISION":
    default:
      return buildLinearSim(lessonId, "ZERO_TRUST_DECISION", suffix, `Zero Trust: ${lessonTitle}`, "Verify explicitly — no implicit LAN trust.", [
        {
          narrative: `Remote user requests access to **${term}** data. ZT-aligned first check?`,
          best: "Identity + device posture + least privilege + continuous verification.",
          wrong: ["VPN means trusted", "LAN IP = trusted"],
        },
        {
          narrative: "After access granted, something changes (posture drops). Best?",
          best: "Re-verify or step-down permissions / re-auth per policy.",
          wrong: ["Ignore until weekly review", "Grant permanent admin"],
        },
      ]);
  }
}
