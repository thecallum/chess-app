import { useParams } from "react-router";
import { GameBoard } from "./components/game-board";
import { GameNotFound } from "./components/game-not-found";
import { GameInProgress } from "./components/game-in-progress";
import { WaitingForOpponent } from "./components/waiting-for-opponent";
import { useGame } from "./use-game";

// The game page's content: loads the game named in the URL and shows it.
export function GameSection() {
  const { gameId } = useParams();
  const load = useGame(gameId);

  if (load.state === "loading") {
    return <p className="text-muted-foreground">Loading game…</p>;
  }
  if (load.state === "error") return <GameNotFound />;

  return (
    <>
      {load.game.status === "waiting" ? (
        <WaitingForOpponent game={load.game} />
      ) : (
        <GameInProgress game={load.game} />
      )}
      <GameBoard gameId={load.game.gameId} colour={load.game.colour} />
    </>
  );
}
