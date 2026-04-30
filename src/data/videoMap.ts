import { SECTION_ORDER } from "./sectionOrder";
import { getPrimaryMesserVideoIdForLesson } from "./videoLessonGroups";
import { PROFESSOR_MESSER_COURSE_INDEX, messerVideoPage, youtubeEmbed, youtubeWatch } from "./videoConstants";

/**
 * One entry per course video. `youtubeVideoId` — add from the official playlist when you match a lesson to a video.
 * https://www.youtube.com/playlist?list=PLG49S3nxzAnl4QDVqK-hOnoqcSKEIDDuv
 */
export type VideoMapEntry = {
  /** Display title (matches Professor Messer naming style) */
  title: string;
  section: string;
  /** e.g. 11.8 = 11 min 48 sec from course index */
  estimatedWatchTimeMin?: number;
  /** Set when the official YouTube id is known */
  youtubeVideoId?: string;
  /** If true, UI shows playlist fallback — no primary row in the 121-video grouping for this study lesson. */
  needsVideoUrl?: boolean;
  /** Direct page for this *topic* on Professor Messer (when known). */
  professorMesserPageUrl?: string;
};

/** Manually matched Messer *site* slugs (topic pages). If missing, we fall back to the course index. */
const MESSER_SLUG: Partial<Record<string, string>> = {
  "1-1": "security-controls-sy0-701",
  "1-2-cia": "the-cia-triad-sy0-701",
  "1-2-nr": "non-repudiation-sy0-701",
  "1-2-aaa": "authentication-authorization-and-accounting-sy0-701",
  "1-2-gap": "gap-analysis-sy0-701",
  "1-2-zt": "zero-trust-sy0-701",
  "1-2-phys": "physical-security-sy0-701",
  "1-2-dec": "deception-and-disruption-sy0-701",
  "1-3-cm": "change-management-sy0-701",
  "1-3-tcm": "technical-change-management-sy0-701",
  "1-4-pki": "public-key-infrastructure-sy0-701",
  "1-4-enc": "encrypting-data-sy0-701",
  "1-4-kex": "key-exchange-sy0-701",
  "1-4-enc-tech": "encryption-technologies-sy0-701",
  "1-4-obf": "obfuscation-sy0-701",
  "1-4-hash": "hashing-and-digital-signatures-sy0-701",
  "1-4-bc": "blockchain-technology-sy0-701",
  "1-4-cert": "certificates-sy0-701",
  "2-1": "threat-actors-sy0-701",
  "2-2-vec": "common-threat-vectors-sy0-701",
  "2-2-ph": "phishing-sy0-701",
  "2-2-imp": "impersonation-sy0-701",
  "2-2-wh": "watering-hole-attacks-sy0-701",
  "2-2-se": "other-social-engineering-attacks-sy0-701",
  "2-3-mem": "memory-injections-sy0-701",
  "2-3-bo": "buffer-overflows-sy0-701",
  "2-3-rc": "race-conditions-sy0-701",
  "2-3-mu": "malicious-updates-sy0-701",
  "2-3-os": "operating-system-vulnerabilities-sy0-701",
  "2-3-sqli": "sql-injection-sy0-701",
  "2-3-xss": "cross-site-scripting-sy0-701",
  "2-3-hw": "hardware-vulnerabilities-sy0-701",
  "2-3-virt": "virtualization-vulnerabilities-sy0-701",
  "2-3-cloud": "cloud-specific-vulnerabilities-sy0-701",
  "2-3-sc": "supply-chain-vulnerabilities-sy0-701",
  "2-3-mis": "misconfiguration-vulnerabilities-sy0-701",
  "2-3-mob": "mobile-device-vulnerabilities-sy0-701",
  "2-3-zd": "zero-day-vulnerabilities-sy0-701",
  "2-4-mal": "an-overview-of-malware-sy0-701",
  "2-4-vw": "viruses-and-worms-sy0-701",
  "2-4-sb": "spyware-and-bloatware-sy0-701",
  "2-4-om": "other-malware-types-sy0-701",
  "2-4-pa": "physical-attacks-sy0-701",
  "2-4-dos": "denial-of-service-sy0-701",
  "2-4-dnsa": "dns-attacks-sy0-701",
  "2-4-wl": "wireless-attacks-sy0-701",
  "2-4-onp": "on-path-attacks-sy0-701",
  "2-4-rep": "replay-attacks-sy0-701",
  "2-4-mcode": "malicious-code-sy0-701",
  "2-4-appa": "application-attacks-sy0-701",
  "2-4-cryptoa": "cryptographic-attacks-sy0-701",
  "2-4-pw": "password-attacks-sy0-701",
  "2-4-ioc": "indicators-of-compromise-sy0-701",
  "2-5-seg": "segmentation-and-access-control-sy0-701",
  "2-5-mit": "mitigation-techniques-sy0-701",
  "2-5-harden": "hardening-techniques-sy0-701",
};

/** Minutes from course index / video descriptions where we listed them. */
const RUNTIME_MIN: Partial<Record<string, number>> = {
  "1-1": 12,
  "1-2-cia": 5,
  "1-2-nr": 8,
  "1-2-aaa": 9,
  "1-2-gap": 7,
  "1-2-zt": 10,
  "1-2-phys": 8,
  "1-2-dec": 5,
  "1-3-cm": 11,
  "1-3-tcm": 11,
  "1-4-pki": 9,
  "1-4-enc": 10,
  "1-4-kex": 4,
  "1-4-enc-tech": 7,
  "1-4-obf": 8,
  "1-4-hash": 10,
  "1-4-bc": 2,
  "1-4-cert": 15,
  "2-1": 10,
  "2-2-vec": 17,
  "2-2-ph": 7,
  "2-2-imp": 6,
  "2-2-wh": 4,
  "2-2-se": 4,
  "2-4-mal": 6,
};

function buildEntry(id: string, label: string): VideoMapEntry {
  const sectionMatch = label.match(/^(\d+\.\d+)/);
  const section = sectionMatch ? sectionMatch[1]! : id;
  const title = `${label.replace(/^\d+\.\d+\s+/, "")} - CompTIA Security+ SY0-701 - ${section}`;
  const slug = MESSER_SLUG[id];
  const yt = getPrimaryMesserVideoIdForLesson(id) ?? undefined;
  const pm = slug ? messerVideoPage(slug) : PROFESSOR_MESSER_COURSE_INDEX;
  return {
    title,
    section,
    estimatedWatchTimeMin: RUNTIME_MIN[id],
    youtubeVideoId: yt,
    needsVideoUrl: !yt,
    professorMesserPageUrl: pm,
  };
}

const raw: Record<string, VideoMapEntry> = {};
for (const s of SECTION_ORDER) {
  raw[s.id] = buildEntry(s.id, s.label);
}

/** 1.0 uses playlist #1 (course intro) when grouped — title override only. */
raw["1-0"] = {
  ...raw["1-0"]!,
  title: "General Security Concepts (start here) - SY0-701",
  needsVideoUrl: !getPrimaryMesserVideoIdForLesson("1-0"),
  professorMesserPageUrl: PROFESSOR_MESSER_COURSE_INDEX,
};
raw["2-0"] = {
  ...raw["2-0"]!,
  title: "Threats, Vulnerabilities, and Mitigations (section overview) - SY0-701",
  needsVideoUrl: true,
  professorMesserPageUrl: PROFESSOR_MESSER_COURSE_INDEX,
};

raw["5-0"] = {
  ...raw["5-0"]!,
  needsVideoUrl: true,
  professorMesserPageUrl: PROFESSOR_MESSER_COURSE_INDEX,
};
raw["3-0"] = {
  ...raw["3-0"]!,
  needsVideoUrl: !getPrimaryMesserVideoIdForLesson("3-0"),
  professorMesserPageUrl: PROFESSOR_MESSER_COURSE_INDEX,
};
raw["3-iot"] = {
  ...raw["3-iot"]!,
  needsVideoUrl: !getPrimaryMesserVideoIdForLesson("3-iot"),
  professorMesserPageUrl: PROFESSOR_MESSER_COURSE_INDEX,
};
raw["4-0"] = {
  ...raw["4-0"]!,
  needsVideoUrl: !getPrimaryMesserVideoIdForLesson("4-0"),
  professorMesserPageUrl: PROFESSOR_MESSER_COURSE_INDEX,
};
raw["5-grc"] = {
  ...raw["5-grc"]!,
  needsVideoUrl: !getPrimaryMesserVideoIdForLesson("5-grc"),
  professorMesserPageUrl: PROFESSOR_MESSER_COURSE_INDEX,
};

export const VIDEO_MAP: Record<string, VideoMapEntry> = raw;

export function getVideoForLesson(lessonId: string): VideoMapEntry & {
  youtubeUrl: string;
  embedUrl: string;
  videoTitle: string;
} {
  const v = VIDEO_MAP[lessonId] ?? {
    title: "Unknown lesson",
    section: "?",
    needsVideoUrl: true,
    professorMesserPageUrl: PROFESSOR_MESSER_COURSE_INDEX,
  };
  const vid = v.youtubeVideoId;
  return {
    ...v,
    videoTitle: v.title,
    youtubeUrl: vid ? youtubeWatch(vid) : "",
    embedUrl: vid ? youtubeEmbed(vid) : "",
  };
}
