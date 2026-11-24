import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { createGame } from "../lib/setup-api";
import { colours, type Colour } from "../modes";

// `busy` is shared with the join form, so only one request runs at a time.
export function CreateGameForm({
  busy,
  onBusyChange,
}: {
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const navigate = useNavigate();
  const [colour, setColour] = useState<Colour>("random");
  const [error, setError] = useState<string>();

  async function create(e: React.FormEvent) {
    e.preventDefault();
    onBusyChange(true);
    setError(undefined);
    try {
      const game = await createGame(colour);
      void navigate(`/play/games/${game.gameId}`);
    } catch {
      setError("Couldn't create the game. Please try again.");
      onBusyChange(false);
    }
  }

  return (
    <form onSubmit={(e) => void create(e)} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-medium text-muted-foreground uppercase">
          Your colour
        </legend>
        <div className="grid grid-cols-3 gap-3">
          {colours.map((option) => (
            <label
              key={option.id}
              className="flex h-12 cursor-pointer items-center justify-center rounded-xl border font-medium has-checked:border-accent-1 has-checked:bg-accent-1/15 has-checked:ring-1 has-checked:ring-accent-1 has-focus-visible:ring-3 has-focus-visible:ring-accent-1/50"
            >
              <input
                type="radio"
                name="colour"
                value={option.id}
                checked={colour === option.id}
                onChange={() => setColour(option.id)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-muted-foreground uppercase">
          Time control
        </span>
        <span>10 minutes each</span>
      </div>

      <Button
        type="submit"
        disabled={busy}
        className="h-12 w-full text-base font-semibold sm:h-11 sm:w-auto sm:self-start sm:px-6"
      >
        Create game
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
