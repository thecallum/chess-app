import { useState } from "react";
import { Link } from "react-router";
import { Button, buttonVariants } from "~/components/ui/button";
import type { Colour } from "~/lib/api";
import { outcomeText, resultText } from "./game-status-bar";
import { MenuDialog } from "./menu-dialog";

// Shown over the whole page when the game ends, centred on screen. On a phone
// the card is full width; from sm it's a small card. "View board" hides it to
// see the final position.
export function GameOverMenu({
  result,
  winner,
  colour,
}: {
  result: string | null;
  winner: Colour | null;
  colour: Colour;
}) {
  const [closed, setClosed] = useState(false);
  if (closed) return null;

  return (
    <MenuDialog labelledBy="game-over">
      <h2 id="game-over" className="text-2xl font-semibold tracking-tight">
        Game over
      </h2>
      <p className="text-lg">{outcomeText(winner, colour)}</p>
      {result && (
        <p className="text-sm text-muted-foreground">By {resultText(result)}</p>
      )}
      <Link
        to="/play/setup"
        className={buttonVariants({ size: "lg", className: "h-12 w-full" })}
      >
        New game
      </Link>
      <Button
        variant="outline"
        size="lg"
        className="h-12 w-full"
        onClick={() => setClosed(true)}
      >
        View board
      </Button>
    </MenuDialog>
  );
}
