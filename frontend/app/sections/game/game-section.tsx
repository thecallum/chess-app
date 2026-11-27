import { useParams } from "react-router";
import { GameBoard } from "./components/game-board";
import { GameNotFound } from "./components/game-not-found";
import { useGame } from "./use-game";

// The game page's content: loads the game named in the URL and shows it.
export function GameSection() {
  const { gameId } = useParams();
  const { data: game, isPending, isError } = useGame(gameId);

  if (isPending) {
    return <p className="text-muted-foreground">Loading game…</p>;
  }
  if (isError) return <GameNotFound />;

  return <GameBoard game={game} />;
}
