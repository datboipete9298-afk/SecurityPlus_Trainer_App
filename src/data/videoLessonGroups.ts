/**
 * Layer 2: all 121 Professor Messer playlist videos grouped under Layer 1 study lessons (SECTION_ORDER).
 * Primary video = first playlist row assigned to that lesson (embed default).
 */
import { SECTION_ORDER } from "./sectionOrder";
import { PROFESSOR_MESSER_701_PLAYLIST, type ProfessorMesserPlaylistItem } from "./professorMesser701Playlist";

export type MesserVideoRef = Pick<ProfessorMesserPlaylistItem, "index" | "videoId" | "title" | "url">;

export type MesserLessonVideoGroup = {
  lessonId: string;
  videos: readonly MesserVideoRef[];
  /** First assigned playlist video, if any. */
  primaryVideoId: string | null;
};

/**
 * Manual reconciliation: playlist index (1–121) → study lessonId.
 * Index 1 = course intro (grouped with 1-0). Domain 3.1–3.4 granular videos → 3-cloud / 3-models.
 * All 4.1–4.9 playlist rows → 4-ops. All 5.x → 5-grc.
 */
export const MESSER_PLAYLIST_INDEX_TO_LESSON_ID: readonly (string | null)[] = [
  "1-0",
  "1-1",
  "1-2-cia",
  "1-2-nr",
  "1-2-aaa",
  "1-2-gap",
  "1-2-zt",
  "1-2-phys",
  "1-2-dec",
  "1-3-cm",
  "1-3-tcm",
  "1-4-pki",
  "1-4-enc",
  "1-4-kex",
  "1-4-enc-tech",
  "1-4-obf",
  "1-4-hash",
  "1-4-bc",
  "1-4-cert",
  "2-1",
  "2-2-vec",
  "2-2-ph",
  "2-2-imp",
  "2-2-wh",
  "2-2-se",
  "2-3-mem",
  "2-3-bo",
  "2-3-rc",
  "2-3-mu",
  "2-3-os",
  "2-3-sqli",
  "2-3-xss",
  "2-3-hw",
  "2-3-virt",
  "2-3-cloud",
  "2-3-sc",
  "2-3-mis",
  "2-3-mob",
  "2-3-zd",
  "2-4-mal",
  "2-4-vw",
  "2-4-sb",
  "2-4-om",
  "2-4-pa",
  "2-4-dos",
  "2-4-dnsa",
  "2-4-wl",
  "2-4-onp",
  "2-4-rep",
  "2-4-mcode",
  "2-4-appa",
  "2-4-cryptoa",
  "2-4-pw",
  "2-4-ioc",
  "2-5-seg",
  "2-5-mit",
  "2-5-harden",
  "3-cloud",
  "3-cloud",
  "3-cloud",
  "3-cloud",
  "3-models",
  "3-models",
  "3-models",
  "3-models",
  "3-models",
  "3-models",
  "3-models",
  "3-models",
  "3-models",
  "3-models",
  "3-models",
  "3-models",
  "3-models",
  "3-models",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "4-ops",
  "5-grc",
  "5-grc",
  "5-grc",
  "5-grc",
  "5-grc",
  "5-grc",
  "5-grc",
  "5-grc",
  "5-grc",
  "5-grc",
  "5-grc",
  "5-grc",
  "5-grc",
  "5-grc",
  "5-grc",
  "5-grc",
  "5-grc",
] as const;

function assertMappingLength(): void {
  if (MESSER_PLAYLIST_INDEX_TO_LESSON_ID.length !== 121) {
    throw new Error(`MESSER_PLAYLIST_INDEX_TO_LESSON_ID must have 121 entries, got ${MESSER_PLAYLIST_INDEX_TO_LESSON_ID.length}`);
  }
}
assertMappingLength();

function toRef(v: ProfessorMesserPlaylistItem): MesserVideoRef {
  return { index: v.index, videoId: v.videoId, title: v.title, url: v.url };
}

function buildGroups(): Map<string, MesserLessonVideoGroup> {
  const m = new Map<string, MesserLessonVideoGroup>();
  for (const id of SECTION_ORDER.map((s) => s.id)) {
    m.set(id, { lessonId: id, videos: [], primaryVideoId: null });
  }
  for (const v of PROFESSOR_MESSER_701_PLAYLIST) {
    const lid = MESSER_PLAYLIST_INDEX_TO_LESSON_ID[v.index - 1];
    if (!lid) continue;
    const g = m.get(lid);
    if (!g) continue;
    const next = [...g.videos, toRef(v)];
    m.set(lid, {
      lessonId: lid,
      videos: next,
      primaryVideoId: g.primaryVideoId ?? v.videoId,
    });
  }
  return m;
}

const GROUPS = buildGroups();

export function getMesserLessonVideoGroup(lessonId: string): MesserLessonVideoGroup {
  return GROUPS.get(lessonId) ?? { lessonId, videos: [], primaryVideoId: null };
}

export function getMesserVideosForLesson(lessonId: string): readonly MesserVideoRef[] {
  return getMesserLessonVideoGroup(lessonId).videos;
}

export function getPrimaryMesserVideoIdForLesson(lessonId: string): string | null {
  return getMesserLessonVideoGroup(lessonId).primaryVideoId;
}

export function findLessonIdByMesserVideoId(videoId: string): string | null {
  for (const [lid, g] of GROUPS) {
    if (g.videos.some((x) => x.videoId === videoId)) return lid;
  }
  return null;
}

/** Single primary id per lesson for legacy single-embed fields (KNOWN_YT / videoMap). */
export const MESSER_PRIMARY_VIDEO_ID_BY_LESSON: Readonly<Partial<Record<string, string>>> = Object.fromEntries(
  [...GROUPS.entries()]
    .filter(([, g]) => g.primaryVideoId)
    .map(([k, g]) => [k, g.primaryVideoId!]),
);

export type MesserRoadmapVideoStatus =
  | { kind: "videos"; count: number; primaryId: string }
  | { kind: "needs_verification"; count: 0 }
  | { kind: "pdf_only"; count: 0 };

export function getMesserRoadmapVideoStatus(lessonId: string): MesserRoadmapVideoStatus {
  const g = getMesserLessonVideoGroup(lessonId);
  if (g.videos.length === 0) {
    if (["2-0", "3-0", "3-iot", "4-0", "5-0"].includes(lessonId)) return { kind: "needs_verification", count: 0 };
    return { kind: "pdf_only", count: 0 };
  }
  return { kind: "videos", count: g.videos.length, primaryId: g.primaryVideoId! };
}

export function formatMesserRoadmapVideoLine(lessonId: string): string {
  const s = getMesserRoadmapVideoStatus(lessonId);
  if (s.kind === "videos") return `${s.count} Messer playlist video${s.count === 1 ? "" : "s"}`;
  if (s.kind === "needs_verification") return "No exact playlist row yet — PDF + quizzes still work";
  return "PDF study path (add playlist match later)";
}
