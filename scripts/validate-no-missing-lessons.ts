/**
 * Final curriculum reconciliation gate: Domains 3–5 checklists, TOC mapStatus, canonical routes,
 * 121-video assignments, and report artifacts. Run: npx tsx scripts/validate-no-missing-lessons.ts
 */
import { existsSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const {
    buildSecurityPlus701CanonicalCoverage,
    DOMAIN_3_COURSE_NOTES_REQUIRED_TITLES,
    DOMAIN_4_COURSE_NOTES_REQUIRED_TITLES,
    DOMAIN_5_COURSE_NOTES_REQUIRED_TITLES,
    DOMAIN_3_STUDY_GUIDE_PHRASES,
    DOMAIN_4_STUDY_GUIDE_PHRASES,
    DOMAIN_5_STUDY_GUIDE_PHRASES,
  } = await import("../src/data/securityPlus701CanonicalCoverage.ts");

  const { MESSER_COURSE_NOTES_TOC } = await import("../src/data/messerCourseNotesToc.ts");
  const { EXAM_STUDY_GUIDE_TOC } = await import("../src/data/examStudyGuideToc.ts");
  const { PRACTICE_EXAMS_BOOK_TOC } = await import("../src/data/practiceExamsBookToc.ts");
  const { PROFESSOR_MESSER_701_PLAYLIST } = await import("../src/data/professorMesser701Playlist.ts");
  const { MESSER_PLAYLIST_INDEX_TO_LESSON_ID } = await import("../src/data/videoLessonGroups.ts");
  const { lessons, ORDERED_LESSON_IDS } = await import("../src/data/lessons.ts");
  const { isLessonUnlocked } = await import("../src/utils/adaptive.ts");

  const problems: string[] = [];

  const reportPaths = [
    "FULL_LESSON_COVERAGE_REPORT.md",
    "VIDEO_LESSON_ALIGNMENT_REPORT.md",
    "FULL_TOC_TO_LESSON_MAPPING_REPORT.md",
    "PROFESSOR_MESSER_121_VIDEO_REPORT.md",
  ];
  for (const rp of reportPaths) {
    if (!existsSync(join(root, rp))) {
      problems.push(`Expected report missing: ${rp} (run full validate chain before this script, or npm run build)`);
    }
  }

  if (PROFESSOR_MESSER_701_PLAYLIST.length !== 121) {
    problems.push(`Professor Messer playlist must have 121 videos, got ${PROFESSOR_MESSER_701_PLAYLIST.length}`);
  }
  if (MESSER_PLAYLIST_INDEX_TO_LESSON_ID.length !== 121) {
    problems.push(`MESSER_PLAYLIST_INDEX_TO_LESSON_ID must have 121 entries, got ${MESSER_PLAYLIST_INDEX_TO_LESSON_ID.length}`);
  }

  const seenVid = new Set<string>();
  for (const v of PROFESSOR_MESSER_701_PLAYLIST) {
    if (seenVid.has(v.videoId)) problems.push(`Duplicate YouTube id in playlist: ${v.videoId}`);
    seenVid.add(v.videoId);
    if (v.videoId.length !== 11) problems.push(`Invalid video id length at index ${v.index}`);
  }

  for (let i = 0; i < 121; i++) {
    const lid = MESSER_PLAYLIST_INDEX_TO_LESSON_ID[i];
    if (lid == null) problems.push(`Null lesson at playlist index ${i + 1}`);
    else if (!lessons[lid]) problems.push(`Unknown lessonId at playlist index ${i + 1}: ${lid}`);
  }

  for (const row of MESSER_COURSE_NOTES_TOC) {
    if (!row.mapStatus) problems.push(`Course Notes ${row.tocId} missing mapStatus`);
    if (!row.lessonId) problems.push(`Course Notes ${row.tocId} missing lessonId`);
    else if (!lessons[row.lessonId]) problems.push(`Course Notes ${row.tocId} references unknown lessonId ${row.lessonId}`);
  }

  for (const row of EXAM_STUDY_GUIDE_TOC) {
    if (!row.mapStatus) problems.push(`Study Guide ${row.tocId} missing mapStatus`);
  }

  for (const row of PRACTICE_EXAMS_BOOK_TOC) {
    if (!row.mapStatus) problems.push(`Practice Exams TOC ${row.tocId} missing mapStatus`);
  }

  const cnTitles = MESSER_COURSE_NOTES_TOC.map((r) => r.title.toLowerCase());
  function assertCourseNotesTitles(label: string, titles: readonly string[]) {
    for (const t of titles) {
      const needle = t.toLowerCase();
      const ok = cnTitles.some((x) => x.includes(needle));
      if (!ok) problems.push(`${label}: no Course Notes TOC title containing "${t}"`);
    }
  }
  assertCourseNotesTitles("Domain 3", DOMAIN_3_COURSE_NOTES_REQUIRED_TITLES);
  assertCourseNotesTitles("Domain 4", DOMAIN_4_COURSE_NOTES_REQUIRED_TITLES);
  assertCourseNotesTitles("Domain 5", DOMAIN_5_COURSE_NOTES_REQUIRED_TITLES);

  const sgBlob = EXAM_STUDY_GUIDE_TOC.map((r) => `${r.sectionPath} ${r.title}`).join(" ").toLowerCase();
  for (const ph of DOMAIN_3_STUDY_GUIDE_PHRASES) {
    if (!sgBlob.includes(ph.toLowerCase())) problems.push(`Domain 3 study guide outline missing phrase: ${ph}`);
  }
  for (const ph of DOMAIN_4_STUDY_GUIDE_PHRASES) {
    if (!sgBlob.includes(ph.toLowerCase())) problems.push(`Domain 4 study guide outline missing phrase: ${ph}`);
  }
  for (const ph of DOMAIN_5_STUDY_GUIDE_PHRASES) {
    if (!sgBlob.includes(ph.toLowerCase())) problems.push(`Domain 5 study guide outline missing phrase: ${ph}`);
  }

  const cov = buildSecurityPlus701CanonicalCoverage();
  for (const item of cov) {
    if (!item.route || !item.route.startsWith("/")) {
      problems.push(`Canonical item ${item.canonicalId} has invalid route: ${item.route}`);
    }
    if (!item.lessonId && !item.parentLessonId) {
      problems.push(`Canonical item ${item.canonicalId} needs lessonId or parentLessonId`);
    }
  }

  if (!isLessonUnlocked("4-ops", { completedLessons: [] } as never)) {
    problems.push("Hard lesson lock: isLessonUnlocked must allow open navigation");
  }

  const lessonPage = readFileSync(join(root, "src/pages/LessonPage.tsx"), "utf8");
  if (!lessonPage.includes("useSearchParams")) problems.push("LessonPage must import useSearchParams for ?toc= / ?sg=");
  if (!lessonPage.includes("LessonCourseNotesSubtopicsPanel")) problems.push("LessonPage must render LessonCourseNotesSubtopicsPanel");

  const roadmap = readFileSync(join(root, "src/pages/Roadmap.tsx"), "utf8");
  if (!roadmap.includes("courseNotesTocRowsForLesson")) problems.push("Roadmap must import courseNotesTocRowsForLesson for topic counts");

  const pdfHub = readFileSync(join(root, "src/pages/PdfGuideHubPage.tsx"), "utf8");
  if (!pdfHub.includes("?toc=")) problems.push("PdfGuideHubPage must deep-link Course Notes rows with ?toc=");
  if (!pdfHub.includes("?sg=")) problems.push("PdfGuideHubPage must deep-link Study Guide rows with ?sg=");

  const search = readFileSync(join(root, "src/pages/SearchPage.tsx"), "utf8");
  if (!search.includes("courseNotesHits")) problems.push("SearchPage must surface Course Notes TOC hits");

  if (lessonPage.includes("isLessonUnlocked(")) {
    problems.push("LessonPage must not call isLessonUnlocked (open navigation)");
  }

  const subtopicCount = MESSER_COURSE_NOTES_TOC.filter((r) => r.mapStatus === "subtopic_under_lesson").length;

  const lines: string[] = [];
  lines.push("# FINAL_NO_MISSING_LESSONS_REPORT");
  lines.push("");
  lines.push("Generated by `scripts/validate-no-missing-lessons.ts`.");
  lines.push("");
  lines.push("## Counts");
  lines.push("");
  lines.push(`| Total canonical rows | ${cov.length} |`);
  lines.push(`| App lessons (SECTION_ORDER) | ${ORDERED_LESSON_IDS.length} |`);
  lines.push(`| Course Notes subtopic rows | ${subtopicCount} |`);
  lines.push(`| Course Notes TOC rows | ${MESSER_COURSE_NOTES_TOC.length} |`);
  lines.push(`| Study Guide TOC rows | ${EXAM_STUDY_GUIDE_TOC.length} |`);
  lines.push(`| Practice Exams book TOC rows | ${PRACTICE_EXAMS_BOOK_TOC.length} |`);
  lines.push(`| Professor Messer playlist videos | ${PROFESSOR_MESSER_701_PLAYLIST.length} |`);
  lines.push("");
  lines.push("## Domain 3 checklist (Course Notes)");
  lines.push("");
  for (const t of DOMAIN_3_COURSE_NOTES_REQUIRED_TITLES) {
    const ok = cnTitles.some((x) => x.includes(t.toLowerCase()));
    lines.push(`- [${ok ? "x" : " "}] ${t}`);
  }
  lines.push("");
  lines.push("## Domain 4 checklist (Course Notes)");
  lines.push("");
  for (const t of DOMAIN_4_COURSE_NOTES_REQUIRED_TITLES) {
    const ok = cnTitles.some((x) => x.includes(t.toLowerCase()));
    lines.push(`- [${ok ? "x" : " "}] ${t}`);
  }
  lines.push("");
  lines.push("## Domain 5 checklist (Course Notes)");
  lines.push("");
  for (const t of DOMAIN_5_COURSE_NOTES_REQUIRED_TITLES) {
    const ok = cnTitles.some((x) => x.includes(t.toLowerCase()));
    lines.push(`- [${ok ? "x" : " "}] ${t}`);
  }
  lines.push("");
  lines.push("## Missing / manual review");
  lines.push("");
  if (problems.length) {
    lines.push("Validator **failed** — fix items below, then re-run.");
    lines.push("");
    for (const p of problems) lines.push(`- ${p}`);
  } else {
    lines.push("_No blocking failures. All required Domain 3–5 Course Notes titles and Study Guide cross-phrases matched._");
  }
  lines.push("");

  writeFileSync(join(root, "FINAL_NO_MISSING_LESSONS_REPORT.md"), lines.join("\n"), "utf8");

  if (problems.length) {
    console.error("validate-no-missing-lessons: FAILED\n" + problems.join("\n"));
    process.exit(1);
  }
  console.log("validate-no-missing-lessons: OK — wrote FINAL_NO_MISSING_LESSONS_REPORT.md");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
