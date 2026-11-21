import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { GameBoard } from "~/components/game-board";
import { Button } from "~/components/ui/button";
import { getGame, type Game } from "~/lib/api";

// Client-only route: not in the prerender list.
export function meta() {
  return [{ title: "Game | Chess" }];
}

type Load =
  { state: "loading" } | { state: "error" } | { state: "ready"; game: Game };

export default function PlayGame() {
  const { gameId } = useParams();
  const [load, setLoad] = useState<Load>({ state: "loading" });

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

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-16">
      <Link
        to="/play/setup"
        className="-mx-2 w-fit px-2 py-2 text-sm text-muted-foreground hover:underline"
      >
        ← New game
      </Link>

      {load.state === "loading" && (
        <p className="text-muted-foreground">Loading game…</p>
      )}
      {load.state === "error" && (
        <section className="rounded-xl border p-4 sm:p-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Game not found
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This game does not exist, or you are not one of its players.
          </p>
        </section>
      )}
      {load.state === "ready" && <GameView game={load.game} />}
      {load.state === "ready" && (
        <GameBoard gameId={load.game.gameId} colour={load.game.colour} />
      )}
    </main>
  );
}

function GameView({ game }: { game: Game }) {
  if (game.status === "in_progress") {
    return (
      <section
        aria-labelledby="started"
        className="rounded-xl border p-4 sm:p-6"
      >
        <h1
          id="started"
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {game.role === "host"
            ? "Your opponent joined"
            : "You joined the game"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You are playing {game.colour}.
        </p>
      </section>
    );
  }
  return <WaitingForOpponent game={game} />;
}

function WaitingForOpponent({ game }: { game: Game }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(game.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable: the code is still shown for manual copying.
    }
  }

  return (
    <section
      aria-labelledby="waiting"
      className="flex flex-col gap-3 rounded-xl border p-4 sm:p-6"
    >
      <h1
        id="waiting"
        className="text-2xl font-semibold tracking-tight sm:text-3xl"
      >
        Waiting for your opponent
        <span aria-hidden className="animate-pulse">
          …
        </span>
      </h1>
      <p className="text-sm text-muted-foreground">
        Share this code with a friend. They enter it on the start page to join.
        You will play as {game.colour}. The code is valid for 24 hours.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={game.code}
          aria-label="Invite code"
          onFocus={(e) => e.currentTarget.select()}
          className="h-12 min-w-0 flex-1 rounded-lg border bg-background px-3 font-mono text-base tracking-widest sm:h-9 sm:text-sm"
        />
        <Button
          type="button"
          onClick={() => void copy()}
          className="h-12 text-base sm:h-9 sm:text-sm"
        >
          {copied ? "Copied" : "Copy code"}
        </Button>
      </div>
    </section>
  );
}
