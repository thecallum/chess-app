import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 5001,
    strictPort: true,
    proxy: {
      // Keeps the API same-origin in development, so cookies work.
      "/api": {
        target: process.env.API_URL ?? "http://localhost:5080",
        changeOrigin: true,
      },
    },
  },
});
