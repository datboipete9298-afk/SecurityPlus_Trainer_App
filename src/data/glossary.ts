/** Beginner-friendly glossary for tooltips and /start-here links */
export const GLOSSARY: Record<
  string,
  { term: string; plainEnglish: string; oneLineExam?: string; related?: string[] }
> = {
  asset: {
    term: "Asset",
    plainEnglish: "Anything valuable you protect: data, servers, people’s time, reputation, money.",
    oneLineExam: "Stems often name an asset, then ask which control *best* fits.",
    related: ["risk", "control"],
  },
  threat: {
    term: "Threat",
    plainEnglish: "Something that *could* cause harm: attacker, storm, accident, or mistake.",
    oneLineExam: "Pick threat *types* (insider, nation-state) vs *vulnerabilities* (unpatched bug).",
    related: ["vulnerability", "risk"],
  },
  vulnerability: {
    term: "Vulnerability",
    plainEnglish: "A weakness that could be used against you: bad config, unpatched software, no MFA.",
    oneLineExam: "CVE/patch/misconfig stories are usually *vulnerability* language.",
    related: ["threat", "risk"],
  },
  risk: {
    term: "Risk",
    plainEnglish: "The chance and impact of something bad. You *reduce* risk; you rarely delete it 100%.",
    oneLineExam: "Risk = f(likelihood, impact) — expect ‘residual’ risk after controls.",
    related: ["control", "threat"],
  },
  control: {
    term: "Control (safeguard)",
    plainEnglish: "A policy, process, or tool that *reduces* risk: firewall, training, lock, log review.",
    oneLineExam: "Know *type* (technical/managerial/operational/physical) vs *function* (prevent/detect/correct).",
    related: ["asset", "risk"],
  },
  authentication: {
    term: "Authentication (AuthN)",
    plainEnglish: "Proving *who* you are: password, MFA, smart card, biometrics.",
    oneLineExam: "Wrong password = **AuthN**; valid login + no rights = **AuthZ**.",
    related: ["authorization", "accounting"],
  },
  authorization: {
    term: "Authorization (AuthZ)",
    plainEnglish: "What you’re *allowed* to do *after* you’re known: file share, role, 403 errors.",
    oneLineExam: "403/permission/role/ACL = almost always **AuthZ** if login worked.",
    related: ["authentication", "control"],
  },
  encryption: {
    term: "Encryption",
    plainEnglish: "Scramble data so only someone with the right key can read it (confidentiality, sometimes integrity).",
    oneLineExam: "At rest = disk/DB; in transit = TLS/VPN. Don’t confuse with *hashing* for passwords.",
    related: ["hashing", "key"],
  },
  hashing: {
    term: "Hashing / hash",
    plainEnglish: "A fingerprint of data. Change one bit → different hash. Used for integrity and (carefully) passwords.",
    oneLineExam: "Digital signatures, file integrity, password storage — not a substitute for all encryption use cases.",
    related: ["encryption", "non-repudiation"],
  },
  network: {
    term: "Network",
    plainEnglish: "How devices connect and share traffic: LAN, Wi‑Fi, internet, data center fabric.",
    oneLineExam: "Segmentation, least privilege, and monitoring show up in architecture stems.",
    related: ["port", "protocol"],
  },
  port: {
    term: "Port",
    plainEnglish: "A number (e.g. 80, 443) so the OS knows which *program* should get which traffic.",
    oneLineExam: "‘Allow 443 to web server’ = exposure / firewall / hardening, not a physical door.",
    related: ["protocol", "firewall"],
  },
  protocol: {
    term: "Protocol",
    plainEnglish: "Agreed rules for how systems talk: TCP/IP, TLS, IPsec, DNS, SMTP.",
    oneLineExam: "Match the *layer* (L7 app vs L3 network) the stem describes.",
    related: ["port", "encryption"],
  },
  log: {
    term: "Log (logging)",
    plainEnglish: "A record of events: who, what, when. Used for **detect** and investigations.",
    oneLineExam: "SIEM/telemetry = detective + triage, not a substitute for *prevent* by itself.",
    related: ["incident", "control"],
  },
  incident: {
    term: "Incident (security event)",
    plainEnglish: "A confirmed or likely security problem you respond to: contain, evict, recover, learn.",
    oneLineExam: "IR order: detect → contain → eradicate → recover → lessons learned (NIST-rough).",
    related: ["log", "control"],
  },
  accounting: {
    term: "Accounting (AAA, 4th A)",
    plainEnglish: "Tracking *what* was done: session length, bytes, billing, audit of access.",
    oneLineExam: "RADIUS *accounting* / chargeback = classic pattern.",
    related: ["authentication", "authorization"],
  },
  firewall: {
    term: "Firewall",
    plainEnglish: "A control that *filters* network traffic (often L3/L4) between zones by rule.",
    oneLineExam: "Default deny + allow-list beats ‘permit all’ stories.",
    related: ["port", "segmentation"],
  },
  segmentation: {
    term: "Segmentation / micro-segmentation",
    plainEnglish: "Splitting the network so a breach can’t move everywhere (smaller ‘blast radius’).",
    oneLineExam: "Zero trust + East-West = exams love ‘limit lateral movement’ phrasing.",
    related: ["network", "zero trust"],
  },
  "zero trust": {
    term: "Zero Trust",
    plainEnglish: "No implicit trust from ‘being inside the office.’ Verify every access with identity + context.",
    oneLineExam: "‘VPN alone = ZT’ is often a **trap**; verify continuously per resource.",
    related: ["authentication", "segmentation"],
  },
};

export const GLOSSARY_KEYS = Object.keys(GLOSSARY);

export function findGlossaryKeysInText(text: string): string[] {
  const t = text.toLowerCase();
  return GLOSSARY_KEYS.filter((k) => t.includes(k.replace(/ /g, " ")) || (k.includes(" ") && t.includes(k)));
}
