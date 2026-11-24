import { useEffect, useState } from "react";
import type { Game } from "~/lib/api";
import { getGame } from "./lib/game-api";

export type GameLoad =
  | { state: "loading" }
  | { state: "error" }
  | { state: "ready"; game: Game };

export function useGame(gameId: string | undefined): GameLoad {
  const [load, setLoad] = useState<GameLoad>({ state: "loading" });

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    getGame(gameId)
      .then((game) => !cancelled && setLoad({ state: "ready", game }))
      .catch(() => !cancelled && setLoad({ state: "error" }));
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  return load;
}
