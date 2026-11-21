import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Pre-rendered to static HTML (see react-router.config.ts).
  index("routes/home.tsx"),
  // Client-only.
  route("play/setup", "routes/play.setup.tsx"),
  // Dev page comparing board styles.
  route("dev/boards", "routes/dev.boards.tsx"),
] satisfies RouteConfig;
