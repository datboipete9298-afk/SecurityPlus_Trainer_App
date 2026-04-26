import type { DomainId, QuizQuestion } from "../types";

export type BossDef = {
  id: string;
  name: string;
  scenario: string;
  relatedLessons: string[];
  domain: DomainId;
  xpReward: number;
  questions: (Omit<QuizQuestion, "lessonId" | "domain"> & { lessonId: string; domain: DomainId })[];
};

function bq(
  id: string,
  lessonId: string,
  domain: DomainId,
  text: string,
  options: [string, string, string, string],
  correctIndex: 0 | 1 | 2 | 3,
  explanation: string
): QuizQuestion {
  const w = options.map((o, i) =>
    i === correctIndex ? "This option matches the intended pattern." : `“${o.slice(0, 40)}…” is a weaker/irrelevant fit for the stem.`
  );
  return {
    id,
    lessonId,
    domain,
    type: "best",
    difficulty: 3,
    text,
    options: [...options],
    correctIndex,
    explanation,
    wrongExplanations: w,
    examKeyword: "boss, decision, scenario",
  };
}

export const BOSS_FIGHTS: BossDef[] = [
  {
    id: "boss-controls",
    name: "Security Controls Boss",
    scenario:
      "A hospital cannot patch a legacy device. The board wants ‘no risk’ and asks for a single control to buy. You must decide what to do *first* in the real world.",
    relatedLessons: ["1-1"],
    domain: "1",
    xpReward: 120,
    questions: [
      bq("boss-ctrl-1", "1-1", "1", "The legacy device is network-connected. The BEST *immediate* layer before anything else is often:", [
        "A compensating + segmentation story (block/limit paths + monitor)",
        "Delete the device without a replacement plan",
        "Rely on the vendor marketing PDF as a control",
        "Disable all logging to reduce ‘noise’",
      ], 0, "Segmentation + compensating/ detective monitoring is a classic when patching is infeasible."),
      bq("boss-ctrl-2", "1-1", "1", "The policy is signed but not enforced. This gap is most aligned with:", [
        "Operational failure to execute, not 'lack of a PDF'",
        "Purely physical access control by default",
        "Encryption at rest of unrelated archives",
        "Buying a WAF for internal east-west",
      ], 0, "Paper policy without process is a managerial/operational execution gap; fix how it runs."),
      bq("boss-ctrl-3", "1-1", "1", "A written risk acceptance with compensating logging is an example of:", [
        "Risk treatment and governance documentation—still a control story",
        "Elimination of all residual risk",
        "Proof the device is unhackable",
        "Replacing the need for network segmentation",
      ], 0, "Compensating + documented acceptance = common exam-style maturity."),
      bq("boss-ctrl-4", "1-1", "1", "Which is the strongest *type vs function* discipline check?", [
        "Ask: is the stem testing how implemented (T/M/O/Phy) or when it acts (prevent/detect/correct)?",
        "Always pick 'technical' for speed",
        "Always pick 'deterrent' for humans",
        "Ignore the stem’s timeline words",
      ], 0, "Axis match is a core 1.1 pattern."),
      bq("boss-ctrl-5", "1-1", "1", "After segmentation, a SIEM rule fires on anomalous traffic. That control function is primarily:", [
        "Detective (with possible corrective playbooks after triage)",
        "Preventive only",
        "Physical only",
        "Purely managerial with no technology",
      ], 0, "Monitoring/alerts = detective, even if the response is corrective later."),
    ],
  },
  {
    id: "boss-cia",
    name: "CIA Triad Boss",
    scenario: "Three incidents: leaked HR file, defaced public page, and payroll offline. Match primary CIA impacts without mixing ‘cool’ but secondary losses.",
    relatedLessons: ["1-2-cia"],
    domain: "1",
    xpReward: 120,
    questions: [
      bq("boss-cia-1", "1-2-cia", "1", "Leaked file posted on pastebin. PRIMARY pillar:", ["Confidentiality", "Availability", "Accounting", "Obfuscation"], 0, "Disclosure to unauthorized = confidentiality."),
      bq("boss-cia-2", "1-2-cia", "1", "Home page replaced with political text; server still up. PRIMARY pillar:", ["Integrity", "Confidentiality", "Physical security", "Scalability"], 0, "Tampered content = integrity."),
      bq("boss-cia-3", "1-2-cia", "1", "DDoS makes HR portal time out all day. PRIMARY pillar:", ["Availability", "Integrity", "Key exchange", "PKI"], 0, "Inability to access the service = availability."),
      bq("boss-cia-4", "1-2-cia", "1", "Ransomware encrypts files; users can’t open them. *Primary* in many CompTIA stems is:", ["Availability (and also integrity in some—read the stem for primary ‘loss’ first)", "Only confidentiality", "Only physical", "Only auditing"], 0, "Ransomware questions often test whether you know access denial vs tampering; pick primary as stem stresses."),
      bq("boss-cia-5", "1-2-cia", "1", "Sensitive salary spreadsheet emailed to the wrong address internally. Most direct loss:", ["Confidentiality", "Integrity of DNS", "Physical theft of keyboard", "DHCP scope"], 0, "Wrong recipients = disclosure risk first."),
    ],
  },
  {
    id: "boss-crypto",
    name: "Crypto Boss",
    scenario: "TLS + signing + key lifecycle decisions under pressure.",
    relatedLessons: ["1-4-pki", "1-4-enc", "1-4-kex", "1-4-hash"],
    domain: "1",
    xpReward: 150,
    questions: [
      bq("boss-cr-1", "1-4-pki", "1", "A server private key is stolen. The BEST immediate org response includes:", [
        "Revocation + issue new + audit scope of misuse",
        "Change site font colors",
        "Disable HTTPS because TLS is 'too hard'",
        "Post the new key on a public pastebin",
      ], 0, "Key compromise = revoke and reissue, incident scope, and trust chain work."),
      bq("boss-cr-2", "1-4-kex", "1", "You want to limit decrypting old captured sessions if a long-term key leaks later. You’d emphasize:", [
        "Ephemeral session key exchange (forward secrecy) where applicable",
        "Static pre-shared key forever",
        "Disabling all logging",
        "Storing the master key in a sticky note for recovery",
      ], 0, "PFS/ECDHE family patterns protect past sessions in many designs."),
      bq("boss-cr-3", "1-4-hash", "1", "A digital signature primarily proves which pair on the exam?", [
        "Origin/authenticity + integrity of the signed data (in typical designs)",
        "Confidentiality of plaintext without any encryption",
        "Physical access",
        "MAC address of the printer",
      ], 0, "Signing demonstrates origin and content integrity; encryption is separate if needed."),
      bq("boss-cr-4", "1-4-enc", "1", "Laptop with PII is stolen. The strongest *at-rest* theme for exam answers is:", [
        "Full-disk encryption + key custody + access logging",
        "Change desktop wallpaper to 'secured'",
        "Rely on BIOS password as sole control",
        "Store keys in a spreadsheet named keys.txt for recovery",
      ], 0, "FDE/KMS and custody beat cosmetic controls."),
      bq("boss-cr-5", "1-4-pki", "1", "Chain validation shows unknown issuer. Best interpretation:", [
        "Trust anchor missing/ misconfigured, or untrusted/ private PKI in wrong store",
        "The site is 'more secure' because it is custom",
        "Ignore—browsers are always wrong",
        "Always click through because speed matters",
      ], 0, "Trust path problems are classic cert/trust store material."),
    ],
  },
  {
    id: "boss-phish",
    name: "Phishing Boss",
    scenario: "Inbox, SMS, and voice pretexts — pick layered defenses, not a magic bullet.",
    relatedLessons: ["2-2-ph", "2-2-vec"],
    domain: "2",
    xpReward: 130,
    questions: [
      bq("boss-ph-1", "2-2-ph", "2", "A realistic finance vendor domain asks for a wire. BEST next step for staff:", [
        "Out-of-band verification using a known good contact path",
        "Wire immediately to avoid angering the 'CEO on a plane'",
        "Trust caller ID fully",
        "Click the tracking pixel to confirm 'legitimacy'",
      ], 0, "Verify via known channel: classic BEC control."),
      bq("boss-ph-2", "2-2-ph", "2", "MFA stops some ATO, but a persuasive phish for session cookies is still a risk. Best umbrella answer:", [
        "Layered: training + link protections + phish-resistant MFA + response playbooks",
        "Only annual posters",
        "Remove email entirely",
        "Rely on users never clicking (unmeasurable)",
      ], 0, "No single control is whole story."),
      bq("boss-ph-3", "2-2-vec", "2", "Smishing to an exec mobile: BEST org response to reduce repeat success:", [
        "Security awareness for mobile lures + blocks/safe links where supported + runbooks",
        "Ban all SMS company-wide",
        "Tell execs they are 'too smart' to be targeted",
        "Disable 2G only (unrelated to smishing in most stems)",
      ], 0, "Layered + realistic — can't ban SMS in many businesses."),
      bq("boss-ph-4", "2-2-imp", "2", "A caller ID shows your bank. You need to 'verify' a transfer. The safe pattern is:", [
        "Call back a number from your official statement/website, not the inbound claim",
        "Use the phone number the caller just gave you in chat",
        "Read your full SSN to 'prove' identity to them",
        "Install remote support software on request from unknown",
      ], 0, "Out-of-band and known-good callback path."),
      bq("boss-ph-5", "2-2-ph", "2", "Users report a landing page that clones your login. Short-term containment includes:", [
        "Takedown/ blocklist/ sinkhole as feasible + comms to users + IR review of cred risk",
        "Tell users to log in more to test",
        "Post credentials in chat to 'prove' you read the email",
        "Wait a month to see if it goes away",
      ], 0, "Reduce exposure, communicate, and assess ATO/credential impact."),
    ],
  },
  {
    id: "boss-malware",
    name: "Malware Boss",
    scenario: "From droppers to C2: detection and containment on an endpoint you manage.",
    relatedLessons: ["2-4-mal", "2-4-vw", "2-4-ioc"],
    domain: "2",
    xpReward: 130,
    questions: [
      bq("boss-ml-1", "2-4-mal", "2", "A host beacons to a domain generated daily. A strong *detection* concept is:", [
        "Behavior/IoA + network analytics beyond static hash AV only",
        "Unplug the internet for the whole company forever",
        "Format every PC hourly",
        "Ignore EDR as 'noisy'",
      ], 0, "C2 agility pushes detections to behavior, intel, and EDR, not one hash forever."),
      bq("boss-ml-2", "2-4-ioc", "2", "You have a malicious file hash. Best use first in triage:", [
        "Hunt for other appearances + scope + block at controls that support it",
        "Post the hash to social for likes",
        "Assume it only exists on one host with no need to check",
        "Delete logs to save disk",
      ], 0, "IoC pivot and scope is the exam pattern."),
      bq("boss-ml-3", "2-4-vw", "2", "A worm is spreading across a flat subnet. First architectural answer theme:", ["Segment + patch + block lateral movement paths", "Disable DNS globally", "Assign every host a /32 only", "Turn off NTP for 'stealth'"], 0, "Segmentation/visibility + patching are classic exam layers."),
      bq("boss-ml-4", "2-4-om", "2", "A trojan installed via signed-but-unwanted bundle. Lesson:", ["User consent + app vetting + EDR; signing ≠ safety by itself", "Signing means malware cannot exist", "Block all software updates", "Auto-trust 'free' software"], 0, "Signed junkware and trojanized tools still need governance."),
      bq("boss-ml-5", "2-4-mal", "2", "Persistence via scheduled task + registry run key. *Detection* leans on:", ["Autoruns-style visibility + EDR on create/modify of persistence", "Only ping tests", "Turning off Task Scheduler for everyone", "Asking the malware politely to stop"], 0, "Persistence is an IoA/behavior story."),
    ],
  },
  {
    id: "boss-ports",
    name: "Ports Boss",
    scenario: "Service exposure and firewall policy — least exposure wins.",
    relatedLessons: ["2-4-dnsa", "2-4-onp", "2-5-seg"],
    domain: "2",
    xpReward: 120,
    questions: [
      bq("boss-pt-1", "2-5-seg", "2", "A public web app only needs 443. The firewall should:", [
        "Default deny; allow 443 to the specific target; no broad RDP/SSH from internet",
        "Allow all from 'trusted countries'",
        "Open 22/3389/445 for convenience",
        "Allow inbound from 0.0.0.0/0 to all ports to reduce tickets",
      ], 0, "Least exposure + allow-list patterns."),
      bq("boss-pt-2", "2-4-dnsa", "2", "DNS resolves your bank to a new IP. Think:", ["On-path/ poison/ hijack class issues + use trusted resolvers/ DNSSEC (concept) + validate", "Ignore—DNS can’t be wrong", "Always disable DNSSEC because it is slow in marketing slides", "Use hosts file for everyone for scale"], 0, "Name resolution integrity is a classic vector."),
      bq("boss-pt-3", "2-4-onp", "2", "Proxy doing SSL inspection: risk if not done carefully includes:", [
        "Trust store / chain issues + privacy/compliance + key custody for middleboxes",
        "It makes all attacks impossible by magic",
        "It removes the need for endpoint protection",
        "It guarantees zero latency",
      ], 0, "TLS inspection is powerful but not free of governance/custody concerns."),
      bq("boss-pt-4", "2-5-seg", "2", "Micro-seg’s main story on Zero Trust is:", ["Blast-radius reduction + east-west control", "Bigger flat networks are safer", "Remove all firewalls to go faster", "One giant VLAN for 'trust'"], 0, "Smaller trust zones, verify each hop—ZT aligned."),
      bq("boss-pt-5", "2-4-dos", "2", "A volumetric DDoS hits your public IP. First-line exam answers often include:", [
        "Scrubbing/ CDN/ upstream ISP + rate limits + BCP/ comms, not 'patch the DDoS'",
        "Reboot the database without evidence",
        "Block all customers",
        "Disable HTTPS so attackers get bored",
      ], 0, "Availability controls + service provider/edge patterns."),
    ],
  },
  {
    id: "boss-ir",
    name: "Incident Response Boss",
    scenario: "Containment, evidence, and comms in order (NIST-rough).",
    relatedLessons: ["4-ops"],
    domain: "4",
    xpReward: 140,
    questions: [
      bq("boss-ir-1", "4-ops", "4", "You confirm active C2. FIRST priority in many IR playbooks (before 'fixing everything'):", [
        "Contain/ isolate to limit spread while preserving evidence (within policy)",
        "Immediately wipe all storage without a decision record",
        "Announce root cause to press before facts",
        "Delete SIEM to reduce legal exposure",
      ], 0, "Contain and preserve evidence/scope first—triage discipline."),
      bq("boss-ir-2", "4-ops", "4", "Chain of custody for disk images is about:", ["Provenance, integrity, who accessed, sealed evidence handling", "Posting images to a forum", "Emailing a ZIP to personal Gmail", "Renaming files randomly"], 0, "Forensic integrity—exam touchpoint."),
      bq("boss-ir-3", "4-ops", "4", "After containment, communication should:", ["Be coordinated per policy, factual, and avoid breaking legal holds", "Blame a vendor in public first", "Share full PCAP with all staff on chat", "Promise '100% no data touched' if unknown"], 0, "Coordination, legal/privacy, and accuracy are exam themes."),
      bq("boss-ir-4", "4-ops", "4", "Lessons learned *purpose* is:", ["Improve runbooks, controls, and training based on what actually failed", "Hide mistakes", "Fire someone publicly every time", "Ignore because incident is 'closed'"], 0, "Continuous improvement loop for IR."),
      bq("boss-ir-5", "4-ops", "4", "A SIEM alert is noisy. Best practice direction:", ["Tune + prioritize + threat-intel + SOAR (concept) to reduce false positives *without* blind delete", "Delete the SIEM", "Set alert threshold to 0 to get fewer alerts", "Only alert on weekends"], 0, "Tuning, not discarding, is mature ops."),
    ],
  },
  {
    id: "boss-grc",
    name: "GRC Boss",
    scenario: "Policy vs exception vs law — pick balanced answers that match realistic audit language.",
    relatedLessons: ["5-0", "5-grc"],
    domain: "5",
    xpReward: 120,
    questions: [
      bq("boss-gr-1", "5-grc", "5", "A new law applies to customer data. Best first alignment step is:", [
        "Gap analysis: map controls + data inventory + document owners",
        "Buy a 'compliance in a box' with no data mapping",
        "Ignore it until a breach",
        "Delete customer data to remove obligation",
      ], 0, "Governance starts with scoping, inventory, and gap to requirement."),
      bq("boss-gr-2", "5-0", "5", "Risk register updates after an audit should reflect:", [
        "Owners, due dates, treatments, and residual risk—live document",
        "A single red stamp 'fixed'",
        "Only marketing tone",
        "No documentation",
      ], 0, "GRC = accountability and traceability."),
      bq("boss-gr-3", "5-grc", "5", "Data classification primarily helps you:", [
        "Apply the right *controls* proportionally to sensitivity",
        "Print nicer labels on folders with no effect",
        "Remove encryption requirements",
        "Guarantee zero breaches",
      ], 0, "Classification drives *proportionality* in controls and handling."),
      bq("boss-gr-4", "5-grc", "5", "A privacy program overlap with security is *least* about:", [
        "Printing cooler posters only",
        "Minimization, retention, lawful basis, DSAR/rights (jurisdiction context)",
        "Protecting PII/PHI/PCI contexts per policy",
        "Transparency and user trust",
      ], 0, "Distractor: 'posters only' is not a program."),
      bq("boss-gr-5", "5-grc", "5", "Policy exception approval should be:", ["Time-bound, risk-owned, and reviewed with compensating controls as needed", "Permanent with no follow-up", "Oral only", "Anonymous"], 0, "Exception governance pattern."),
    ],
  },
  {
    id: "boss-final",
    name: "Final Security+ Boss",
    scenario: "A composite day-1: zero trust, crypto, DDoS, and a policy exception — chain the *best* answers.",
    relatedLessons: ["1-2-zt", "1-4-enc", "2-4-dos", "1-1"],
    domain: "1",
    xpReward: 300,
    questions: [
      bq("boss-fn-1", "1-2-zt", "1", "Which aligns with ZT for SaaS after password?", [
        "Device posture + contextual policy per resource, not 'LAN trust by default'",
        "Trust all VPN users fully",
        "Use shared local admin everywhere for speed",
        "Disable all MFA to reduce helpdesk work",
      ], 0, "ZT: verify, least privilege, continuous."),
      bq("boss-fn-2", "1-1", "1", "When patching is infeasible, CompTIA often likes:", [
        "Compensating controls + segmentation + monitoring",
        "Hope",
        "Remove antivirus to reduce noise",
        "Set password to 'Password123' for the SCADA HMI 'temporarily'",
      ], 0, "Classical 1.1 compensating with defense-in-depth context."),
      bq("boss-fn-3", "1-4-enc", "1", "S3 bucket is public. Fix theme:", ["Object ACL/bucket policy + org guardrails + inventory scan + process", "It is the cloud provider’s only fault by law of marketing", "Disable logging to hide the bucket", "Make everything public for transparency"], 0, "Config + governance + least privilege, not a blame cloud moment."),
      bq("boss-fn-4", "2-4-dos", "2", "Your edge gets volumetric DDoS. *Best* practical edge answer patterns:", ["Scrub + ISP/CDN + rate limits, plus comms/ BCP, not a random firewall toggle only", "Turn off the website forever", "Email attackers to stop", "Block port 25 only"], 0, "DDoS mitigation services + design patterns."),
      bq("boss-fn-5", "1-2-cia", "1", "A leak, a tamper, and an outage happen in one long stem but asks *primary* first impact on customer trust from altered invoices:", ["Integrity (amounts changed)", "Availability of HR VPN", "Physical key loss", "Printer toner"], 0, "Read *primary* change vs secondary chaos."),
    ],
  },
];

export function getBossDef(id: string) {
  return BOSS_FIGHTS.find((b) => b.id === id);
}
