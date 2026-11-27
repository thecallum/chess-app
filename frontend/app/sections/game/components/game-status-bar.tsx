import type { Colour, GameStatus } from "~/lib/api";

// The page heading: whose move it is, or how the game ended.
export function GameStatusBar({
  status,
  turn,
  colour,
  inCheck,
  result,
  winner,
}: {
  status: GameStatus;
  turn: Colour;
  colour: Colour; // This player's colour.
  inCheck: boolean; // The side to move is in check.
  result: string | null;
  winner: Colour | null;
}) {
  return (
    <header className="flex flex-col justify-center gap-1 text-center">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {headingText(status, turn === colour)}
      </h1>
      <p className="text-sm text-muted-foreground">
        {status === "completed"
          ? [outcomeText(winner, colour), result && resultText(result)]
              .filter(Boolean)
              .join(" · ")
          : `You are playing ${colour}${status === "in_progress" && inCheck ? " · Check" : ""}`}
      </p>
    </header>
  );
}

function headingText(status: string, myTurn: boolean) {
  if (status === "waiting") return "Waiting for your opponent";
  if (status === "completed") return "Game over";
  return myTurn ? "Your move" : "Opponent's move";
}

// "Black wins (you)", "White wins" or "Draw".
export function outcomeText(winner: Colour | null, colour: Colour) {
  if (!winner) return "Draw";
  return `${capitalise(winner)} wins${winner === colour ? " (you)" : ""}`;
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

function capitalise(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
