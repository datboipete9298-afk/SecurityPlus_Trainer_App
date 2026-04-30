/**
 * Single canonical view of SY0-701 coverage: Messer playlist, Course Notes / Study Guide /
 * Practice Exams TOCs, and SECTION_ORDER lessons. Used for search hints, validators, and reports.
 * No copyrighted prose; IDs and structure only.
 */
import { SECTION_ORDER } from "./sectionOrder";
import { MESSER_COURSE_NOTES_TOC } from "./messerCourseNotesToc";
import { EXAM_STUDY_GUIDE_TOC } from "./examStudyGuideToc";
import { PRACTICE_EXAMS_BOOK_TOC } from "./practiceExamsBookToc";
import { PROFESSOR_MESSER_701_PLAYLIST } from "./professorMesser701Playlist";
import { MESSER_PLAYLIST_INDEX_TO_LESSON_ID } from "./videoLessonGroups";
import type { PracticeExamsBookTocRow, TocMapStatus } from "./tocTypes";

export type CanonicalDomainLabel = "1.0" | "2.0" | "3.0" | "4.0" | "5.0" | "practice";

export type CanonicalSource =
  | "messer_video"
  | "messer_course_notes"
  | "exam_study_guide"
  | "practice_exams"
  | "app_lesson";

export type CanonicalItemStatus =
  | "full_lesson"
  | "subtopic_under_lesson"
  | "pdf_supported"
  | "video_supported"
  | "practice_supported"
  | "needs_manual_review";

export type CanonicalCoverageItem = {
  canonicalId: string;
  domain: CanonicalDomainLabel;
  /** Objective / section label for display and checklists */
  objective: string;
  title: string;
  source: CanonicalSource;
  sourceIndex?: number;
  pdfPage?: number | string;
  videoId?: string;
  videoTitle?: string;
  /** Host lesson for in-app study path (when applicable). */
  lessonId?: string;
  /** Domain overview or synthetic bucket (e.g. practice book). */
  parentLessonId?: string;
  route: string;
  status: CanonicalItemStatus;
};

const PRACTICE_PARENT_ID = "__practice_book__";

function domainDigitToLabel(d: "1" | "2" | "3" | "4" | "5"): CanonicalDomainLabel {
  return `${d}.0` as CanonicalDomainLabel;
}

function domainOverviewForDigit(d: "1" | "2" | "3" | "4" | "5"): string {
  if (d === "1") return "1-0";
  if (d === "2") return "2-0";
  if (d === "3") return "3-0";
  if (d === "4") return "4-0";
  return "5-0";
}

/** Map Course Notes objective string (e.g. "3.1") to canonical domain label. */
export function canonicalDomainFromCourseNotesObjective(objective: string): CanonicalDomainLabel {
  const m = objective.match(/^(\d)/);
  if (m && /^[1-5]$/.test(m[1]!)) return domainDigitToLabel(m[1] as "1" | "2" | "3" | "4" | "5");
  return "1.0";
}

function mapTocStatusToCanonical(ms: TocMapStatus): CanonicalItemStatus {
  if (ms === "practice_only") return "practice_supported";
  return ms as CanonicalItemStatus;
}

export function courseNotesRowRoute(lessonId: string | null, tocId: string): string {
  if (!lessonId) return `/pdf-guides`;
  return `/lesson/${lessonId}?toc=${encodeURIComponent(tocId)}`;
}

export function practiceExamsBookRowRoute(row: PracticeExamsBookTocRow): string {
  switch (row.routeHint) {
    case "exam_a":
      return "/quiz/messer-exam-a?mode=study";
    case "exam_b":
      return "/quiz/messer-exam-b?mode=study";
    case "exam_c":
      return "/quiz/messer-exam-c?mode=study";
    case "pbq_hub":
      return "/practice-exams/pbq";
    case "practice_hub":
      return "/practice-exams";
    case "intro":
    default:
      return "/pdf-guides";
  }
}

function studyGuideRowRoute(lessonId: string | null, tocId: string): string {
  if (!lessonId) return `/pdf-guides`;
  return `/lesson/${lessonId}?sg=${encodeURIComponent(tocId)}`;
}

/**
 * Required Course Notes titles for Domains 3–5 (hard audit). Wording matches `messerCourseNotesToc.ts`.
 */
export const DOMAIN_3_COURSE_NOTES_REQUIRED_TITLES = [
  "Security Architecture",
  "Cloud Infrastructures",
  "Network Infrastructure Concepts",
  "Other Infrastructure Concepts",
  "Infrastructure Considerations",
  "Secure Infrastructures",
  "Intrusion Prevention",
  "Network Appliances",
  "Port Security",
  "Firewall Types",
  "Secure Communication",
  "Data Types and Classifications",
  "States of Data",
  "Protecting Data",
  "Resiliency",
  "Capacity Planning",
  "Recovery Testing",
  "Backups",
  "Power Resiliency",
] as const;

export const DOMAIN_4_COURSE_NOTES_REQUIRED_TITLES = [
  "Operations and Incident Response",
  "Secure Baselines",
  "Hardening Targets",
  "Securing Wireless and Mobile",
  "Wireless Security Settings",
  "Application Security",
  "Asset Management",
  "Vulnerability Scanning",
  "Threat Intelligence",
  "Penetration Testing",
  "Analyzing Vulnerabilities",
  "Vulnerability Remediation",
  "Security Monitoring",
  "Security Tools",
  "Firewalls",
  "Web Filtering",
  "Operating System Security",
  "Secure Protocols",
  "Email Security",
  "Monitoring Data",
  "Endpoint Security",
  "Identity and Access Management",
  "Access Controls",
  "Multifactor Authentication",
  "Password Security",
  "Scripting and Automation",
  "Incident Response",
  "Incident Planning",
  "Digital Forensics",
  "Log Data",
] as const;

export const DOMAIN_5_COURSE_NOTES_REQUIRED_TITLES = [
  "Governance, Risk, and Compliance",
  "Security Policies",
  "Security Standards",
  "Security Procedures",
  "Security Considerations",
  "Data Roles and Responsibilities",
  "Risk Management",
  "Risk Analysis",
  "Risk Management Strategies",
  "Business Impact Analysis",
  "Third-party Risk Assessment",
  "Agreement Types",
  "Compliance",
  "Privacy",
  "Audits and Assessments",
  "Penetration Tests",
  "Security Awareness",
  "User Training",
] as const;

/** Study Guide section titles cross-checked for architecture / ops / GRC (substring match on row.title + sectionPath). */
export const DOMAIN_3_STUDY_GUIDE_PHRASES = [
  "Secure Enterprise Network Architecture",
  "Secure Cloud Network Architecture",
  "Resiliency and Site Security",
] as const;

export const DOMAIN_4_STUDY_GUIDE_PHRASES = [
  "Implement Identity and Access Management",
  "Vulnerability Management",
  "Evaluate Network Security Capabilities",
  "Assess Endpoint Security Capabilities",
  "Enhance Application Security Capabilities",
  "Incident Response and Monitoring",
  "Indicators of Malicious Activity",
] as const;

export const DOMAIN_5_STUDY_GUIDE_PHRASES = [
  "Summarize Security Governance Concepts",
  "Explain Risk Management",
  "Summarize Data Protection and Compliance",
] as const;

export function buildSecurityPlus701CanonicalCoverage(): CanonicalCoverageItem[] {
  const out: CanonicalCoverageItem[] = [];

  SECTION_ORDER.forEach((s, i) => {
    out.push({
      canonicalId: `app-${s.id}`,
      domain: domainDigitToLabel(s.domain),
      objective: s.label.match(/^(\d+\.\d+)/)?.[1] ?? s.domain,
      title: s.label,
      source: "app_lesson",
      sourceIndex: i,
      lessonId: s.id,
      parentLessonId: domainOverviewForDigit(s.domain),
      route: `/lesson/${s.id}`,
      status: "full_lesson",
    });
  });

  for (const row of MESSER_COURSE_NOTES_TOC) {
    const domain = canonicalDomainFromCourseNotesObjective(row.objective);
    const parent = domainOverviewForDigit(domain[0] as "1" | "2" | "3" | "4" | "5");
    const st = mapTocStatusToCanonical(row.mapStatus);
    out.push({
      canonicalId: row.tocId,
      domain,
      objective: row.objective,
      title: row.title,
      source: "messer_course_notes",
      pdfPage: row.pdfPage,
      lessonId: row.lessonId ?? undefined,
      parentLessonId: row.lessonId ? parent : PRACTICE_PARENT_ID,
      route: courseNotesRowRoute(row.lessonId, row.tocId),
      status: st,
    });
  }

  let sgIdx = 0;
  for (const row of EXAM_STUDY_GUIDE_TOC) {
    sgIdx++;
    const domain = domainDigitToLabel(row.domainHint);
    out.push({
      canonicalId: row.tocId,
      domain,
      objective: row.sectionPath.slice(0, 80),
      title: row.title,
      source: "exam_study_guide",
      sourceIndex: sgIdx,
      lessonId: row.lessonId ?? undefined,
      parentLessonId: row.lessonId ? domainOverviewForDigit(row.domainHint) : PRACTICE_PARENT_ID,
      route: studyGuideRowRoute(row.lessonId, row.tocId),
      status: mapTocStatusToCanonical(row.mapStatus),
    });
  }

  let peIdx = 0;
  for (const row of PRACTICE_EXAMS_BOOK_TOC) {
    peIdx++;
    out.push({
      canonicalId: row.tocId,
      domain: "practice",
      objective: row.routeHint,
      title: row.title,
      source: "practice_exams",
      sourceIndex: peIdx,
      pdfPage: row.pdfPage,
      parentLessonId: PRACTICE_PARENT_ID,
      route: practiceExamsBookRowRoute(row),
      status: "practice_supported",
    });
  }

  for (const v of PROFESSOR_MESSER_701_PLAYLIST) {
    const lid = MESSER_PLAYLIST_INDEX_TO_LESSON_ID[v.index - 1];
    const meta = lid ? SECTION_ORDER.find((s) => s.id === lid) : undefined;
    const d = meta?.domain ?? "1";
    const domain = domainDigitToLabel(d);
    out.push({
      canonicalId: `vid-${v.index}`,
      domain,
      objective: `Playlist #${v.index}`,
      title: v.title,
      source: "messer_video",
      sourceIndex: v.index,
      videoId: v.videoId,
      videoTitle: v.title,
      lessonId: lid ?? undefined,
      parentLessonId: lid ? domainOverviewForDigit(d) : undefined,
      route: lid ? `/watch/${lid}?video=${encodeURIComponent(v.videoId)}` : "/roadmap",
      status: lid ? "video_supported" : "needs_manual_review",
    });
  }

  return out;
}
