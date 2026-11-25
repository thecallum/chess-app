import { useState } from "react";
import { Button } from "~/components/ui/button";
import type { Game } from "~/lib/api";

export function WaitingForOpponent({ game }: { game: Game }) {
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
