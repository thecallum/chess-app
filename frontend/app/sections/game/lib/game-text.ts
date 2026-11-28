import type { Colour, GameStatus } from "~/lib/api";

export function headingText(status: GameStatus, isMyTurn: boolean) {
  if (status === "waiting") return "Waiting for your opponent";
  if (status === "completed") return "Game over";
  return isMyTurn ? "Your move" : "Opponent's move";
}

export function outcomeText(winner: Colour | null, colour: Colour) {
  // 1. No winner means a draw.
  if (!winner) return "Draw";

  // 2. Name the winner, and add "(you)" if it's this player.
  const name = winner === "white" ? "White" : "Black";
  return winner === colour ? `${name} wins (you)` : `${name} wins`;
}

// The server sends the result's name, like "FiftyMoveRule".
export function resultText(result: string) {
  const labels: Record<string, string> = {
    Checkmate: "checkmate",
    Stalemate: "stalemate",
    InsufficientMaterial: "insufficient material",
    FiftyMoveRule: "fifty-move rule",
    Repetition: "repetition",
    Timeout: "timeout",
  };
  return labels[result] ?? result;
}

export function gameCompletedMessage(
  winner: Colour | null,
  colour: Colour,
  result: string | null,
) {
  // 1. Without a result, just show the outcome.
  if (!result) return outcomeText(winner, colour);

  // 2. Otherwise add how it ended, e.g. "White wins (you) · checkmate".
  return `${outcomeText(winner, colour)} · ${resultText(result)}`;
}

export function gameInProgressMessage(colour: Colour, inCheck: boolean) {
  return inCheck
    ? `You are playing ${colour} · Check`
    : `You are playing ${colour}`;
}
