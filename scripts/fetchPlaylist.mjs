/**
 * Fetches official SY0-701 playlist and prints ordered videoId \t title (for videoMap).
 * Run: node scripts/fetchPlaylist.mjs
 */
import https from "https";

const LIST = "https://www.youtube.com/playlist?list=PLG49S3nxzAnl4QDVqK-hOnoqcSKEIDDuv";

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; SecurityPlusTrainer/1.0)" } }, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve(d));
      })
      .on("error", reject);
  });
}

const html = await get(LIST);
const needle = "ytInitialData = ";
const idx = html.indexOf(needle);
if (idx < 0) {
  console.error("Could not find ytInitialData");
  process.exit(1);
}
let start = idx + needle.length;
while (html[start] === " " || html[start] === "=") start++;
let depth = 0;
let inString = false;
let esc = false;
let jsonStr = "";
if (html[start] !== "{") {
  console.error("Expected { after ytInitialData");
  process.exit(1);
}
for (let j = start; j < html.length; j++) {
  const c = html[j];
  if (inString) {
    jsonStr += c;
    if (esc) esc = false;
    else if (c === "\\") esc = true;
    else if (c === '"') inString = false;
    continue;
  }
  if (c === '"') {
    inString = true;
    jsonStr += c;
    continue;
  }
  if (c === "{") depth++;
  if (c === "}") {
    depth--;
    jsonStr += c;
    if (depth === 0) break;
    continue;
  }
  jsonStr += c;
}
let data;
try {
  data = JSON.parse(jsonStr);
} catch (e) {
  console.error("JSON parse fail", e);
  process.exit(1);
}

function walk(obj, out) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    for (const x of obj) walk(x, out);
    return;
  }
  if (obj.playlistVideoRenderer) {
    const v = obj.playlistVideoRenderer;
    const id = v.videoId;
    const title =
      v.title?.runs?.map((r) => r.text).join("") || v.title?.simpleText || "";
    if (id) out.push({ id, title: title.replace(/\s+/g, " ").trim() });
    return;
  }
  for (const k of Object.keys(obj)) walk(obj[k], out);
}

const videos = [];
walk(data, videos);
for (const { id, title } of videos) {
  console.log(`${id}\t${title}`);
}
console.error(`# count: ${videos.length}`);
