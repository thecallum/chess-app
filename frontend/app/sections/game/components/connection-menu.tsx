import { Button } from "~/components/ui/button";
import type { ConnectionStatus } from "../hooks/use-game-session";
import { MenuDialog } from "./menu-dialog";

export function ConnectionMenu({
  status,
}: {
  status: Extract<ConnectionStatus, "reconnecting" | "disconnected">;
}) {
  return (
    <MenuDialog labelledBy="connection">
      {status === "reconnecting" ? (
        <>
          <h2 id="connection" className="text-2xl font-semibold tracking-tight">
            Reconnecting
            <span aria-hidden className="animate-pulse">
              …
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Lost connection to the game. Trying again.
          </p>
        </>
      ) : (
        <>
          <h2 id="connection" className="text-2xl font-semibold tracking-tight">
            Disconnected
          </h2>
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t reach the game.
          </p>
          <Button
            size="lg"
            className="h-12 w-full"
            onClick={() => window.location.reload()}
          >
            Reload
          </Button>
        </>
      )}
    </MenuDialog>
  );
}
