import { lessons } from "../data/lessons";
import { hashLessonId } from "./trainingHash";

export type DecisionChoice = {
  id: string;
  text: string;
  isBest: boolean;
  result: string;
  explanation: string;
  examTrap?: string;
};

export type DecisionScenario = {
  id: string;
  lessonId: string;
  title: string;
  scenario: string;
  choices: DecisionChoice[];
  memoryHook: string;
};

export function generateDecisionScenarioForLesson(lessonId: string): DecisionScenario {
  const L = lessons[lessonId];
  const term = L?.highlightRules?.[0]?.term ?? "the control in this section";
  const title = L?.title ?? lessonId;
  const h = hashLessonId(lessonId + "dec");

  const pools: DecisionScenario[] = [
    {
      id: `dec-${lessonId}-exec`,
      lessonId,
      title: `Executive asks you to skip ${term} for speed`,
      scenario: `Leadership wants to ship tonight and asks you to disable a key safeguard related to **${term}** on one server “just for the demo.” What do you do?`,
      choices: [
        {
          id: "a",
          text: "Refuse and document risk; propose compensating monitoring + time-bound exception path.",
          isBest: true,
          result: "Correct — governance + safety.",
          explanation: "You got this right because exam answers reward documented exceptions and compensating controls, not silent bypasses.",
          examTrap: "‘Just once’ bypass is a classic wrong answer.",
        },
        {
          id: "b",
          text: "Disable it quietly so the demo succeeds; re-enable ‘later’.",
          isBest: false,
          result: "High risk — integrity and audit failure.",
          explanation: "You missed this because undocumented changes become permanent and untraceable.",
          examTrap: "Shadow changes are never the ‘best’ choice.",
        },
        {
          id: "c",
          text: "Escalate publicly in chat to embarrass leadership.",
          isBest: false,
          result: "Unprofessional — doesn’t reduce risk.",
          explanation: "Use formal risk channels, not drama.",
        },
        {
          id: "d",
          text: "Quit on the spot without handoff.",
          isBest: false,
          result: "Avoids accountability — not the exam’s ‘best’ pattern.",
          explanation: "Professional escalation beats abandonment.",
        },
      ],
      memoryHook: "No silent bypass — document, compensate, time-bound.",
    },
    {
      id: `dec-${lessonId}-vendor`,
      lessonId,
      title: `Vendor pushes remote access for ${title}`,
      scenario: `A vendor wants always-on RDP for maintenance tied to lessons around **${term}**. What is the best pattern?`,
      choices: [
        {
          id: "a",
          text: "Just-in-time access, MFA, session recording, least privilege, time windows.",
          isBest: true,
          result: "Best modern vendor access hygiene.",
          explanation: "You got this right because the exam likes JIT + MFA + narrow scope for third parties.",
        },
        {
          id: "b",
          text: "Shared local admin on all servers for the vendor team.",
          isBest: false,
          result: "Blast radius nightmare.",
          explanation: "Shared admin is a top wrong answer on vendor stems.",
        },
        {
          id: "c",
          text: "VPN to entire internal network 24/7.",
          isBest: false,
          result: "Over-trust — violates least privilege.",
          explanation: "ZT thinking rejects ‘VPN = trusted LAN’ as a whole answer.",
        },
        {
          id: "d",
          text: "Disable logging to speed their work.",
          isBest: false,
          result: "Destroys detective controls.",
          explanation: "Never disable logs for convenience.",
        },
      ],
      memoryHook: "Vendors: JIT, MFA, least privilege, monitor.",
    },
    {
      id: `dec-${lessonId}-user`,
      lessonId,
      title: `User reports possible malware`,
      scenario: `A user thinks they ran something bad related to **${term}** topics. First guided action?`,
      choices: [
        {
          id: "a",
          text: "Isolate endpoint from network; preserve volatile evidence if trained; open ticket to IR.",
          isBest: true,
          result: "Contain + preserve + route.",
          explanation: "You got this right because containment precedes deep forensics in IR questions.",
        },
        {
          id: "b",
          text: "Let them keep working to ‘not lose productivity’.",
          isBest: false,
          result: "Spread risk.",
          explanation: "Availability panic often creates integrity loss.",
        },
        {
          id: "c",
          text: "Ask them to run more unknown tools from the internet.",
          isBest: false,
          result: "Worsens compromise.",
          explanation: "Stop interactive use first.",
        },
        {
          id: "d",
          text: "Format the datacenter.",
          isBest: false,
          result: "Disproportionate without scope.",
          explanation: "Scope before eradication.",
        },
      ],
      memoryHook: "User malware: isolate, preserve, escalate.",
    },
  ];

  return pools[h % pools.length]!;
}
