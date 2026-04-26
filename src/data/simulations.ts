export interface SimStep {
  id: string;
  prompt: string;
  choices: { id: string; text: string; isBest: boolean; why: string }[];
}

export interface Simulation {
  id: string;
  title: string;
  intro: string;
  domain: string;
  steps: SimStep[];
}

export const simulations: Simulation[] = [
  {
    id: "sim-phish-1",
    title: "Junior SOC: suspicious email",
    intro:
      "A user forwards an email: urgent wire transfer, slightly wrong From: domain, link to a look-alike site. You triage in 60 seconds (exam style).",
    domain: "2",
    steps: [
      {
        id: "s1",
        prompt: "FIRST best step before clicking anything:",
        choices: [
          { id: "a", text: "Forward to everyone for awareness", isBest: false, why: "Spreads possible malicious content; not first containment." },
          { id: "b", text: "Verify sender via known contact channel / headers with security policy", isBest: true, why: "Out-of-band verification + safe analysis path is standard for BEC/transfer fraud." },
          { id: "c", text: "Login to the link to see if the portal works", isBest: false, why: "High risk; credentials could be phished." },
        ],
      },
      {
        id: "s2",
        prompt: "The attack is BEST classified as:",
        choices: [
          { id: "a", text: "DoS", isBest: false, why: "No availability flood described." },
          { id: "b", text: "Social engineering / phishing (BEC-style)", isBest: true, why: "User manipulation + look-alike domain." },
          { id: "c", text: "SQLi", isBest: false, why: "Not database injection in story." },
        ],
      },
    ],
  },
  {
    id: "sim-cred-expired",
    title: "Web app: certificate warning",
    intro: "Users see browser warnings for the internal app. The cert expired yesterday. What’s the *primary* risk focus for the helpdesk line?",
    domain: "1",
    steps: [
      {
        id: "s1",
        prompt: "Best *first* action:",
        choices: [
          { id: "a", text: "Tell users to click through the warning to keep working", isBest: false, why: "Trains bad behavior; may be wrong cert/MitM." },
          { id: "b", text: "Engage team to reissue/renew + communicate outage window; verify hostnames match SAN", isBest: true, why: "Fix trust chain + user guidance." },
          { id: "c", text: "Disable TLS site-wide", isBest: false, why: "Worse for confidentiality/integrity in transit." },
        ],
      },
    ],
  },
];
