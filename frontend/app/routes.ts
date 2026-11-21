import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Pre-rendered to static HTML (see react-router.config.ts).
  index("routes/home.tsx"),
  // Client-only.
  route("play/setup", "routes/play.setup.tsx"),
  route("play/games/:gameId", "routes/play.game.tsx"),
] satisfies RouteConfig;
