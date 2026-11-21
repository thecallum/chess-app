import type { Config } from "@react-router/dev/config";

export default {
  // No server-side rendering at runtime. The app is static files.
  ssr: false,
  // Routes listed here are rendered to static HTML at build time, then hydrated.
  // Any route not listed is client-only and is served the SPA fallback shell.
  prerender: ["/"],
} satisfies Config;
