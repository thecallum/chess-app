import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { describeJoinError } from "../describe-join-error";
import { joinGameRequest } from "../requests/join-game-request";

export function JoinGameForm() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();

  async function join(e: React.FormEvent) {
    e.preventDefault();
    const value = code.trim();
    if (!value) {
      setError("Enter an invite code.");
      return;
    }
    try {
      const game = await joinGameRequest(value);
      void navigate(`/play/games/${game.gameId}`);
    } catch (joinError) {
      setError(describeJoinError(joinError));
    }
  }

  return (
    <section aria-labelledby="join" className="flex flex-col gap-3 border-t pt-6">
      <h2
        id="join"
        className="text-sm font-medium text-muted-foreground uppercase"
      >
        Join with a code
      </h2>
      <form
        onSubmit={(e) => void join(e)}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(undefined);
          }}
          placeholder="Enter an invite code"
          aria-label="Invite code"
          aria-invalid={error ? true : undefined}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="h-12 min-w-0 flex-1 rounded-lg border bg-background px-3 font-mono uppercase text-base sm:h-9 sm:text-sm"
        />
        <Button
          type="submit"
          variant="outline"
          className="h-12 text-base sm:h-9 sm:text-sm"
        >
          Join game
        </Button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
