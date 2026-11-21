import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { LinkedBoards } from "~/components/linked-boards";
import { Button } from "~/components/ui/button";

// Client-only route: not in the prerender list.
export function meta() {
  return [{ title: "Game | Chess" }];
}

export default function PlayGame() {
  const { gameId } = useParams();
  // Placeholder: the server will own the role and colour. For now they arrive
  // from the setup page through navigation state. Anyone without a "host" role
  // (joined by code, or refreshed) is treated as a guest.
  const state = useLocation().state as {
    role?: "host" | "guest";
    colour?: string;
  } | null;
  const isHost = state?.role === "host";
  const colour = state?.colour;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(gameId ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable: the code is still shown for manual copying.
    }
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-16">
      <Link
        to="/play/setup"
        className="-mx-2 w-fit px-2 py-2 text-sm text-muted-foreground hover:underline"
      >
        ← New game
      </Link>

      {isHost ? (
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
            Share this code with a friend. They enter it on the start page to
            join. You will play as {colour ?? "a colour chosen by the server"}.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={gameId}
              aria-label="Invite code"
              onFocus={(e) => e.currentTarget.select()}
              className="h-12 min-w-0 flex-1 rounded-lg border bg-background px-3 font-mono text-base sm:h-9 sm:text-sm"
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
      ) : (
        <section
          aria-labelledby="joined"
          className="rounded-xl border p-4 sm:p-6"
        >
          <h1
            id="joined"
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            You joined the game
          </h1>
        </section>
      )}

      <LinkedBoards />
    </main>
  );
}
