import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:5001",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Starts the dev server for the run, or reuses one that's already running.
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5001",
    reuseExistingServer: true,
  },
});
