import { useState } from "react";
import { Button } from "~/components/ui/button";
import type { Game } from "~/lib/api";
import { MenuDialog } from "./menu-dialog";

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
    <MenuDialog labelledBy="waiting">
      <h1 id="waiting" className="text-2xl font-semibold tracking-tight">
        Waiting for your opponent
        <span aria-hidden className="animate-pulse">
          …
        </span>
      </h1>
      <p className="text-sm text-muted-foreground">
        Share this code with a friend. They enter it on the start page to join.
        You will play as {game.colour}. The code is valid for 24 hours.
      </p>
      <input
        readOnly
        value={game.code}
        aria-label="Invite code"
        onFocus={(e) => e.currentTarget.select()}
        className="h-12 w-full rounded-lg border bg-background px-3 text-center font-mono text-base tracking-widest"
      />
      <Button
        type="button"
        size="lg"
        className="h-12 w-full"
        onClick={() => void copy()}
      >
        {copied ? "Copied" : "Copy code"}
      </Button>
    </MenuDialog>
  );
}
