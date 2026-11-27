import type { Game } from "~/lib/api";
import { ChessBoard } from "./chess-board";
import { ConnectionMenu } from "./connection-menu";
import { EventLogList } from "./event-log-list";
import { GameOverMenu } from "./game-over-menu";
import { GameStatus } from "./game-status";
import { GameTimer } from "./game-timer";
import { WaitingForOpponent } from "./waiting-for-opponent";
import { useGameHandler } from "../use-game-handler";

// One board for this player. Everything shown comes from the game session.
export function GameBoard({ game }: { game: Game }) {
  const { colour } = game;

  const {
    state,
    optimisticState,
    connectionStatus,
    turn,
    inCheck,
    canMove,
    play,
  } = useGameHandler(game);

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
          <GameStatus
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
              active={canMove}
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
      {/* <EventLogList entries={eventLogs} /> */}
    </>
  );
}
