import type { Colour, GameStatus } from "~/lib/api";
import {
  gameCompletedMessage,
  gameInProgressMessage,
  headingText,
} from "../lib/game-text";

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
          ? gameCompletedMessage(winner, colour, result)
          : gameInProgressMessage(colour, inCheck)}
      </p>
    </header>
  );
}
