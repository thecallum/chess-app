import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  // Unique port so another project's cached files or service worker on the
  // default 4173 can't be served by mistake.
  preview: {
    port: 5002,
    strictPort: true,
  },
  server: {
    port: 5001,
    strictPort: true,
    proxy: {
      // Keeps the API same-origin in development, so cookies work.
      "/api": {
        target: process.env.API_URL ?? "http://localhost:5080",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
