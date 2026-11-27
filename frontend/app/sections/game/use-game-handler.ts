import { Chess } from "chess.js";
import { useEffect, useState } from "react";
import type { Game } from "~/lib/api";
import type { MoveIntent } from "./components/chess-board";
import { useGameSession } from "./use-game-session";

type Colour = Game["colour"];

export function useGameHandler(game: Game) {
  const { state, move } = useGameSession(game.gameId);
  const [now, setNow] = useState(() => Date.now());

  const position = new Chess(state?.gameState);
  const turn: Colour = position.turn() === "w" ? "white" : "black";
  const canMove = turn === game.colour && state?.status === "in_progress";

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

  function play(intent: MoveIntent) {
    void move(intent);
  }

  return {
    state,
    turn,
    inCheck: position.inCheck(),
    canMove,
    running,
    timeLeft,
    play,
  };
}
