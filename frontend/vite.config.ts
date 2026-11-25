import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, type Plugin } from "vite";

// `vite preview` falls back to index.html, which here is the pre-rendered
// homepage. Serve the real SPA fallback shell for any path that wasn't
// pre-rendered, matching nginx in production.
function spaFallbackForPreview(): Plugin {
  return {
    name: "spa-fallback-for-preview",
    configurePreviewServer(server) {
      const root = join(server.config.root, "build/client");
      server.middlewares.use((req, _res, next) => {
        const path = (req.url ?? "/").split("?")[0];
        const isPage = !/\.[a-z0-9]+$/i.test(path) && !path.startsWith("/api/");
        const prerendered = existsSync(join(root, path, "index.html"));
        if (req.method === "GET" && isPage && !prerendered) {
          req.url = "/__spa-fallback.html";
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), spaFallbackForPreview()],
  resolve: {
    tsconfigPaths: true,
  },
  // Unique port so another project's cached files or service worker on the
  // default 4173 can't be served by mistake.
  preview: {
    port: Number(process.env.PORT ?? 5002),
    strictPort: true,
  },
  server: {
    port: Number(process.env.PORT ?? 5001),
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
