/**
 * Primary YouTube id per study lesson — derived from the official 121-video playlist grouping.
 * Source of truth: `videoLessonGroups.ts` + `professorMesser701Playlist.ts`.
 * Playlist: https://www.youtube.com/playlist?list=PLG49S3nxzAnl4QDVqK-hOnoqcSKEIDDuv
 */
import { MESSER_PRIMARY_VIDEO_ID_BY_LESSON } from "./videoLessonGroups";

export const KNOWN_YT: Readonly<Partial<Record<string, string>>> = MESSER_PRIMARY_VIDEO_ID_BY_LESSON;
