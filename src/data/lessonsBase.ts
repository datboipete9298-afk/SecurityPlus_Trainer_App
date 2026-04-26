import type { Lesson } from "../types";

/** Original MVP lessons (unchanged content). */
export const lessonsBase: Record<string, Lesson> = {
  "1-1": {
    id: "1-1",
    title: "1.1 Security Controls",
    domain: "1",
    order: 0,
    hasFullContent: true,
    endChecks: [
      "Can I sort type vs function on a new stem in ~20s?",
      "Do I know compensating when patching isn’t possible?",
      "Can I name one managerial vs one operational example?",
    ],
    videoFocus: [
      "How exam questions label a scenario: type vs function of a control",
      "Words that map to technical / managerial / operational / physical",
      "Compensating = alternative when the ideal control is impossible",
    ],
    simpleExplanation:
      "Security controls are safeguards. The exam classifies them by TYPE (how they are implemented) and by FUNCTION (what they do in a timeline: stop, see, fix, etc.). The stem tells you which axis to use.",
    highlightRules: [
      { term: "Technical, Managerial, Operational, Physical", meaning: "Control TYPES (T/M/O/Phy).", importance: "must" },
      { term: "Preventive, Detective, Corrective, Deterrent, Compensating", meaning: "Control FUNCTIONS; compensating = alternate control when primary infeasible.", importance: "must" },
      { term: "Managerial vs Operational", meaning: "Policy/oversight vs day-to-day procedures/people work.", importance: "must" },
      { term: "Defense in depth", meaning: "Layering — never a single control as whole answer for ‘best security’.", importance: "should" },
      { term: "Physical control examples", meaning: "Fence, mantrap, guard, lock — not ‘firewall’ (that’s usually technical).", importance: "should" },
    ],
    writeDown:
      "1) T/M/O/Phy = *how/where*. 2) Prevent/detect/correct = *when* in the story. 3) ‘Can’t patch legacy’ → think compensating + extra layers. 4) Managerial = governance; Operational = SOP/awareness delivery.",
    examTraps: [
      { a: "Managerial", b: "Operational (SOP, daily task wording)" },
      { a: "Type (T/M/O/Phy)", b: "Function (preventive/detective/…)" },
    ],
    instantRecognition: [
      { keyword: "policy, security program, risk register", answer: "Often managerial" },
      { keyword: "runbook, procedure, helpdesk, daily", answer: "Operational" },
      { keyword: "Firewall, encryption, AV rule", answer: "Technical" },
      { keyword: "Badge, fence, mantrap", answer: "Physical" },
    ],
    threeSecondRecall: [
      "Technical → tools enforce",
      "Managerial → govern & oversee",
      "Operational → we run it daily",
      "Physical → touch real world access",
    ],
    quickAction: "Name one preventive and one detective control on the PC in front of you (e.g. password policy, Defender alert).",
    miniQuizIntro: "5 quick checks: map stems to the right *type* or *function*.",
    teachBackPrompt:
      "In one sentence: what is the difference between a control’s *type* and its *function*? Give one example of each from home or work.",
  },
  "1-2-cia": {
    id: "1-2-cia",
    title: "1.2 CIA Triad",
    domain: "1",
    order: 0,
    hasFullContent: true,
    endChecks: ["C/I/A one breath each?", "Ransomware: primary hit which pillar?", "Leak vs defacement vs outage?"],
    videoFocus: [
      "Each letter: one clean definition + a classic exam example",
      "Availability vs integrity when both are mentioned — pick the *primary* loss",
      "How CIA overlaps with DAD or other acronyms if notes mention them",
    ],
    simpleExplanation:
      "C = confidentiality (only authorized can see). I = integrity (data trusted, not tampered). A = availability (when needed, authorized users can get to it). Stems are short stories; you match which pillar is *hurt* first.",
    highlightRules: [
      { term: "Confidentiality", meaning: "Disclosure to unauthorized; encryption, classification.", importance: "must" },
      { term: "Integrity", meaning: "Unauthorized *change*; hashes, WORM, file permissions.", importance: "must" },
      { term: "Availability", meaning: "Uptime, DoS, redundancy, BCP/DRP tie-in.", importance: "must" },
      { term: "DAD (optional)", meaning: "Disclosure, Alteration, Destruction — another lens, same triad family.", importance: "good" },
    ],
    writeDown: "C / I / A one line each. Example damage per letter. Ransomware: often hits A and I; leak = C.",
    examTraps: [
      { a: "Ransomware encrypts files (can’t use)", b: "Primarily integrity vs availability — read *what stopped*" },
      { a: "Eavesdropping on wire", b: "Confidentiality" },
    ],
    instantRecognition: [
      { keyword: "stolen, leaked, classified wrong", answer: "Confidentiality" },
      { keyword: "tampered, hash mismatch, defaced", answer: "Integrity" },
      { keyword: "down, DoS, slow, outage", answer: "Availability" },
    ],
    threeSecondRecall: ["C → keep secret", "I → no bad change", "A → can use when needed"],
    quickAction: "Write C/I/A in a column; next to each, one *your life* example in 5 words.",
    miniQuizIntro: "Pick the pillar; watch for *best* *primary* impact.",
    teachBackPrompt: "Explain CIA with one exam-style sentence each, then one real breach headline mapped to a letter.",
  },
  "1-2-nr": {
    id: "1-2-nr",
    title: "1.2 Non-repudiation",
    domain: "1",
    order: 0,
    hasFullContent: true,
    endChecks: ["NR vs confidentiality?", "What proves origin beyond encryption?", "Log + time source role?"],
    videoFocus: [
      "Tie to identity + proof: who sent / who approved, can’t plausibly deny",
      "Digital signatures, audit logs, strong identity — not the same as confidentiality alone",
    ],
    simpleExplanation:
      "Non-repudiation means someone *cannot credibly deny* an action (sent a message, approved a change). It usually combines strong identity, crypto proof (e.g. signature), and reliable logs.",
    highlightRules: [
      { term: "Non-repudiation", meaning: "Proof of origin/action; deny-after-the-fact blocked.", importance: "must" },
      { term: "Digital signature", meaning: "Often provides integrity + authenticity + N.R. in exam stems.", importance: "must" },
      { term: "Audit log + time sync", meaning: "Prove order of events; supports disputes.", importance: "should" },
    ],
    writeDown: "N.R. = prove *who* did *what* + hard to lie later. Pairs with signing, not with ‘encryption alone’ in many stems.",
    examTraps: [
      { a: "Non-repudiation", b: "Confidentiality (secrecy)" },
      { a: "Hash alone", b: "Signature + key mgmt in real NR story" },
    ],
    instantRecognition: [
      { keyword: "can’t deny sending email", answer: "Non-repudiation" },
      { keyword: "PKI, signing key", answer: "Supports NR + integrity" },
    ],
    threeSecondRecall: ["NR → proof, not just secrecy", "Signature story → who agreed"],
    quickAction: "Open a signed email or PDF trust chain read-only: point to *who* is identified.",
    miniQuizIntro: "NR vs C vs I: three-way distinction.",
    teachBackPrompt: "When would a bank care about non-repudiation for a wire transfer? One sentence.",
  },
  "1-2-aaa": {
    id: "1-2-aaa",
    title: "1.2 AAA (Authentication, Authorization, Accounting)",
    domain: "1",
    order: 0,
    hasFullContent: true,
    endChecks: ["AuthN vs AuthZ symptom pairs?", "Where does accounting show up in RADIUS?", "Valid login + 403 = which A?"],
    videoFocus: [
      "Order: prove identity → grant rights → log/measure usage (4th A = Accounting in many texts)",
      "RADIUS, TACACS+ context (centralized access policy + accounting)",
    ],
    simpleExplanation:
      "Authentication: prove *who* you are. Authorization: *what* you can do. Accounting: *what you did* (session metrics, logging for billing/audit). Stems are login flows and ‘which step fails?’. ",
    highlightRules: [
      { term: "Authentication (AuthN)", meaning: "Identity; passwords, MFA, biometrics, certificates to a user/device.", importance: "must" },
      { term: "Authorization (AuthZ)", meaning: "Permissions after identity; RBAC, ACLs, least privilege.", importance: "must" },
      { term: "Accounting", meaning: "Session/accounting of activity; 4th A; RADIUS class usage.", importance: "must" },
      { term: "RADIUS", meaning: "AAA for network access; not always full AuthZ for every app (context).", importance: "should" },
    ],
    writeDown: "AuthN who → AuthZ what → Acct *record*. Never swap AuthN/AuthZ on the exam if stem names a permission error.",
    examTraps: [
      { a: "AuthN (bad password)", b: "AuthZ (right user, no rights)" },
    ],
    instantRecognition: [
      { keyword: "wrong password", answer: "Authentication failure" },
      { keyword: "403 / access denied, valid login", answer: "Authorization" },
      { keyword: "session time, data used, logs for chargeback", answer: "Accounting" },
    ],
    threeSecondRecall: ["AuthN = who", "AuthZ = may", "Acct = did / meter"],
    quickAction: "On one website login: which screen is AuthN? After login, what menu proves AuthZ? What log line would be Acct?",
    miniQuizIntro: "Which A failed? 4–6 scenarios.",
    teachBackPrompt: "Tell the AAA walkthrough like you’re on a NOC call in 20 seconds.",
  },
  "1-2-zt": {
    id: "1-2-zt",
    title: "1.2 Zero Trust",
    domain: "1",
    order: 0,
    hasFullContent: true,
    endChecks: ["ZT vs VPN alone?", "Micro-segmentation purpose?", "Assume breach in one line?"],
    videoFocus: [
      "‘Never trust, always verify’ every hop; assume breach; least privilege; micro-segmentation",
      "Not a product: architecture + policy + continuous validation",
    ],
    simpleExplanation:
      "Zero Trust removes implied trust from ‘inside the firewall’. Every request is verified (identity, device health, least privilege) continuously. Stems: VPN replacement stories, ‘assume breach’, verify each resource access.",
    highlightRules: [
      { term: "Never trust, always verify", meaning: "Default deny; no trusted interior network *by name alone*.", importance: "must" },
      { term: "Identity + device trust", meaning: "Context before access: who + which device posture.", importance: "must" },
      { term: "Micro-segmentation", meaning: "Small trust zones, east-west control.", importance: "should" },
      { term: "Not just VPN with password", meaning: "ZT = ongoing verification; exam trap ‘VPN = ZT’ often false as whole story.", importance: "should" },
    ],
    writeDown: "ZT = verify *every* access with identity + context; small blast radius; not ‘castle-and-moat only’ as answer.",
    examTraps: [
      { a: "Zero Trust architecture", b: "Single VPN = whole security" },
    ],
    instantRecognition: [
      { keyword: "verify each app access, device posture", answer: "Zero Trust themes" },
      { keyword: "assume breach", answer: "Zero Trust mindset" },
    ],
    threeSecondRecall: ["ZT → verify always", "No implicit LAN trust", "Least privilege at each hop"],
    quickAction: "List 2 checks a real system might do *after* password before SaaS (MFA, device).",
    miniQuizIntro: "Product vs architecture; which statement is ZT-aligned?",
    teachBackPrompt: "Castle-and-moat vs ZT: one contrast sentence + one work example.",
  },
};
