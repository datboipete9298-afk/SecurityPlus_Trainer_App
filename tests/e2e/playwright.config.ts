import { defineConfig, devices } from "@playwright/test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * Companion config for `tests/e2e/smoke.spec.ts`.
 *
 * Mobile coverage uses Chromium with iPhone-style viewport / userAgent
 * emulation — same useful CSS / tap-target coverage without pulling WebKit
 * binaries (~70 MB).
 *
 * Starts `vite preview` when dist exists so `npm run test:e2e` does not require
 * a manually launched server (reuse if you already ran preview).
 */
export default defineConfig({
  testDir: ".",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
    headless: true,
    baseURL: process.env.SPT_E2E_BASE ?? "http://localhost:4173",
  },
  webServer:
    process.env.SPT_E2E_BASE && !/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(process.env.SPT_E2E_BASE.trim())
      ? undefined
      : {
          command: "npx vite preview --port 4173 --strictPort",
          cwd: repoRoot,
          url: "http://localhost:4173",
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-iphone-14",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      },
    },
  ],
});
