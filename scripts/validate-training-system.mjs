#!/usr/bin/env node
/**
 * Entry point: `node scripts/validate-training-system.mjs` (uses npx tsx).
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const r = spawnSync("npx", ["tsx", "scripts/validate-training-system.ts"], {
  stdio: "inherit",
  cwd: root,
  shell: true,
});
process.exit(r.status === null ? 1 : r.status);
