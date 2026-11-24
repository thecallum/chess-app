import { useState } from "react";
import { CreateGameForm } from "./create-game-form";
import { JoinGameForm } from "./join-game-form";

export function FriendSetup({ onBack }: { onBack: () => void }) {
  const [busy, setBusy] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="-mx-2 w-fit px-2 py-2 text-sm text-muted-foreground hover:underline"
      >
        ← Back
      </button>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Play a friend
      </h1>

      <CreateGameForm busy={busy} onBusyChange={setBusy} />
      <JoinGameForm busy={busy} onBusyChange={setBusy} />
    </>
  );
}
