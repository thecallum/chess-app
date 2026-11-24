import { defineConfig, devices } from "@playwright/test";

// Own port, so the specs run alongside `pnpm dev` (5001) without clashing.
const port = 5003;
const baseURL = `http://localhost:${port}`;

// By default the specs run against the Vite dev server, so frontend changes
// show up live (handy with `pnpm test:e2e:ui`). With E2E_BUILD set (see
// `pnpm test:e2e:ci`) they run against the production build instead.
const build = !!process.env.E2E_BUILD;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  use: { baseURL },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: build ? "pnpm build && pnpm preview" : "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // The e2e API (see docker-compose.e2e.yml), not the dev one.
    env: { PORT: String(port), API_URL: "http://localhost:5081" },
  },
});
