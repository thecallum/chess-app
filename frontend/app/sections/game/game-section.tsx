import { useState } from "react";
import { useParams } from "react-router";
import { GameBoard } from "./components/game-board";
import { GameNotFound } from "./components/game-not-found";
import { WaitingForOpponent } from "./components/waiting-for-opponent";
import { useGame } from "./use-game";

// The game page's content: loads the game named in the URL and shows it.
export function GameSection() {
  const { gameId } = useParams();
  const { data: game, isPending, isError } = useGame(gameId);
  // The status from the game hub once it's connected. It replaces the one from
  // the page load, so the invite panel goes when the opponent joins.
  const [liveStatus, setLiveStatus] = useState<string>();

  if (isPending) {
    return <p className="text-muted-foreground">Loading game…</p>;
  }
  if (isError) return <GameNotFound />;

  return (
    <>
      {(liveStatus ?? game.status) === "waiting" && (
        <WaitingForOpponent game={game} />
      )}
      <GameBoard
        gameId={game.gameId}
        colour={game.colour}
        onStatusChange={setLiveStatus}
      />
    </>
  );
}
