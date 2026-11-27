import { useState } from "react";
import { Link } from "react-router";
import { Button, buttonVariants } from "~/components/ui/button";
import { outcomeText, resultText } from "./game-status";

// Shown over the whole page when the game ends, centred on screen. On a phone
// the card is full width; from sm it's a small card. "View board" hides it to
// see the final position.
export function GameOverMenu({
  result,
  winner,
  colour,
}: {
  result: string | null;
  winner: "white" | "black" | null;
  colour: "white" | "black";
}) {
  const [closed, setClosed] = useState(false);
  if (closed) return null;

  return (
    // z-[60] puts it above the sticky site header (z-50).
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-over"
        className="flex w-full flex-col gap-3 rounded-xl border bg-background p-6 text-center shadow-lg sm:max-w-sm"
      >
        <h2 id="game-over" className="text-2xl font-semibold tracking-tight">
          Game over
        </h2>
        <p className="text-lg">{outcomeText(winner, colour)}</p>
        {result && (
          <p className="text-sm text-muted-foreground">
            By {resultText(result)}
          </p>
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
      </section>
    </div>
  );
}
