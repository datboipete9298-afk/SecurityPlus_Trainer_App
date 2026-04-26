import type { Lesson } from "../types";
import { makeLesson } from "./lessonFactory";

/** Domain 1 sections: 1-0 and post–Zero Trust through certificates (Messer order). */
export const domain1Extended: Record<string, Lesson> = {
  "1-0": makeLesson("1-0", "1.0 General Security Concepts", "1", {
    videoFocus: [
      "How exam questions separate governance, risk, and technical controls at a high level",
      "Terms: threat, vulnerability, risk, likelihood, impact, residual risk",
      "Why “absolute security” is a trap answer",
    ],
    simpleExplanation:
      "General security concepts set the vocabulary for the whole exam: assets, threats, vulnerabilities, risk, controls, and compliance. You are not memorizing buzzwords—you are learning to read a stem and identify *which concept* is under test (risk treatment, control type, or governance).",
    highlightRules: [
      { term: "Risk = f(threat × vulnerability)", meaning: "Impact and likelihood frame decisions; controls *reduce* risk.", importance: "must" },
      { term: "Asset", meaning: "Anything of value: data, systems, people, reputation.", importance: "must" },
      { term: "Governance", meaning: "Policies, standards, accountability—how the org decides what “secure” means.", importance: "should" },
    ],
    writeDown: "1) Risk in one line. 2) One threat example. 3) One vulnerability example. 4) One control type you would apply first.",
    examTraps: [
      { a: "Eliminate all risk", b: "Real programs manage risk; residual risk remains" },
      { a: "One perfect control", b: "Layered (defense in depth) expected in mature answers" },
    ],
    instantRecognition: [
      { keyword: "policy, standard, committee", answer: "Governance / high-level" },
      { keyword: "patch, firewall, config", answer: "Often technical controls" },
    ],
    threeSecondRecall: ["Risk = likelihood × impact (conceptually)", "Control reduces exposure", "Residual risk stays"],
    quickAction: "List your top 3 personal digital assets, one threat each, one cheap mitigation.",
    miniQuizIntro: "Foundations: stem → concept mapping.",
    teachBackPrompt: "Explain in 20s: what is *residual* risk and why it still exists after controls.",
    endChecks: ["Can I define risk without using ‘hack’ as the only threat?", "Governance vs technical in one line?", "Name one cost of doing nothing?"],
  }),

  "1-2-gap": makeLesson("1-2-gap", "1.2 Gap Analysis", "1", {
    videoFocus: [
      "Gap analysis: current state vs desired (policy, NIST, ISO, company standard)",
      "Outputs: gap report, risk register updates, project backlog—not instant fixes",
      "Exam link to continuous improvement and change management",
    ],
    simpleExplanation:
      "Gap analysis compares *where you are* with *where you must be* (framework, law, or architecture). It names missing controls, misconfigurations, and process holes so leadership can prioritize. It is a planning step, not a single product purchase.",
    highlightRules: [
      { term: "Current vs target", meaning: "Document evidence: configs, logs, interviews, scans.", importance: "must" },
      { term: "Prioritize", meaning: "Business impact and likelihood set order—everything can’t be P0.", importance: "must" },
      { term: "Change ticket", meaning: "Large gaps should feed controlled changes (not silent edits).", importance: "should" },
    ],
    writeDown: "1) What standard? 2) 3 evidence sources. 3) Top 3 gaps. 4) How you’d re-measure after fix.",
    examTraps: [
      { a: "Buy a ‘gap tool’ and done", b: "People/process/tech; evidence-based assessment" },
      { a: "Zero gaps possible", b: "Maturity and budget-bound residual gaps" },
    ],
    instantRecognition: [
      { keyword: "framework mapping, RFP after audit", answer: "Gap / compliance work" },
      { keyword: "NIST CSF, ISO 27001", answer: "Common target states" },
    ],
    threeSecondRecall: ["Current → target", "Evidence", "Backlog with owners"],
    quickAction: "Pick one app you use: list one security gap and one *measurable* next step to close it.",
    miniQuizIntro: "Scenario: auditor findings → what is gap analysis output?",
    teachBackPrompt: "In one sentence: what artifact proves a gap (not a feeling)?",
  }),

  "1-2-phys": makeLesson("1-2-phys", "1.2 Physical Security", "1", {
    videoFocus: [
      "Perimeter, facility, data center, workspace—layers",
      "Mantrap, badge, bollards, safe, destruction of media, visitor logs",
      "Tailgating / piggybacking in scenario stems",
    ],
    simpleExplanation:
      "Physical security protects *people, hardware, and tangible assets* with fences, locks, guards, cameras, and environmental controls. The exam often pairs logical access (badge + PIN) with physical anti-tailgating (mantrap) and with secure media destruction.",
    highlightRules: [
      { term: "Defense in depth (physical)", meaning: "Perimeter → building → room → rack → port.", importance: "must" },
      { term: "Visitor management", meaning: "Escort, sign-in, badge color—reduces unauthenticated insiders.", importance: "must" },
      { term: "Environmental", meaning: "Fire suppression, power, HVAC—availability + safety.", importance: "should" },
    ],
    writeDown: "1) 3 physical controls you’ve seen. 2) What stops tailgating. 3) How you’d destroy a failed SSD in an enterprise (conceptually).",
    examTraps: [
      { a: "CCTV *alone*", b: "Detective, not preventive without response" },
      { a: "Fire suppression type", b: "Water vs gas—context (equipment vs life safety rules)" },
    ],
    instantRecognition: [
      { keyword: "pin + glass door behind", answer: "Mantrap" },
      { keyword: "followed someone in", answer: "Tailgating" },
    ],
    threeSecondRecall: ["Perimeter", "Entry control", "Media destruction"],
    quickAction: "Office walkthrough (mental): name 3 physical controls between street and a secure lab.",
    miniQuizIntro: "Physical + logical layered stems.",
    teachBackPrompt: "Explain mantrap in 10 words + why it’s not ‘just a door’.",
  }),

  "1-2-dec": makeLesson("1-2-dec", "1.2 Deception and Disruption", "1", {
    videoFocus: [
      "Honeypots, honeynets, honeytokens: learn attacker behavior, not production data",
      "Disrupt: take away advantage—sinkhole, takedown partners with legal process (concept)",
      "Risk: operational complexity and false positives; legal approval",
    ],
    simpleExplanation:
      "Deception lures and observes adversaries in controlled (often isolated) systems. Disruption *interrupts* malicious infrastructure or access paths. Examinable themes: *never* point deception at real customer data, instrument carefully, and pair with detect/response playbooks.",
    highlightRules: [
      { term: "Honeypot / Honeynet", meaning: "Intentional attractive fake asset to study TTPs.", importance: "must" },
      { term: "Honeytoken", meaning: "Canary credential/file—alerts on use.", importance: "must" },
      { term: "Isolation", meaning: "Deception systems must be segmented—no lateral bridge to prod.", importance: "should" },
    ],
    writeDown: "1) Honeypot purpose. 2) What you’d log. 3) What could go wrong if mis-placed.",
    examTraps: [
      { a: "Honeypot = backup", b: "Security research / intel, not availability backup" },
      { a: "Legal-free hacking back", b: "Oversight, jurisdiction, and policy constraints are real" },
    ],
    instantRecognition: [
      { keyword: "canary, fake admin account", answer: "Honeytoken / tripwire" },
      { keyword: "VM farm watching scans", answer: "Honeynet research" },
    ],
    threeSecondRecall: ["Lure + observe", "Segment", "Alert to IR"],
    quickAction: "One sentence: a honeytoken you could place in a test tenant (not prod).",
    miniQuizIntro: "Stems: purpose + placement + law/ethics at high level.",
    teachBackPrompt: "Difference between honeypot and IDS log review—in one line.",
  }),

  "1-3-cm": makeLesson("1-3-cm", "1.3 Change Management", "1", {
    videoFocus: [
      "Change request → approval → test → implement → backout; CAB",
      "Emergency change still documented after the fact (process integrity)",
      "Separation: dev/test/prod, peer review, maintenance window",
    ],
    simpleExplanation:
      "Change management exists so updates don’t break security or availability. The exam rewards knowing *separation of duties*, *approvals*, *testing*, *rollback plan*, and *post-change review*—not heroic midnight edits with no record.",
    highlightRules: [
      { term: "CAB", meaning: "Change advisory board: risk gating and scheduling.", importance: "must" },
      { term: "Backout", meaning: "If change fails, restore path and decision criteria.", importance: "must" },
      { term: "Emergency", meaning: "Faster path but *still* documented and reviewed.", importance: "should" },
    ],
    writeDown: "1) 5 change steps. 2) When CAB says no. 3) What you log after the change.",
    examTraps: [
      { a: "‘Fast’ means no ticket", b: "At minimum post-implementation record + risk acceptance" },
      { a: "Change = security team only", b: "Often joint ops/app/security roles" },
    ],
    instantRecognition: [
      { keyword: "backout, rollback, snapshot", answer: "Change plan quality" },
      { keyword: "CAB, maintenance window", answer: "Governed change" },
    ],
    threeSecondRecall: ["Request", "Approve", "Test"],
    quickAction: "Write a 4-line runbook: patch Tuesday with rollback and verification.",
    miniQuizIntro: "Scenarios: who approves, what breaks, what to revert.",
    teachBackPrompt: "Why is emergency change a risk to *integrity* of systems?",
  }),

  "1-3-tcm": makeLesson("1-3-tcm", "1.3 Technical Change Management", "1", {
    videoFocus: [
      "Config management, version control, IaC review as change channels",
      "Drift: running state vs desired state; reconciliation jobs",
      "CI/CD: automated tests as gate before production promotion",
    ],
    simpleExplanation:
      "Technical change management is how *systems* apply changes: pipelines, peer review, automated tests, blue/green or canary deploys, and *configuration drift* detection. The exam may blend “change” with *secure development* and *reliability*.",
    highlightRules: [
      { term: "IaC / Git", meaning: "Changes start as code review + version history.", importance: "must" },
      { term: "Drift", meaning: "Unapproved config differences—detect and correct or re-open a change.", importance: "must" },
      { term: "Test gates", meaning: "Unit/integration tests block bad builds—security as quality.", importance: "should" },
    ],
    writeDown: "1) How you detect drift. 2) One pre-prod test that blocks bad code. 3) Who can push to prod in your org model.",
    examTraps: [
      { a: "Manual prod hotfix = always wrong", b: "Reality + documentation + faster permanent fix" },
      { a: "CI = security", b: "CI is process; SAST/DAST/secret scan are tools that plug in" },
    ],
    instantRecognition: [
      { keyword: "terraform plan, PR review", answer: "Technical change / IaC" },
      { keyword: "inventory mismatch, rogue port", answer: "Drift / config debt" },
    ],
    threeSecondRecall: ["Code review", "Automated test", "Deploy strategy"],
    quickAction: "Name one SAST and one DAST in plain language (what they look for).",
    miniQuizIntro: "Pipelines, rollback, and drift in scenarios.",
    teachBackPrompt: "Blue/green vs canary: one-sentence each.",
  }),

  "1-4-pki": makeLesson("1-4-pki", "1.4 PKI", "1", {
    videoFocus: [
      "CA hierarchy: root, intermediate, end-entity; trust chains",
      "CRL and OCSP: revocation and why it matters in TLS",
      "Key ceremonies and offline roots (concept)",
    ],
    simpleExplanation:
      "PKI is the system of CAs, certificates, and keys that bind identities to public keys. You must know *chain of trust*, *revocation* (CRL/OCSP), and *key lifecycle* (issuance, renewal, compromise). The exam does not need you to be a CA admin— but it needs correct vocabulary in TLS and signing stories.",
    highlightRules: [
      { term: "Root vs intermediate", meaning: "Root is highly protected; intermediates sign end certs.", importance: "must" },
      { term: "CA", meaning: "Issues and signs public-key certificates under policy.", importance: "must" },
      { term: "Revocation", meaning: "Stolen private key = cert invalid before expiry—check CRL/OCSP.", importance: "must" },
    ],
    writeDown: "1) Trust chain 3 words. 2) When you’d use OCSP stapling. 3) What happens if a root key leaks (conceptually).",
    examTraps: [
      { a: "Self-signed on internet server", b: "Public trust = public CA or proper internal PKI story" },
      { a: "CRL and OCSP same thing", b: "Push vs pull; performance trade-offs" },
    ],
    instantRecognition: [
      { keyword: "chain failed, untrusted", answer: "PKI trust path" },
      { keyword: "compromised key, stamp CR", answer: "Revocation" },
    ],
    threeSecondRecall: ["CA signs cert", "Chain", "Revoke"],
    quickAction: "In browser, view cert path on any HTTPS site: name root vs leaf.",
    miniQuizIntro: "TLS, signing, and revocation interleaved.",
    teachBackPrompt: "One sentence: why is revocation required even with expiration dates?",
  }),

  "1-4-enc": makeLesson("1-4-enc", "1.4 Encrypting Data", "1", {
    videoFocus: [
      "At rest vs in transit vs in use (HSM, enclaves as advanced)",
      "Full-disk vs file vs field-level; tokenization for cardholder-style data",
      "Key management > algorithm choice in real breaches",
    ],
    simpleExplanation:
      "Encryption protects confidentiality (and can support integrity with AEAD). *Where* the data is matters: data at rest on disk, data in flight across networks, and data in use in memory. The exam often tests *key management* and *scope* (full disk vs column-level) over exotic math details.",
    highlightRules: [
      { term: "At rest", meaning: "Disk, DB TDE, backup encryption—stolen media risk.", importance: "must" },
      { term: "In transit", meaning: "TLS, VPN, IPsec—sniffing risk.", importance: "must" },
      { term: "Key custody", meaning: "Keys in HSM/KMS, rotation, separation of duties.", importance: "should" },
    ],
    writeDown: "1) One at-rest and one in-transit control for your email. 2) Where the keys live. 3) When tokenization beats encryption (concept).",
    examTraps: [
      { a: "Encryption = integrity", b: "AEAD/ MAC contexts matter; default stories often confidentiality" },
      { a: "Any encryption key on app server DB", b: "HSM / KMS and least privilege" },
    ],
    instantRecognition: [
      { keyword: "TDE, BitLocker, LUKS", answer: "At rest" },
      { keyword: "TLS, VPN", answer: "In transit" },
    ],
    threeSecondRecall: ["Rest, transit, use", "Keys in KMS", "Scope"],
    quickAction: "List data you have in three places (laptop, cloud, email) and the right *layer* to encrypt.",
    miniQuizIntro: "DLP vs encryption: stem clarity.",
    teachBackPrompt: "Why is losing a laptop worse without full-disk encryption?",
  }),

  "1-4-kex": makeLesson("1-4-kex", "1.4 Key Exchange", "1", {
    videoFocus: [
      "Symmetric session keys from asymmetric (TLS handshake pattern)",
      "DH / ECDH ideas: forward secrecy when sessions use ephemeral keys",
      "PFS: prior compromise doesn’t reveal old sessions (conceptual)",
    ],
    simpleExplanation:
      "Key exchange establishes shared secrets for symmetric crypto without shipping long-term shared keys in cleartext. In exams, *Diffie–Hellman* / ECDH, *ephemeral* keys, and *perfect forward secrecy* appear as *best* answers in TLS and VPN scenarios.",
    highlightRules: [
      { term: "Asymmetric for bootstrap", meaning: "RSA/EC keys establish or sign exchange; bulk data uses symmetric.", importance: "must" },
      { term: "Forward secrecy (PFS)", meaning: "Ephemeral session keys—compromise of long-term key ≠ decrypt old captures.", importance: "must" },
      { term: "MITM", meaning: "Without server auth (cert), KEX is stealable or spoofed—need trust anchor.", importance: "should" },
    ],
    writeDown: "1) What DH solves. 2) Why ephemeral matters. 3) What authenticates the server in TLS (keyword).",
    examTraps: [
      { a: "Use same RSA key forever for sessions", b: "Session keys, rotation, and FS patterns" },
      { a: "KEX = encryption algorithm", b: "KEX negotiates/derives key material" },
    ],
    instantRecognition: [
      { keyword: "ephemeral, ECDHE", answer: "Modern TLS / FS" },
      { keyword: "shared secret, group", answer: "DH family" },
    ],
    threeSecondRecall: ["Asymmetric assist", "Symmetric bulk", "Ephemeral = FS"],
    quickAction: "In one line: what does ‘forward secrecy’ protect against?",
    miniQuizIntro: "TLS, VPN, and MITM in scenarios.",
    teachBackPrompt: "If someone steals the server’s long-term private key, does PFS help past sessions? Why?",
  }),

  "1-4-enc-tech": makeLesson("1-4-enc", "1.4 Encryption Technologies", "1", {
    videoFocus: [
      "AES, ChaCha20 at high level: symmetric bulk with modern modes; avoid ECB stories",
      "Asymmetric: RSA, ECC roles—sign, encrypt key material, not bulk data",
      "IPsec, TLS, S/MIME, full-disk: where each applies",
    ],
    simpleExplanation:
      "Encryption *technologies* are the concrete ciphers, protocols, and formats: AES, RSA, ECC, SHA (hashing, not encryption), IPsec, TLS, OpenPGP/SMIME. The exam maps each to the right *layer* (email vs web vs network tunnel) and the right *wrong answers* (e.g. ECB for patterns).",
    highlightRules: [
      { term: "AES", meaning: "Common symmetric block cipher; GCM popular AEAD mode.", importance: "must" },
      { term: "RSA/ECC", meaning: "Asymmetric: slow for bulk, great for key establishment/signing.", importance: "must" },
      { term: "IPsec", meaning: "L3 VPN encryption + auth; tunnel vs transport concept.", importance: "should" },
    ],
    writeDown: "1) When TLS vs IPsec. 2) When signing vs encryption with asymmetric keys. 3) What ECB breaks (pattern leak).",
    examTraps: [
      { a: "ECB is fine for large images", b: "Patterns leak—bad for repeated plaintext blocks" },
      { a: "Encrypt 10 Gbps with RSA directly", b: "Use symmetric for volume; asym for key/sign" },
    ],
    instantRecognition: [
      { keyword: "GCM, AEAD", answer: "Confidentiality + integrity in one" },
      { keyword: "mailbody S/MIME", answer: "Email at rest/in transit for message crypto" },
    ],
    threeSecondRecall: ["Bulk symmetric", "Asym bootstrap", "Protocol layer"],
    quickAction: "Name one protocol for web, one for L3 site-to-site VPN, one for file encryption.",
    miniQuizIntro: "Tech vs control vs protocol stems.",
    teachBackPrompt: "Why is hashing not a substitute for encryption for secrecy?",
  }),

  "1-4-obf": makeLesson("1-4-obf", "1.4 Obfuscation", "1", {
    videoFocus: [
      "Obfuscation: harder to read, not a substitute for real crypto",
      "Packing, encoding (Base64) vs encryption—stems that hide malware strings",
      "Security by obscurity is weak *alone* but layers can include obscurity",
    ],
    simpleExplanation:
      "Obfuscation scrambles or hides data/code to impede reading or static analysis. It can slow attackers and reduce casual leaks, but it is not confidentiality by itself. The exam may pair obfuscation in malware with *real* C2 and encryption; don’t conflate *encoding* (reversible) with *strong* secrecy when keys are public.",
    highlightRules: [
      { term: "Not encryption by default", meaning: "Reversible transforms without a secret are not confidential.", importance: "must" },
      { term: "Packer", meaning: "Obfuscate malware; AV uses unpacking behavior.", importance: "should" },
      { term: "Layering", meaning: "Obscurity is weak alone; can add cost to attackers as one layer.", importance: "should" },
    ],
    writeDown: "1) One legit use. 1) One misuse. 3) How analysts defeat simple obfuscation.",
    examTraps: [
      { a: "Base64 = secure", b: "Encoding, not access control" },
      { a: "Obfuscation = no detection", b: "Runtime unpack still observable" },
    ],
    instantRecognition: [
      { keyword: "hex strings, split constants", answer: "Obfuscation in malware" },
      { keyword: "minify JS", answer: "Dev convenience, limited security" },
    ],
    threeSecondRecall: ["Hides, not authorizes", "Reversible vs key", "Layer"],
    quickAction: "Find Base64 in any config: decode mentally—what risk remains?",
    miniQuizIntro: "Malware + app security stems with encoding tricks.",
    teachBackPrompt: "Security by obscurity: why is it insufficient as the only control?",
  }),

  "1-4-hash": makeLesson("1-4-hash", "1.4 Hashing and Digital Signatures", "1", {
    videoFocus: [
      "Hash: one-way, fixed size; detect tampering; password storage with salt+slow hash",
      "HMAC: keyed hash for integrity in symmetric contexts",
      "Digital signature: private sign, public verify; integrity + authenticity + often NR",
    ],
    simpleExplanation:
      "Hashing *fingerprints* data. Change one bit, hash changes. Password systems store *hash+salt* with slow KDFs. *Digital signatures* use asymmetric keys to prove origin and protect integrity. Don’t call AES a hash, or MD5/SHA-1 strong for *new* designs (exam knows legacy vs current).",
    highlightRules: [
      { term: "SHA-2/3 family", meaning: "Common integrity hashes; avoid MD5/SHA-1 for new.", importance: "must" },
      { term: "Salt", meaning: "Defeats rainbow tables; unique per user.", importance: "must" },
      { term: "Signature verify", meaning: "Uses sender’s public key; proves private key use.", importance: "must" },
    ],
    writeDown: "1) Hash vs encryption goal. 2) Why sign a hash of the file, not the whole file for RSA performance. 3) bcrypt/Argon2 role.",
    examTraps: [
      { a: "Encrypt password with fast AES, store in DB", b: "Password hashing, not reversible encryption" },
      { a: "Signature gives confidentiality", b: "Message may still be cleartext unless encrypted separately" },
    ],
    instantRecognition: [
      { keyword: "HMAC, API auth", answer: "Keyed integrity" },
      { keyword: "GPG, code signing", answer: "Digital signature pattern" },
    ],
    threeSecondRecall: ["Hash = detect change", "Salt+slow for passwords", "Sign = prove source"],
    quickAction: "Open a signed file’s properties: what does ‘valid signature’ tell you? What does it *not* tell you?",
    miniQuizIntro: "Integrity, signatures, and password storage mixed stems.",
    teachBackPrompt: "Why is SHA-256 alone not a good password storage scheme?",
  }),

  "1-4-bc": makeLesson("1-4-bc", "1.4 Blockchain", "1", {
    videoFocus: [
      "Distributed ledger, immutability via hash-linked blocks + consensus (high level)",
      "Use cases: supply chain, contracts—not ‘instant anonymous privacy’ by default",
      "Public vs private chain; performance and governance tradeoffs",
    ],
    simpleExplanation:
      "Blockchain is a *distributed append-only* ledger. Integrity comes from hash chaining and consensus rules, not a single DBA. For Security+, know *immutability*, *decentralized trust model*, and *where private keys* still must be protected. Smart contract bugs are *application* risk.",
    highlightRules: [
      { term: "Immutability", meaning: "Past blocks hard to change without redoing work/consensus (network-dependent).", importance: "must" },
      { term: "Consensus", meaning: "Agreement rules (e.g. PoW/PoS at concept level).", importance: "should" },
      { term: "Not magic privacy", meaning: "Many chains are pseudonymous; PII and key mgmt off-chain still matter.", importance: "should" },
    ],
    writeDown: "1) 3 features blockchains optimize for. 2) One non-crypto exam trap. 3) What a wallet really holds.",
    examTraps: [
      { a: "Blockchain = untraceable always", b: "Graph analysis, KYC, chain surveillance exist" },
      { a: "Immutability = no mistakes", b: "Bugs in smart contracts are permanent risk if deployed wrong" },
    ],
    instantRecognition: [
      { keyword: "hash chain, block", answer: "Integrity by construction" },
      { keyword: "51%, fork", answer: "Consensus / chain integrity" },
    ],
    threeSecondRecall: ["Append-only", "Distributed trust", "Keys still matter"],
    quickAction: "Explain one business use and one *security* downside of a private blockchain.",
    miniQuizIntro: "Integrity, trust models, and key custody.",
    teachBackPrompt: "How does a blockchain’s integrity differ from a signed log in a single SQL DB?",
  }),

  "1-4-cert": makeLesson("1-4-cert", "1.4 Certificates", "1", {
    videoFocus: [
      "X.509 structure at exam level: subject, issuer, dates, key usage, SAN",
      "Wildcard, DV/OV/EV *conceptually* in consumer trust models",
      "Pinning, CT logs (why mis-issuance is detectable) at a glance",
    ],
    simpleExplanation:
      "Certificates are signed statements binding identities to public keys. You must know *validity period*, *chain to trusted root*, *SAN* for many hostnames, and *key usage* constraints. The exam weaves in TLS, email signing, and API auth. Renewal and compromise drive operational security.",
    highlightRules: [
      { term: "SAN", meaning: "Multiple names on one cert—browser checks the connected host in SAN/CN story.", importance: "must" },
      { term: "Expiration", meaning: "Short-lived certs = smaller breach window; automation (ACME).", importance: "must" },
      { term: "Key usage", meaning: "Signing vs encipherment bits—wrong usage fails handshakes or validation.", importance: "should" },
    ],
    writeDown: "1) 4 fields you’d check in a cert viewer. 2) When wildcard is risky. 3) How ACME helps ops.",
    examTraps: [
      { a: "Any cert from any public CA in enterprise", b: "Internal PKI + trust store rules" },
      { a: "Private key in cert file on host", b: "Key pairs: protect private, distribute public" },
    ],
    instantRecognition: [
      { keyword: "name mismatch, ERR_CERT", answer: "Name/SAN/chain issue" },
      { keyword: "ACME, Let’s Encrypt", answer: "Automated renewal" },
    ],
    threeSecondRecall: ["Name binding", "Chain to trust", "Lifecycle"],
    quickAction: "Check your browser’s cert for one site: issuer, valid dates, SAN entries.",
    miniQuizIntro: "TLS, mail, and API client cert scenarios.",
    teachBackPrompt: "What does it mean when a private key is ‘compromised’ for a cert?",
  }),
};
