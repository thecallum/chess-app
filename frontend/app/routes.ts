import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  // Animated background shared by these pages.
  layout("routes/board-background.tsx", [
    // Pre-rendered to static HTML (see react-router.config.ts).
    index("routes/home.tsx"),
    // Client-only.
    route("play/setup", "routes/play.setup.tsx"),
    route(
      "play/setup/play-with-friends",
      "routes/play.setup.play-with-friends.tsx",
    ),
  ]),
  route("play/games/:gameId", "routes/play.game.tsx"),
] satisfies RouteConfig;
