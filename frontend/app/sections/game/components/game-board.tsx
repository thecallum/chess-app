import type { Game } from "~/lib/api";
import { ChessBoard } from "./chess-board";
import { EventLogList } from "./event-log-list";
import { PlayerClock } from "./game-clocks";
import { GameOverMenu } from "./game-over-menu";
import { GameStatus } from "./game-status";
import { WaitingForOpponent } from "./waiting-for-opponent";
import { useGameHandler } from "../use-game-handler";

// One board for this player. Everything shown comes from the game session.
export function GameBoard({ game }: { game: Game }) {
  const { colour } = game;

  const { state, turn, inCheck, canMove, running, timeLeft, play } =
    useGameHandler(game);

  // Before GameState arrives, an empty bar of the same height keeps the layout still.
  const clockFor = (side: "white" | "black") =>
    state ? (
      <PlayerClock
        label={`${side === "white" ? "White" : "Black"} (${side === colour ? "you" : "opponent"})`}
        ms={timeLeft(side)}
        running={running === side}
      />
    ) : (
      <div className="h-12" />
    );

  return (
    <>
      {/* The status from the page load until the hub sends its own, so the
          invite panel shows straight away and goes when the opponent joins. */}
      {(state?.status ?? game.status) === "waiting" && (
        <WaitingForOpponent game={game} />
      )}
      <div className="mx-auto grid w-full max-w-[calc(100dvh-14.5rem)] grid-rows-[5rem_3rem_auto] gap-2 sm:max-w-[calc(100dvh-16rem)]">
        {/* While waiting, the invite panel above is the page heading. */}
        {state && state.status !== "waiting" ? (
          <GameStatus
            status={state.status}
            turn={turn}
            colour={colour}
            inCheck={inCheck}
            result={state.result}
            winner={state.winner}
          />
        ) : (
          <div />
        )}
        <div className="grid grid-cols-2 gap-2">
          {clockFor("white")}
          {clockFor("black")}
        </div>
        <div className="relative aspect-square w-full">
          {state ? (
            <ChessBoard
              title={`You are playing ${colour}`}
              fen={state.gameState}
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
      {state?.status === "completed" && (
        <GameOverMenu
          result={state.result}
          winner={state.winner}
          colour={colour}
        />
      )}
      {/* <EventLogList entries={eventLogs} /> */}
    </>
  );
}
