import type { Colour } from "~/lib/api";
import type { GameStateMessage } from "./game-connection";

export function playerTimerIsRunning(
  state: GameStateMessage | undefined,
  player: Colour,
): boolean {
  // 1. No clock runs before the game state arrives or once the game is over.
  if (!state || state.status === "completed") return false;

  // 2. Neither clock runs until white has made their first move.
  if (state.currentMove === 1) return false;

  // 3. White plays the odd moves and black the even ones.
  const playerToMove: Colour = state.currentMove % 2 === 1 ? "white" : "black";
  return player === playerToMove;
}

export function timeLeftInMs(
  state: GameStateMessage | undefined,
  side: Colour,
  now: number,
  timerIsRunning: boolean,
) {
  // 1. Nothing to show before the game state arrives.
  if (!state) return 0;

  // 2. The time the server stored for this side at the last move.
  const stored =
    side === "white" ? state.whiteTimeRemainingMs : state.blackTimeRemainingMs;

  // 3. A clock that isn't running shows the stored time.
  if (!timerIsRunning || !state.lastMoveAt) return stored;

  // 4. The running clock takes off the time since the last move, stopping at zero.
  const msSinceLastMove = now - new Date(state.lastMoveAt).getTime();
  return Math.max(0, stored - msSinceLastMove);
}
