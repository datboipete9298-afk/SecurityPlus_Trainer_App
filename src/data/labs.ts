import type { Lab } from "../types";

export const labs: Lab[] = [
  {
    id: "lab-event-viewer",
    title: "Windows Event Viewer (read-only triage)",
    description: "Open Event Viewer, filter one Security log (4624/4625 if present). Understand log source + time order — no changes to system.",
    safeWarning: "Use your own machine or a VM; do not RDP to systems you do not own.",
    steps: [
      "Win+R → eventvwr.msc",
      "Windows Logs → Security (if available)",
      "Filter Current Log: Event IDs 4624 (success) / 4625 (fail) optional",
      "Note: what would you send to a SIEM? (one sentence)",
    ],
    relatedLessonIds: ["1-1", "1-2-aaa"],
    domain: "1",
  },
  {
    id: "lab-ipconfig",
    title: "ipconfig /all — own adapter story",
    description: "Map IPv4, DNS, gateway, MAC to ‘what would a defender check first?’",
    safeWarning: "Output is normal system info; do not post full output publicly.",
    steps: [
      "cmd or PowerShell: ipconfig /all",
      "Circle IPv4, DNS, default gateway, physical address",
      "Write: which field helps spot DNS issues vs wrong default route?",
    ],
    relatedLessonIds: ["1-1"],
    domain: "1",
  },
  {
    id: "lab-ping-trace",
    title: "ping + tracert to a safe host",
    description: "Reachability and path. Use 1.1.1.1 or the DNS your notes suggest — *your network only*.",
    safeWarning: "Do not run intensive scans; single ping is fine.",
    steps: [
      "ping 1.1.1.1 (or your gateway) -n 2",
      "tracert 1.1.1.1 and read hops conceptually",
      "Note: where would packet loss first matter for availability (CIA-A)?",
    ],
    relatedLessonIds: ["1-2-cia"],
    domain: "1",
  },
  {
    id: "lab-cert-view",
    title: "Browser certificate inspection (read-only)",
    description: "View TLS cert for any HTTPS site you legitimately use; check issuer, SAN, dates.",
    safeWarning: "No installing rogue certs. View only.",
    steps: [
      "Open a banking or major site you use; padlock → certificate",
      "Note issuer, validity dates, subject alternative names",
      "Relate: why expiry matters (availability/integrity of trust, not the HTTP body)",
    ],
    relatedLessonIds: ["1-2-nr", "1-2-zt"],
    domain: "1",
  },
  {
    id: "lab-hash",
    title: "File hash with built-in tools",
    description: "Windows: CertUtil -hashfile on a *copy* of a harmless file in Downloads.",
    safeWarning: "Hash only your own files.",
    steps: [
      "Copy a small .txt to Desktop",
      "PowerShell: Get-FileHash .\\file.txt -Algorithm SHA256",
      "Change one character in a copy, hash again, compare — integrity concept",
    ],
    relatedLessonIds: ["1-2-cia", "1-2-nr"],
    domain: "1",
  },
];

export function getLabsForLesson(lessonId: string) {
  return labs.filter((l) => l.relatedLessonIds.includes(lessonId));
}
