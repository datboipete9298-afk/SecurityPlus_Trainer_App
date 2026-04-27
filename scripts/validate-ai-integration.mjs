#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = dirname(fileURLToPath(import.meta.url));
const appRoot = join(root, "..");

function fail(msg) {
  console.error("validate-ai-integration:", msg);
  process.exit(1);
}

function mustExist(rel) {
  const p = join(appRoot, rel);
  if (!existsSync(p)) fail(`Missing required file: ${rel}`);
}

const required = [
  "server/index.ts",
  "server/openaiClient.ts",
  "server/prompts.ts",
  "server/rateLimit.ts",
  "server/safety.ts",
  "server/aiCore.ts",
  "server/pdfGuideAiGuards.ts",
  "src/components/AITutorPanel.tsx",
  "src/lib/aiClient.ts",
  "src/lib/aiTutorFallback.ts",
  "src/types/aiTutor.ts",
  "api/ai/_shared.ts",
  "api/ai/tutor.ts",
  "api/ai/explain.ts",
  "api/ai/note-feedback.ts",
  "api/ai/quiz-help.ts",
  "api/ai/lab-coach.ts",
  ".env.example",
  "README_AI_SETUP.md",
  "scripts/validate-ai-integration.mjs",
];

for (const r of required) mustExist(r);

const pkg = JSON.parse(readFileSync(join(appRoot, "package.json"), "utf8"));
for (const s of ["dev:server", "dev:all", "validate:ai-integration"]) {
  if (!pkg.scripts?.[s]) fail(`package.json missing script: ${s}`);
}
for (const dep of ["openai", "express", "cors", "dotenv"]) {
  if (!pkg.dependencies?.[dep]) fail(`package.json missing dependency: ${dep}`);
}

function walkSrcForKey(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) walkSrcForKey(p);
    else if (/\.(tsx?|jsx?|css)$/.test(name.name)) {
      const t = readFileSync(p, "utf8");
      if (t.includes("OPENAI_API_KEY") && !p.includes("aiTutorFallback") && !p.includes("README")) {
        fail(`Frontend or shared src must not reference OPENAI_API_KEY string: ${p.replace(appRoot + "\\", "")}`);
      }
    }
  }
}
walkSrcForKey(join(appRoot, "src"));

const envExample = readFileSync(join(appRoot, ".env.example"), "utf8");
if (!envExample.includes("OPENAI_API_KEY=")) fail(".env.example must document OPENAI_API_KEY");

// Optional: ensure no sk- in tracked env (best-effort)
if (existsSync(join(appRoot, ".env"))) {
  const env = readFileSync(join(appRoot, ".env"), "utf8");
  if (/sk-[a-zA-Z0-9]{10,}/.test(env)) {
    console.warn("validate-ai-integration: warning — .env contains something that looks like a real API key. Do not commit .env.");
  }
}

try {
  execSync("npm run build", { cwd: appRoot, stdio: "inherit" });
} catch {
  fail("npm run build failed");
}

console.log("validate-ai-integration: OK");
