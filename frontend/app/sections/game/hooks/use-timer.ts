import { useEffect, useState } from "react";
import type { Colour } from "~/lib/api";
import type { GameStateMessage } from "../lib/game-connection";

export function useTimer(state: GameStateMessage | undefined) {
  const [now, setNow] = useState(() => Date.now());

  const [, sideToMove, , , , fullMove] = (state?.gameState ?? "").split(" ");
  const isFirstMove = sideToMove === "w" && fullMove === "1";
  const running: Colour | null =
    state && state.status !== "completed" && !isFirstMove
      ? sideToMove === "w"
        ? "white"
        : "black"
      : null;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, [running]);

  function timeLeft(side: Colour) {
    if (!state) return 0;
    const stored =
      side === "white"
        ? state.whiteTimeRemainingMs
        : state.blackTimeRemainingMs;
    if (side !== running || !state.lastMoveAt) return stored;
    const msUsed = now - new Date(state.lastMoveAt).getTime();
    return Math.max(0, stored - msUsed);
  }

  return {
    white: { ms: timeLeft("white"), running: running === "white" },
    black: { ms: timeLeft("black"), running: running === "black" },
  };
}
