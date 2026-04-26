import type { Lesson } from "../types";
import { makeLesson } from "./lessonFactory";

const hi = (term: string, meaning: string, importance: "must" | "should" | "good" = "must") => ({ term, meaning, importance });

function vuln(
  id: string,
  title: string,
  k: { def: string; layer: string; mit: string; kw: [string, string] }
): Lesson {
  return makeLesson(id, title, "2", {
    videoFocus: [
      `How stems describe **${k.def}** in logs, code, or architecture`,
      `Where the weakness lives: **${k.layer}**`,
      `Primary mitigations: **${k.mit}** (keywords for ‘best’ answers)`,
    ],
    simpleExplanation: `**${k.def}** is a common SY0-701 vulnerability class. The exam will tell a *short* story: missing validation, bad update, or race window. You pick the *named* flaw and the *best* control—usually defense-in-depth, least privilege, patching, and secure design patterns—not a random firewall reference.`,
    highlightRules: [
      hi("Definition", `Know ${k.def} in one line without jargon soup.`, "must"),
      hi("Layer", k.layer, "must"),
      hi("Fix first", k.mit, "should"),
    ],
    writeDown: `1) One-line def of ${k.def}. 2) One log/symptom phrase. 3) One mitigating control. 4) One exam keyword.`,
    examTraps: [
      { a: "Add more firewall = always enough", b: "Many vulns are app/input/process issues" },
      { a: "One vendor name from marketing", b: "Choose control type that matches stem" },
    ],
    instantRecognition: [
      { keyword: k.kw[0], answer: "Linked to this topic" },
      { keyword: k.kw[1], answer: "Common distractor or confirm" },
    ],
    threeSecondRecall: [k.def.split(" ")[0] ?? "Topic", "Symptom", "Mitigation"],
    quickAction: `Find one news headline touching ${k.def}; name one control the article implies.`,
    miniQuizIntro: "Scenario and definition for this vulnerability class.",
    teachBackPrompt: `Teach **${k.def}** as if a junior admin confused it with a patch window issue.`,
  });
}

function atk(
  id: string,
  title: string,
  k: { def: string; how: string; det: string; kw: [string, string] }
): Lesson {
  return makeLesson(id, title, "2", {
    videoFocus: [
      `Attacker *actions* in **${k.def}** stories`,
      `Detection artifacts: **${k.det}**`,
      "Recovery / containment ties to IR (high level)",
    ],
    simpleExplanation: `**${k.def}** is an attack *pattern* you must match to stems. You’ll know **${k.how}** and the typical **indicators** so you can choose investigation steps and preventive controls, not a vague ‘monitor more’.`,
    highlightRules: [
      hi("Attack signature", k.how, "must"),
      hi("Indicator", k.det, "must"),
      hi("Mitigation direction", "Layered controls, least privilege, updates, and awareness where applicable", "should"),
    ],
    writeDown: `1) What changes in traffic/system when ${k.def} runs? 2) One detective control. 3) One preventive control.`,
    examTraps: [
      { a: "Unrelated OSI layer", b: "Match attack to the right *stage* and tool" },
      { a: "One-click fix product", b: "Process + hardening + validation is common pattern" },
    ],
    instantRecognition: [
      { keyword: k.kw[0], answer: "Attack hint" },
      { keyword: k.kw[1], answer: "Distractor or confirm" },
    ],
    threeSecondRecall: [k.def, "Detect", "Block"],
    quickAction: `Map ${k.def} to one NIST IR phase (in words only).`,
    miniQuizIntro: "Stems: recognize attack + response hook.",
    teachBackPrompt: `Differentiate **${k.def}** from a close cousin attack in 20s.`,
  });
}

function mit25(id: string, title: string, core: string, doList: string): Lesson {
  return makeLesson(id, title, "2", {
    videoFocus: [
      "Practical *layer* you implement (not marketing)",
      "Least privilege, segmentation, baselines, monitoring",
      "Tradeoffs: performance vs security vs usability in stems",
    ],
    simpleExplanation: `**${core}** on Security+ is about selecting *sensible* hardening, segmentation, and response hygiene. You will see ‘best’ questions where the *primary* value is **${doList}** — pick the most direct fix for the loss described, not a distractor in the wrong layer.`,
    highlightRules: [
      hi("Primary control for scenario", "Read loss type first, then control family", "must"),
      hi("Default deny, least privilege", "Applies in many 2.5 answer paths", "must"),
      hi("Test after change", "Validation prevents new gaps", "should"),
    ],
    writeDown: "1) One example per domain object (user, system, data). 2) How you would verify. 3) What log proves it works.",
    examTraps: [
      { a: "MFA fixes every vuln", b: "MFA is strong but not a patch for bad code" },
      { a: "One golden product", b: "CompTIA looks for *types* of controls" },
    ],
    instantRecognition: [
      { keyword: "segment, zone, trust boundary", answer: "Architecture / ZT style" },
      { keyword: "CIS, STIG, baseline", answer: "Hardening family" },
    ],
    threeSecondRecall: ["Classify", "Harden", "Prove"],
    quickAction: "Pick a service: name one segmentation idea and one hardening check.",
    miniQuizIntro: "Tradeoff and *best* control scenarios.",
    teachBackPrompt: "Why is *least privilege* a recurring exam answer in mitigations?",
  });
}

export const domain2Lessons: Record<string, Lesson> = {
  "2-0": makeLesson("2-0", "2.0 Threats, Vulnerabilities, and Mitigations", "2", {
    videoFocus: [
      "Vocabulary: threat agent, threat, vulnerability, risk, likelihood, impact",
      "Map each to an example: phishing (threat) vs unpatched service (vuln)",
      "Mitigation families: people, process, technology",
    ],
    simpleExplanation:
      "Domain 2 is the *story engine* of Security+: a threat exploits a *vulnerability* to impact assets; mitigations *reduce* risk. Your job is to read a stem, label each piece correctly, and pick the *best* mitigation for the *primary* problem—not a nearby keyword.",
    highlightRules: [
      hi("Vulnerability", "Weakness; patchable, design flaw, or misconfiguration", "must"),
      hi("Threat", "Adversary or hazard that could exploit weakness", "must"),
      hi("Risk treatment", "Accept, avoid, transfer, mitigate—know which fits the business story", "should"),
    ],
    writeDown: "1) 3-tuple: threat, vuln, control for one work scenario. 2) Residual risk one line.",
    examTraps: [
      { a: "Vulnerability = virus", b: "Virus is a threat/attack; unpatched code is a vuln" },
      { a: "All risks zero", b: "Not realistic; prioritize and accept sometimes" },
    ],
    instantRecognition: [
      { keyword: "CVE, CVSS, patch", answer: "Vulnerability / patch mgmt" },
      { keyword: "ransomware, phishing", answer: "Threat or attack type" },
    ],
    threeSecondRecall: ["Threat, vuln, impact", "Mitigation reduces risk", "Residual stays"],
    quickAction: "Read one vendor bulletin: name CVE, vuln, and recommended mitigation.",
    miniQuizIntro: "Chain stories: from observation to *best* fix.",
    teachBackPrompt: "Define vulnerability vs threat with non-interchangeable examples.",
  }),
  "2-1": makeLesson("2-1", "2.1 Threat Actors", "2", {
    videoFocus: [
      "Nation-state, criminal, hacktivist, script kiddie, insider, competitor",
      "Capability vs intent: advanced vs opportunistic",
      "Motive drives target selection: money, IP, destruction, rep",
    ],
    simpleExplanation:
      "Know *who* the adversary is: capability (tools, 0-day), *intent* (what they want), and *typical TTP* rough buckets. The exam will not need APT names; it needs *classes* and plausible motives for a scenario (ransom, espionage, disruption).",
    highlightRules: [
      hi("Insider", "Trusted access + motivation = high impact; technical + HR controls", "must"),
      hi("Organized crime", "Ransom, fraud-as-a-service; money-first patterns", "must"),
      hi("Script kiddie", "Low skill, known tools, opportunistic", "should"),
    ],
    writeDown: "1) 4 actor types and one motive each. 2) One sign of insider vs external.",
    examTraps: [
      { a: "Any breach = nation state", b: "Attribution is hard; look for *evidence* in story" },
      { a: "Insider = always malicious", b: "Unintentional insider risk (fat finger, phish) exists" },
    ],
    instantRecognition: [
      { keyword: "APTs, 0-day", answer: "High capability" },
      { keyword: "spray, commodity malware", answer: "Opportunistic" },
    ],
    threeSecondRecall: ["Who", "Why", "How skilled"],
    quickAction: "For one breach headline, label actor + motive in one line each.",
    miniQuizIntro: "Attribution, motive, and control mapping.",
    teachBackPrompt: "Why is insider *different* from external attacker in control design?",
  }),
  "2-2-vec": makeLesson("2-2-vec", "2.2 Common Threat Vectors", "2", {
    videoFocus: [
      "Vector = path: email, web, USB, supply chain, wireless, cloud misconfig",
      "User interaction vs unauthenticated service exploit",
      "Prevention: reduce attack surface, filter, harden, awareness",
    ],
    simpleExplanation:
      "Threat vectors are *ways in*: removable media, untrusted network, social engineering, vulnerable services on the border. The exam will mix vector with *control* — pick the control that *closes that path* (e.g. USB policy + DLP) rather than a generic 'firewall' if the path is inside.",
    highlightRules: [
      hi("Email/web", "Most common: attachments, links, drive-by", "must"),
      { term: "Supply chain", meaning: "Third-party code updates; trust boundaries collapse.", importance: "must" },
      { term: "Wireless", meaning: "Open AP, evil twin, weak WPA — client-side risk in scenarios.", importance: "should" },
    ],
    writeDown: "1) 5 vectors, one example each. 2) The control *closest* to the vector in each case.",
    examTraps: [
      { a: "Block internet = all fixed", b: "Usability + shadow IT risk; often layered" },
      { a: "One AV solves vectors", b: "People + process + EDR, etc." },
    ],
    instantRecognition: [
      { keyword: "USB, autorun, dropped drive", answer: "Removable media vector" },
      { keyword: "maldocs, macro", answer: "Email vector" },
    ],
    threeSecondRecall: ["Path in", "Close path", "Monitor path"],
    quickAction: "List your top 3 ingress paths at home; one control for each.",
    miniQuizIntro: "Vector → control ‘best’ mapping.",
    teachBackPrompt: "Vector vs vulnerability: say both in one company story.",
  }),
  "2-2-ph": makeLesson("2-2-ph", "2.2 Phishing", "2", {
    videoFocus: [
      "Spear, whaling, vishing, smishing, credential harvest pages",
      "Indicators: domain lookalike, pretext, urgency, odd reply-to",
      "Mitigation: training, link protection, MFA, takedown, reporting",
    ],
    simpleExplanation:
      "Phishing tricks a user into doing something *unsafe*: enter creds, run a macro, transfer money, install software. *MFA* reduces account takeover, but *phish-resistant* factors and user reporting matter. Examiners love urgency + authority pretexts.",
    highlightRules: [
      hi("MFA on stolen password", "Stops *some* ATO, not all if session stolen / MFA fatigue", "must"),
      hi("Takedown, DMARC, reporting", "Email ecosystem defenses beyond user alone", "should"),
    ],
    writeDown: "1) 3 phish *channels*. 2) 3 *user* red flags. 2) 2 technical org controls.",
    examTraps: [
      { a: "MFA = phishing impossible", b: "Resistant MFA, session theft, and pretexts remain" },
      { a: "IT will block all phishing", b: "User layer + org controls" },
    ],
    instantRecognition: [
      { keyword: "lookalike domain, idn", answer: "Domain trickery" },
      { keyword: "O365 login clone", answer: "Credential phish" },
    ],
    threeSecondRecall: ["Lure, hook, action", "Report", "Harden auth"],
    quickAction: "Show a friend how to *hover* a link; write the rule in 5 words.",
    miniQuizIntro: "Channel + pretext + control in stems.",
    teachBackPrompt: "Spear phish vs generic blast: one difference that matters in defense.",
  }),
  "2-2-imp": makeLesson("2-2-imp", "2.2 Impersonation", "2", {
    videoFocus: [
      "Pretexting: false identity/role; tech support, exec, helpdesk, vendor",
      "Shoulder surfing, bag switching (physical) adjacent topics",
      "Verification: callback, out-of-band ID, not ‘trust caller ID’",
    ],
    simpleExplanation:
      "Impersonation is social engineering *identity fraud*: the attacker is *playacting* a trusted role. The exam tests whether you *verify* requests for sensitive actions (wire, password reset, data export) and whether staff follow policy (no exceptions for ‘the CEO is on a plane’).",
    highlightRules: [
      hi("Out-of-band verification", "Call back known number, verify ticket", "must"),
      hi("Authorization policy", "Who can do wire transfers, what approvals exist", "must"),
    ],
    writeDown: "1) 3 pretexts. 2) A safe *verification* workflow for a wire. 3) A bad shortcut users take.",
    examTraps: [
      { a: "Caller ID = proof", b: "Spoofing exists" },
      { a: "Urgency = always true", b: "Urgency is a *classic* tool" },
    ],
    instantRecognition: [
      { keyword: "new bank account, hurry", answer: "BEC / impersonation" },
      { keyword: "IT support cold call", answer: "Pretext" },
    ],
    threeSecondRecall: ["Verify", "Out of band", "No exceptions"],
    quickAction: "Write a 3-line company script for a suspicious *vendor change* request.",
    miniQuizIntro: "BEC, helpdesk, and exec impersonation storylines.",
    teachBackPrompt: "Impersonation vs phishing: what’s the *identity* focus difference?",
  }),
  "2-2-wh": makeLesson("2-2-wh", "2.2 Watering Hole Attacks", "2", {
    videoFocus: [
      "Compromise a site the targets already trust and visit; drive-by, malicious ads",
      "Recon: learn industry/role sites from OSINT; tailored lure",
      "Defend: patch browsers, adblock policy, EDR, least privilege, segmentation",
    ],
    simpleExplanation:
      "A *watering hole* plants malware where *specific victims* browse—often a niche forum or industry supplier site. You’ll contrast it with *spear* email: vector is *browsing* not inbox. The fix is *patch+isolate+detect*, not a password reset alone.",
    highlightRules: [
      hi("Targeted *site* compromise", "Not random spam; victim pool inference", "must"),
      hi("Client exploit chain", "Browser/plugin vulns common historical pattern", "should"),
    ],
    writeDown: "1) How attacker picks the hole. 2) What log might show. 3) 2 user/org mitigations.",
    examTraps: [
      { a: "PHSI = phish only", b: "Visiting trusted *bad* site" },
      { a: "AV blocks all", b: "0-day + legit site = layered defense" },
    ],
    instantRecognition: [
      { keyword: "industry site, forum", answer: "Watering hole" },
      { keyword: "IE exploit chain", answer: "Legacy client vuln" },
    ],
    threeSecondRecall: ["Trusted site", "Client vuln", "EDR+patch"],
    quickAction: "Name one *niche* site in your field an attacker could poison.",
    miniQuizIntro: "Differentiate from phishing and general malware drive-by.",
    teachBackPrompt: "If email is clean but browsing hits an exploit, what *control* first fires?",
  }),
  "2-2-se": makeLesson("2-2-se", "2.2 Other Social Engineering", "2", {
    videoFocus: [
      "Baiting, tailgating, quid pro quo, dumpster diving, hoaxes",
      "Influence: authority, intimidation, consensus, liking, scarcity, urgency (Cialdini-style)",
      "Training + culture + *technical* barriers (badges) together",
    ],
    simpleExplanation:
      "Not all social engineering is email. *Physical* and *human* levers (curiosity, fear) matter. The exam will ask: *which control* reduces a specific *vector*? Awareness alone is *never* a whole program—back it with policy, design, and monitoring.",
    highlightRules: [
      hi("Tailgating", "Physical+policy; mantrap, guard training", "must"),
      { term: "Baiting", meaning: "Free media / gift malware lure.", importance: "should" },
    ],
    writeDown: "1) 3 techniques not email. 2) One *human* and one *technical* counter to each.",
    examTraps: [
      { a: "Awareness once a year = enough", b: "Ongoing, metrics, and leadership tone matter" },
      { a: "Blame the user in stem answer", b: "Choose systemic fix where offered" },
    ],
    instantRecognition: [
      { keyword: "free USB in parking lot", answer: "Baiting" },
      { keyword: "followed into lobby", answer: "Tailgating" },
    ],
    threeSecondRecall: ["Influence", "Control mix", "Policy"],
    quickAction: "Act out a 10s *polite refuse* to tailgating at a door.",
    miniQuizIntro: "Technique + control pairing in scenarios.",
    teachBackPrompt: "Why is ‘just train users’ a weak *only* control on the exam?",
  }),
  "2-3-mem": vuln("2-3-mem", "2.3 Memory Injections", {
    def: "Memory injection (shellcode into another process, reflective loading)",
    layer: "Process memory, loader behavior, and unsafe interfaces",
    mit: "ASLR, DEP/NX, patch, least privilege, EDR, and secure dev practices",
    kw: ["injection, allocate RWX", "hollowed process"],
  }),
  "2-3-bo": vuln("2-3-bo", "2.3 Buffer Overflows", {
    def: "Buffer overflow / stack smash when inputs exceed buffer bounds",
    layer: "Unsafe languages, bad bounds checks, legacy API misuse",
    mit: "Bounds checking, canaries, stack protections, input validation, recompile with safer APIs",
    kw: ["Segmentation fault", "ROP, strcpy"],
  }),
  "2-3-rc": vuln("2-3-rc", "2.3 Race Conditions", {
    def: "Race condition (TOCTOU) where order of events creates a security window",
    layer: "File ops, temp paths, token checks vs use",
    mit: "Atomic operations, file locking, secure temp, validation immediately before use",
    kw: ["check then use", "temp symlink"],
  }),
  "2-3-mu": vuln("2-3-mu", "2.3 Malicious Updates", {
    def: "Supply-chain / update compromise (rogue build, key theft, bad pipeline)",
    layer: "CI/CD, signing keys, update delivery channel, vendor trust",
    mit: "Code signing, checksum verify, SLSA-style build integrity, key custody, allowlists",
    kw: ["signed update", "compromised vendor"],
  }),
  "2-3-os": vuln("2-3-os", "2.3 OS Vulnerabilities", {
    def: "OS-level flaws (privilege escalation, kernel bugs, driver issues",
    layer: "Kernel surface, local exploit chains",
    mit: "Patch cadence, least privilege, remove admin, driver allowlists, EDR",
    kw: ["UAC, sudo", "kernel exploit"],
  }),
  "2-3-sqli": vuln("2-3-sqli", "2.3 SQL Injection", {
    def: "SQLi: untrusted input becomes part of a database query (classic web vuln",
    layer: "App query construction / ORM mis-use",
    mit: "Parameterized queries, stored procedures, input validation, WAF (secondary), least DB privilege",
    kw: ["' OR 1=1--", "stacked queries"],
  }),
  "2-3-xss": vuln("2-3-xss", "2.3 XSS", {
    def: "Cross-site scripting: attacker script runs in *victim browser* in *site* context (stored/reflected/DOM",
    layer: "Output encoding, unsafe HTML, JS sinks",
    mit: "Contextual encoding, CSP, sanitization, HttpOnly/secure flags for cookies, validate input",
    kw: ["script tag in comment", "DOM XSS"],
  }),
  "2-3-hw": vuln("2-3-hw", "2.3 Hardware Vulnerabilities", {
    def: "Hardware issues: side channels (Spectre/Meltdown class), bad firmware, TPM/UEFI issues at concept",
    layer: "CPU microcode, firmware, peripheral trust",
    mit: "Firmware updates, microcode, disable risky features if vendor guides, HSM/TPM for keys",
    kw: ["microcode, firmware C2", "side channel"],
  }),
  "2-3-virt": vuln("2-3-virt", "2.3 Virtualization Vulnerabilities", {
    def: "Hypervisor/VM escape, shared host risk, bad snapshots, mis-ACL’d images",
    layer: "Host/guest boundary, image pipeline",
    mit: "Patch hypervisor, segment tenants, harden image build, min privileges on mgmt API",
    kw: ["escape to host", "vMotion security"],
  }),
  "2-3-cloud": vuln("2-3-cloud", "2.3 Cloud Vulnerabilities", {
    def: "Cloud: mis-bucketed public S3, weak IAM, metadata SSRF, shared responsibility gaps",
    layer: "Identity, network policy, data exposure",
    mit: "Least privilege IAM, block public access patterns, policy-as-code, logging, data classification",
    kw: ["public bucket", "instance metadata IMDS"],
  }),
  "2-3-sc": vuln("2-3-sc", "2.3 Supply Chain Vulnerabilities", {
    def: "Supply chain: libraries, 3P updates, build systems, package repos",
    layer: "Dependency graph, signing, provenance",
    mit: "SBOM, version pinning, integrity checks, vendor risk program, subresource integrity on web",
    kw: ["typosquat package", "stolen signing key"],
  }),
  "2-3-mis": vuln("2-3-mis", "2.3 Misconfiguration", {
    def: "Misconfiguration: default creds, open ports, debug on, over-wide firewall rules, wrong TLS",
    layer: "Every layer—often the *real* reason breach succeeds",
    mit: "Baselines, IaC, automated drift detection, config scanners, change control",
    kw: ["default password admin/admin", "debug=true prod"],
  }),
  "2-3-mob": vuln("2-3-mob", "2.3 Mobile Device Vulnerabilities", {
    def: "Mobile: app sandbox escapes (rare in stem), bad MDM, lost device, app sideload, SMS/OAuth risks",
    layer: "OS API, app store trust, device theft",
    mit: "MDM, remote wipe, full-disk, app vetting, least app permissions, OS updates",
    kw: ["jailbreak", "lost phone"],
  }),
  "2-3-zd": vuln("2-3-zd", "2.3 Zero-day", {
    def: "0-day: no vendor patch; exploit in the wild; high risk window",
    layer: "Unknown vuln, detection harder",
    mit: "Compensating controls, network segmentation, EDR, threat intel, WAF, isolate critical systems, kill switch plans",
    kw: ["no signature yet", "virtual patch"],
  }),
  "2-4-mal": atk("2-4-mal", "2.4 Malware", {
    def: "malware (umbrella: malicious code intent)",
    how: "Delivery via email, web, media, living-off-the-land, and lateral movement",
    det: "YARA-like IoC, EDR, hash, behavior, and net connections (C2)",
    kw: ["polymorphic, C2", "persistence"],
  }),
  "2-4-vw": atk("2-4-vw", "2.4 Viruses and Worms", {
    def: "virus (needs host) vs worm (self-propagate over network)",
    how: "Spread vectors; worm scans or exploits; virus attaches to files or boot",
    det: "AV signatures (limited), anomalous scan traffic, and file mutation",
    kw: ["worm scanning", "boot sector"],
  }),
  "2-4-sb": atk("2-4-sb", "2.4 Spyware and Bloatware", {
    def: "spyware (steals data) and bloatware (unwanted ‘extra’ software, sometimes adware",
    how: "Bundled installs, free tools, ad networks",
    det: "Unexpected exfil, new extensions, PUA detections, privacy tools report telemetry",
    kw: ["keylogger", "PUA",],
  }),
  "2-4-om": atk("2-4-om", "2.4 Other Malware", {
    def: "trojans, rootkits, RAT, cryptominers, wipers, logic bombs, multi-stage packers",
    how: "Disguise as legit; deeper persistence; wiper = destruction; miner = resource abuse",
    det: "Behavioral, kernel hooks (rootkit harder), file integrity, net miners",
    kw: ["trojan", "persistence",],
  }),
  "2-4-pa": atk("2-4-pa", "2.4 Physical Attacks", {
    def: "physical: theft, damage, device tamper, bad USB, cold boot, evil maid",
    how: "Proximity + human access; bypass logical controls *locally*",
    det: "Access logs, cameras, inventory, trip wires on tamper",
    kw: ["stolen laptop", "evil maid",],
  }),
  "2-4-dos": atk("2-4-dos", "2.4 DoS", {
    def: "DoS/DDoS: flood or abuse to deny availability (L3/L4 vol, L7 app, slowloris class",
    how: "Botnets, reflection/amplification, app-layer abuse",
    det: "Netflow spikes, scrubbing, CDN/WAF, upstream ISP signals",
    kw: ["SYN flood", "amplification",],
  }),
  "2-4-dnsa": atk("2-4-dnsa", "2.4 DNS Attacks", {
    def: "DNS: cache poison, hijack, tunneling, rebinding, registrar compromise (concept",
    how: "Wrong answer records, on-path, malicious resolver control",
    det: "Unexpected A records, DNS logs, DANE/DNSSEC (concept) mentions",
    kw: ["wrong IP", "DNS exfil",],
  }),
  "2-4-wl": atk("2-4-wl", "2.4 Wireless Attacks", {
    def: "wireless: evil twin, deauth, weak WPA, cracked PSK, Bluetooth abuse",
    how: "Radio proximity, weak crypto, mis-config AP",
    det: "Rogue AP detection, 802.1X, EAP, certificate validation",
    kw: ["evil twin", "WPS brute",],
  }),
  "2-4-onp": atk("2-4-onp", "2.4 On-path Attacks", {
    def: "on-path (MITM): sit between two parties, decrypt/re-encrypt, observe/modify (needs trust break",
    how: "ARP spoof, rogue proxy, cert tricks (when trust fails",
    det: "Cert pinning failures, HSTS, unexpected cert warnings, path mismatch",
    kw: ["MITM", "proxy SSL inspect",],
  }),
  "2-4-rep": atk("2-4-rep", "2.4 Replay Attacks", {
    def: "replay: capture legit traffic, resend; busted with nonces, timestamps, session tokens, seq numbers",
    how: "Works when auth is stateless or no freshness",
    det: "Duplicate seq, token reuse, clock skew in logs (concept",
    kw: ["nonce", "one-time",],
  }),
  "2-4-mcode": atk("2-4-mcode", "2.4 Malicious Code", {
    def: "malicious *code* in app/plugin/script context: macros, webshell, signed-but-bad",
    how: "Inject into trusted execution paths, abuse interpreter trust",
    det: "Code review, WAF, script block policies, IRM on macros",
    kw: ["macro", "webshell",],
  }),
  "2-4-appa": atk("2-4-appa", "2.4 Application Attacks", {
    def: "app attacks: business logic, CSRF, IDOR, XXE, deserialization, default creds, API abuse",
    how: "Abuse *features*; authz failures",
    det: "OWASP-style test results, 403/401 patterns, anomalous API use",
    kw: ["IDOR", "CSRF",],
  }),
  "2-4-cryptoa": atk("2-4-cryptoa", "2.4 Cryptographic Attacks", {
    def: "crypto attacks: downgrades, padding oracle, birthday on hashes (concept), weak keys, renegotiation, replay of tokens",
    how: "Protocol misuse or weak choice",
    det: "TLS scan, weak cipher, odd handshake",
    kw: ["downgrade", "weak DH",],
  }),
  "2-4-pw": atk("2-4-pw", "2.4 Password Attacks", {
    def: "password: spray, cred stuffing, pass-the-hash, offline cracking, shoulder surf",
    how: "Reuse + leaks; NTLM hash story on Windows in some stems",
    det: "Auth lockouts, impossible travel, HIBP, MFA enrollment",
    kw: ["spray", "stuffed creds",],
  }),
  "2-4-ioc": atk("2-4-ioc", "2.4 Indicators of Compromise", {
    def: "IoC/IoA: file hash, C2 IP/domain, YARA, registry, process lineage; IoA is behavior (TTP",
    how: "Used in triage, hunting, and IR handoff; pivot from one artifact to campaign",
    det: "SIEM rules, MISP-style sharing, EDR",
    kw: ["hash", "C2",],
  }),
  "2-5-seg": mit25("2-5-seg", "2.5 Segmentation and Access Control", "Network and identity segmentation in depth", "segmentation (VLAN, micro-seg, ZT) + RBAC/ABAC/ACLs"),
  "2-5-mit": mit25("2-5-mit", "2.5 Mitigation Techniques", "The layered mitigation model", "patches, hardening, input validation, awareness, and backups where relevant to the loss"),
  "2-5-harden": mit25("2-5-harden", "2.5 Hardening Techniques", "CIS / STIG-style baselines and continuous validation", "remove defaults, min services, secure configs, and verify with scans"),
};
