import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { createGameRequest } from "../requests/create-game-request";
import type { ColourChoice } from "~/lib/api";
import { colours } from "../modes";

export function CreateGameForm() {
  const navigate = useNavigate();
  const [colour, setColour] = useState<ColourChoice>("random");
  const [error, setError] = useState<string>();

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    try {
      const game = await createGameRequest(colour);
      void navigate(`/play/games/${game.gameId}`);
    } catch {
      setError("Couldn't create the game. Please try again.");
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
