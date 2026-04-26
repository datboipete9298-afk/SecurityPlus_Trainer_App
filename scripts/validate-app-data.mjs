/**
 * Wrapper so `node scripts/validate-app-data.mjs` works per README/tooling.
 * Primary script remains TypeScript: `npm run validate:data` → tsx.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const r = spawnSync(process.execPath, [path.join(root, "node_modules", "tsx", "dist", "cli.mjs"), "scripts/validate-app-data.ts"], {
  cwd: root,
  stdio: "inherit",
});
process.exit(r.status === null ? 1 : r.status);
