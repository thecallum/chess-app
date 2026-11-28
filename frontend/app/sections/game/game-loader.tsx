import { useParams } from "react-router";
import { LiveGame } from "./components/live-game";
import { GameNotFound } from "./components/game-not-found";
import { useGameQuery } from "./hooks/use-game-query";

// The game page's content: loads the game named in the URL and shows it.
export function GameLoader() {
  const { gameId } = useParams();
  const { data: game, isPending, isError } = useGameQuery(gameId);

  if (isPending) {
    return <p className="text-muted-foreground">Loading game…</p>;
  }
  if (isError) return <GameNotFound />;

  return <LiveGame game={game} />;
}
