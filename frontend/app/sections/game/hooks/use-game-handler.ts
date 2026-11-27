import { Chess } from "chess.js";
import { startTransition, useOptimistic } from "react";
import type { Colour, Game } from "~/lib/api";
import type { MoveIntent } from "../components/chess-board";
import { useGameSession } from "./use-game-session";

const applyMove = (gameState: string, intent: MoveIntent) => {
  const game = new Chess(gameState);
  game.move(intent);
  return game.fen();
};

export function useGameHandler(game: Game) {
  const { state, connectionStatus, move } = useGameSession(game.gameId);

  const [optimisticState, showMove] = useOptimistic(
    state,
    (current, gameState: string) => current && { ...current, gameState },
  );

  const position = new Chess(optimisticState?.gameState);
  const turn: Colour = position.turn() === "w" ? "white" : "black";
  const canMove =
    turn === game.colour && optimisticState?.status === "in_progress";

  function play(intent: MoveIntent) {
    if (!state) return;

    // Wraps within an optimistic transition
    // so move shows before server replies
    startTransition(async () => {
      showMove(applyMove(state.gameState, intent));
      await move(intent);
    });
  }

  return {
    state,
    optimisticState,
    connectionStatus,
    turn,
    inCheck: position.inCheck(),
    canMove,
    play,
  };
}
