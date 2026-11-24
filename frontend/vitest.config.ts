import { defineConfig } from "vitest/config";

// Separate from vite.config.ts so tests don't load the React Router and
// Tailwind plugins, which they don't need.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
