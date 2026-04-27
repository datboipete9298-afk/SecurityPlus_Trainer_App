#!/usr/bin/env node
/**
 * Entry shim (requested .mjs) — delegates to TypeScript validator.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const r = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["tsx", join(root, "validate-ai-system.ts")], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(r.status ?? 1);
