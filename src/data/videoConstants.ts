/** Official Professor Messer SY0-701 — public index + playlist (embed only, no downloads). */
export const PROFESSOR_MESSER_COURSE_INDEX =
  "https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/";

export const PROFESSOR_MESSER_YOUTUBE_PLAYLIST =
  "https://www.youtube.com/playlist?list=PLG49S3nxzAnl4QDVqK-hOnoqcSKEIDDuv";

export const messerVideoPage = (slug: string) =>
  `https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/${slug.replace(/^\//, "")}`;

export const youtubeWatch = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;
export const youtubeEmbed = (videoId: string) => `https://www.youtube.com/embed/${videoId}`;
