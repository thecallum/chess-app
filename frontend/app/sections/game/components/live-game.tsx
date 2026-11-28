import type { Game } from "~/lib/api";
import { ChessBoard } from "./chess-board";
import { ConnectionMenu } from "./connection-menu";
import { GameOverMenu } from "./game-over-menu";
import { GameStatusBar } from "./game-status-bar";
import { GameTimer } from "./game-timer";
import { WaitingForOpponent } from "./waiting-for-opponent";
import { useLiveGame } from "../hooks/use-live-game";

// The game being played, driven by useLiveGame.
export function LiveGame({ game }: { game: Game }) {
  const { colour } = game;

  const {
    state,
    optimisticState,
    connectionStatus,
    turn,
    inCheck,
    canMove,
    play,
  } = useLiveGame(game);

  return (
    <>
      {/* The status from the page load until the hub sends its own, so the
          invite panel shows straight away and goes when the opponent joins. */}
      {(optimisticState?.status ?? game.status) === "waiting" && (
        <WaitingForOpponent game={game} />
      )}
      <div className="mx-auto grid w-full max-w-[calc(100dvh-14.5rem)] grid-rows-[5rem_3rem_auto] gap-2 sm:max-w-[calc(100dvh-16rem)]">
        {/* While waiting, the invite panel above is the page heading. */}
        {optimisticState && optimisticState.status !== "waiting" ? (
          <GameStatusBar
            status={optimisticState.status}
            turn={turn}
            colour={colour}
            inCheck={inCheck}
            result={optimisticState.result}
            winner={optimisticState.winner}
          />
        ) : (
          <div />
        )}
        <GameTimer state={state} colour={colour} />
        <div className="relative aspect-square w-full">
          {optimisticState ? (
            <ChessBoard
              title={`You are playing ${colour}`}
              gameState={optimisticState.gameState}
              orientation={colour}
              boardIsActiveForPlayer={canMove}
              onMove={play}
            />
          ) : (
            // Keeps the board's space while the position loads.
            <div className="size-full rounded-xl bg-muted" />
          )}
        </div>
      </div>
      {/* Fixed over the whole page, so it doesn't need to sit inside the board. */}
      {optimisticState?.status === "completed" && (
        <GameOverMenu
          result={optimisticState.result}
          winner={optimisticState.winner}
          colour={colour}
        />
      )}
      {(connectionStatus === "reconnecting" ||
        connectionStatus === "disconnected") && (
        <ConnectionMenu status={connectionStatus} />
      )}
    </>
  );
}
