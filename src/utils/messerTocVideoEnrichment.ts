import { MESSER_COURSE_NOTES_TOC } from "../data/messerCourseNotesToc";
import { getMesserVideosForLesson } from "../data/videoLessonGroups";
import type { MesserCourseNotesTocRow } from "../data/tocTypes";

export type MesserCourseNotesVideoMatchStatus =
  | "video_matched"
  | "pdf_only"
  | "needs_video_verification"
  | "grouped_under_objective";

export type MesserCourseNotesTocEnrichedRow = MesserCourseNotesTocRow & {
  subtopicId: string;
  matchedVideoId: string | null;
  matchedVideoTitle: string | null;
  videoMatchStatus: MesserCourseNotesVideoMatchStatus;
};

const OVERVIEW_LESSONS = new Set(["2-0", "3-0", "3-iot", "4-0", "5-0"]);

function pickVideoForTocRow(row: MesserCourseNotesTocRow, vids: readonly { videoId: string; title: string }[]) {
  if (vids.length === 0) return null;
  const t = row.title.toLowerCase();
  const words = t.split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  const key = words.slice(0, 5).join(" ");
  const hit =
    vids.find((v) => {
      const vt = v.title.toLowerCase();
      return words.some((w) => w.length > 4 && vt.includes(w));
    }) ?? vids.find((v) => v.title.toLowerCase().includes(key.slice(0, 14)));
  return hit ?? null;
}

/** Course Notes TOC + playlist cross-links (no PDF body text). */
export function enrichMesserCourseNotesToc(): MesserCourseNotesTocEnrichedRow[] {
  return MESSER_COURSE_NOTES_TOC.map((row) => {
    const subtopicId = row.tocId;
    if (!row.lessonId) {
      return { ...row, subtopicId, matchedVideoId: null, matchedVideoTitle: null, videoMatchStatus: "pdf_only" };
    }
    const vids = getMesserVideosForLesson(row.lessonId);
    const hit = pickVideoForTocRow(row, vids);
    if (hit) {
      return {
        ...row,
        subtopicId,
        matchedVideoId: hit.videoId,
        matchedVideoTitle: hit.title,
        videoMatchStatus: "video_matched",
      };
    }
    if (vids.length > 0) {
      return {
        ...row,
        subtopicId,
        matchedVideoId: null,
        matchedVideoTitle: null,
        videoMatchStatus: "grouped_under_objective",
      };
    }
    if (OVERVIEW_LESSONS.has(row.lessonId)) {
      return {
        ...row,
        subtopicId,
        matchedVideoId: null,
        matchedVideoTitle: null,
        videoMatchStatus: "needs_video_verification",
      };
    }
    return { ...row, subtopicId, matchedVideoId: null, matchedVideoTitle: null, videoMatchStatus: "pdf_only" };
  });
}
