import type { Game } from "~/lib/api";

export function GameInProgress({ game }: { game: Game }) {
  return (
    <section aria-labelledby="started" className="rounded-xl border p-4 sm:p-6">
      <h1
        id="started"
        className="text-2xl font-semibold tracking-tight sm:text-3xl"
      >
        {game.role === "host" ? "Your opponent joined" : "You joined the game"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You are playing {game.colour}.
      </p>
    </section>
  );
}
