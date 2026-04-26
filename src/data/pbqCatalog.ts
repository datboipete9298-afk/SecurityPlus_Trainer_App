import type { DomainId } from "../types";

export type PbqScenario = {
  id: string;
  title: string;
  domain: DomainId;
  scenario: string;
  task: string;
  examTests: string;
  /** Correct order top-to-bottom (0-based indices into `items`) */
  type: "order";
  items: string[];
  correctOrder: number[];
  explanation: string;
};

export const PBQ_SCENARIOS: PbqScenario[] = [
  {
    id: "firewall-rules",
    title: "Firewall rule precedence",
    domain: "2",
    scenario:
      "A stateful firewall evaluates rules top-down and stops at the first match. Implicit deny catches anything unmatched.",
    task: "Order the rules so legitimate admin SSH is allowed, guest Wi-Fi cannot reach the database, and everything else falls through to deny.",
    examTests: "Rule base design, least privilege, implicit deny.",
    type: "order",
    items: [
      "Allow IT subnet → server VLAN TCP 22",
      "Deny guest VLAN → database subnet any",
      "Allow internal users → web tier TCP 443",
      "Implicit deny all (not shown on some UIs but always present logically)",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation:
      "Place specific permits and denies before a final catch-all. Exams love ‘first match wins’ plus remembering implicit deny.",
  },
  {
    id: "control-types",
    title: "Control type → example",
    domain: "1",
    scenario: "Map each example to the CompTIA control TYPE (not function).",
    task: "Reorder so each label matches the example in the description trail: policy sign-off, badge reader, SIEM alert rule, security awareness briefing.",
    examTests: "Managerial vs operational vs technical vs physical.",
    type: "order",
    items: [
      "Managerial — AUP signed by employees",
      "Physical — Badge + mantrap at data center",
      "Technical — SIEM correlation rule fires on brute force",
      "Operational — Quarterly phishing simulation run by IT",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation: "Managerial = policy/governance; operational = procedures/people executing; technical = systems; physical = tangible controls.",
  },
  {
    id: "attack-mitigation",
    title: "Attack → mitigation",
    domain: "2",
    scenario: "Pair common attacks with a strong primary mitigation (exam-style ‘best’ answer patterns).",
    task: "Order pairs: Phishing → user training + email filtering; SQLi → parameterized queries; DDoS → scrubbing/rate limits; Unpatched OS → patch + vuln mgmt.",
    examTests: "Threat vs control mapping.",
    type: "order",
    items: [
      "Phishing → layered email filter + training",
      "SQL injection → prepared statements / parameterization",
      "Volumetric DDoS → upstream scrubbing / capacity + filtering",
      "Missing critical patches → patch management + compensating monitoring",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation: "Exams reward the mitigation that directly removes the root cause (parameterization for SQLi) vs generic answers.",
  },
  {
    id: "ir-phases",
    title: "Incident response phases",
    domain: "4",
    scenario: "NIST-style IR: prepare before chaos; then detect, analyze, contain, eradicate, recover, post-incident.",
    task: "Order the phases for a first pass timeline.",
    examTests: "IR lifecycle ordering on drag/drop PBQs.",
    type: "order",
    items: ["Preparation", "Detection & analysis", "Containment", "Eradication", "Recovery", "Lessons learned"],
    correctOrder: [0, 1, 2, 3, 4, 5],
    explanation: "You cannot skip to eradication before containment on scored items; lessons learned closes the loop.",
  },
  {
    id: "log-sources",
    title: "Log source identification",
    domain: "4",
    scenario: "An analyst needs the best source to prove who changed a group policy object.",
    task: "Order by usefulness: Domain controller security log → centralized SIEM normalized event → endpoint EDR process tree → switch MAC table.",
    examTests: "Evidence sources, Windows event IDs concepts, centralized logging.",
    type: "order",
    items: [
      "DC security log (directory changes)",
      "SIEM aggregated GPO change alert",
      "EDR on admin workstation (tool execution)",
      "Access switch CAM table (least relevant for GPO)",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation: "Directory services logs beat a switch table for identity/policy changes; SIEM adds correlation across hosts.",
  },
  {
    id: "ports-protocols",
    title: "Port / protocol",
    domain: "3",
    scenario: "Match common services to their default ports (UDP/TCP nuances show up as traps).",
    task: "Order: DNS 53, HTTPS 443, SSH 22, RDP 3389.",
    examTests: "Well-known ports, firewall / segmentation PBQs.",
    type: "order",
    items: ["DNS — 53 (TCP/UDP)", "HTTPS — 443/TCP", "SSH — 22/TCP", "RDP — 3389/TCP"],
    correctOrder: [0, 1, 2, 3],
    explanation: "Memorize the big five repeatedly tested; watch for ‘DNS uses only UDP’ traps — zone transfers use TCP.",
  },
  {
    id: "segmentation",
    title: "Segmentation placement",
    domain: "3",
    scenario: "Place trust zones from most exposed to most sensitive for a classic three-tier web app.",
    task: "Order: Internet-facing web → application logic → database; management jump host isolated.",
    examTests: "DMZ vs internal, PCI-style segmentation.",
    type: "order",
    items: [
      "Public web tier (DMZ)",
      "Application tier (internal)",
      "Database tier (most restricted)",
      "Mgmt / jump host on separate admin network",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation: "Data has smallest blast radius; management is out-of-band from user traffic in ideal designs.",
  },
  {
    id: "risk-treatment",
    title: "Risk treatment",
    domain: "5",
    scenario: "Pick the treatment pattern: avoid, transfer, mitigate, accept.",
    task: "Order examples: cyber insurance → transfer; decommission legacy app → avoid; patch + MFA → mitigate; low-impact residual → accept.",
    examTests: "GRC, risk register vocabulary.",
    type: "order",
    items: [
      "Transfer — purchase cyber insurance",
      "Avoid — retire the vulnerable system entirely",
      "Mitigate — patch, segment, add MFA",
      "Accept — document low-likelihood residual after leadership sign-off",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation: "Exams test precise vocabulary; ‘accept’ always implies documented business decision.",
  },
  {
    id: "certificate-flow",
    title: "Certificate troubleshooting",
    domain: "3",
    scenario: "A browser warns ‘certificate invalid’. Narrow causes from broad to specific checks.",
    task: "Order: verify system clock → check CN/SAN vs URL → confirm chain to trusted root → inspect revocation (OCSP/CRL).",
    examTests: "PKI troubleshooting PBQs.",
    type: "order",
    items: [
      "Validate workstation time skew",
      "Compare hostname to cert SAN/CN",
      "Trace issuing chain to trusted root",
      "Check revocation status / pinning mismatches",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation: "Clock skew is a fast first check in real ops and on exams; chain issues separate from name mismatch.",
  },
  {
    id: "iam-access",
    title: "IAM / access control",
    domain: "4",
    scenario: "Map concepts to ABAC vs RBAC vs rule examples.",
    task: "Order: RBAC = job title role; ABAC = department + clearance + resource tag; rule = time-of-day network access; mandatory access = label-based (government).",
    examTests: "Access control models, identity federation context.",
    type: "order",
    items: [
      "RBAC — permissions bundled to an engineer role",
      "ABAC — decision uses multiple attributes (dept, data label, geo)",
      "Rule-based — deny file shares after 18:00",
      "MAC — sensitivity labels dominate user discretion",
    ],
    correctOrder: [0, 1, 2, 3],
    explanation: "RBAC is role; ABAC is dynamic attribute evaluation; MAC is label lattice in high-side environments.",
  },
];

export function getPbq(id: string): PbqScenario | undefined {
  return PBQ_SCENARIOS.find((p) => p.id === id);
}
