import { configDefaults, defineConfig } from "vitest/config";

// Separate from vite.config.ts so tests don't load the React Router and
// Tailwind plugins, which they don't need.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    // Playwright specs run with `pnpm test:e2e`.
    exclude: [...configDefaults.exclude, "e2e/**"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
