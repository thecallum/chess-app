import { useState } from "react";
import { Link } from "react-router";
import { CreateGameForm } from "~/sections/setup/components/create-game-form";
import { JoinGameForm } from "~/sections/setup/components/join-game-form";
import { SetupCard } from "~/sections/setup/components/setup-card";

// Client-only route: not in the prerender list.
export function meta() {
  return [{ title: "Play a friend | Chess" }];
}

export default function PlayWithFriends() {
  // Shared so only one request runs at a time.
  const [busy, setBusy] = useState(false);

  return (
    <SetupCard>
      <Link
        to="/play/setup"
        className="-mx-2 w-fit px-2 py-2 text-sm text-muted-foreground hover:underline"
      >
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Play a friend
      </h1>
      <CreateGameForm busy={busy} onBusyChange={setBusy} />
      <JoinGameForm busy={busy} onBusyChange={setBusy} />
    </SetupCard>
  );
}
