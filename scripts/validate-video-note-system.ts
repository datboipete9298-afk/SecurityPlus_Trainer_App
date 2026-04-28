/**
 * Validates video + note fusion wiring (imports, hooks, persisted fields).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function read(p: string) {
  return fs.readFileSync(path.join(root, p), "utf8");
}

function dead(reason: string): never {
  console.error(`validate-video-notes: FAIL — ${reason}`);
  process.exit(1);
}

const modeSrc = read("src/components/video/VideoStudyMode.tsx");
if (!modeSrc.includes("export default function VideoStudyMode")) dead("VideoStudyMode component missing");
for (const s of ["videoFusionChecklist", "recordVideoFusionActivity", "Pause here and answer", "Smart note rules", "onPauseContextChange", "Good — now prove it with one question."]) {
  if (!modeSrc.includes(s)) dead(`VideoStudyMode missing: "${s}"`);
}

const pausePool = read("src/utils/pausePrompts.ts");
if (!pausePool.includes("buildPausePromptPoolFromLesson") || !pausePool.includes("optionalTimecode")) {
  dead("pausePrompts.ts should export buildPausePromptPoolFromLesson and support optionalTimecode shape");
}

const vfTypes = read("src/types/videoFusion.ts");
if (!vfTypes.includes("PausePromptItem") || !vfTypes.includes("optionalTimecode")) {
  dead("videoFusion types should include PausePromptItem with optionalTimecode");
}

const lessonPage = read("src/pages/LessonPage.tsx");
if (!lessonPage.includes("onPauseContextChange") || !lessonPage.includes("fusionPauseCtx") || !lessonPage.includes("buildPausePromptPoolFromLesson")) {
  dead("LessonPage should wire fusion pause context + buildPausePromptPoolFromLesson");
}

for (const f of ["src/pages/WatchLesson.tsx", "src/pages/LessonPage.tsx", "src/pages/PdfLessonGuidePage.tsx"]) {
  const t = read(f);
  if (!t.includes("../components/video/VideoStudyMode") && !t.includes("components/video/VideoStudyMode")) dead(`${f} should import VideoStudyMode`);
}

const ctx = read("src/context/ProgressContext.tsx");
if (!ctx.includes("recordVideoFusionActivity")) dead("recordVideoFusionActivity missing from ProgressContext");

const storage = read("src/utils/storage.ts");
if (!storage.includes("videoStudyStats")) dead("Persisted videoStudyStats missing from storage.ts");

const resume = read("src/utils/studyResume.ts");
if (!resume.includes("videoNotesLessonId")) dead("studyResume.ts missing videoNotesLessonId");

const types = read("src/types/beginner.ts");
if (!types.includes("videoFusionChecklist")) dead("LessonProgress.videoFusionChecklist missing");

const tp = read("src/components/AITutorPanel.tsx");
if (!tp.includes("videoFusion")) dead("AITutorPanel missing videoFusion context");

console.log("validate-video-notes: OK — fusion mode wired, persistence + resume hooks present.");
