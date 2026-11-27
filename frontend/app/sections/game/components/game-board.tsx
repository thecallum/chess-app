import { Chess } from "chess.js";
import { useEffect, useRef, useState } from "react";
import { ChessBoard, type MoveIntent } from "./chess-board";
import { PlayerClock } from "./game-clocks";
import { GameOverMenu } from "./game-over-menu";
import { GameStatus } from "./game-status";
import {
  connectGameHub,
  type ClockMessage,
  type GameHub,
  type GameStateMessage,
} from "../lib/game-hub";

// One board for this player. Moves made here are sent over the game's channel,
// and moves from the opponent arrive on it. Scaffolding: the server just
// relays moves, so the position only lives in this browser.
export function GameBoard({
  gameId,
  colour,
  onStatusChange,
}: {
  gameId: string;
  colour: "white" | "black";
  // Called with the live status, so the page can hide the invite panel once
  // the opponent joins.
  onStatusChange?: (status: GameStateMessage["status"]) => void;
}) {
  // The position from the server. Undefined until GameState arrives, so the board
  // isn't drawn at the starting position first and then animated to the real one.
  const [fen, setFen] = useState<string>();
  const [log, setLog] = useState<string[]>([]);
  // The server's clocks as of the last move. Undefined until GameState arrives.
  const [clocks, setClocks] = useState<ClockMessage>();
  const [status, setStatus] = useState<GameStateMessage["status"]>();
  const [result, setResult] = useState<string | null>(null);
  const [winner, setWinner] = useState<GameStateMessage["winner"]>(null);
  // The player can close the game-over menu to look at the final position.
  const [menuClosed, setMenuClosed] = useState(false);
  // The current time, updated on each tick while a clock runs.
  const [now, setNow] = useState(() => Date.now());
  const hub = useRef<GameHub>(null);

  useEffect(() => {
    if (status) onStatusChange?.(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    const addLog = (text: string) =>
      setLog((entries) => [
        ...entries,
        `${new Date().toLocaleTimeString()}  ${text}`,
      ]);

    const connection = connectGameHub();
    hub.current = connection;
    connection.onStatusChange((connected) =>
      addLog(connected ? "Connected" : "Disconnected"),
    );
    connection.onGameState((state) => {
      addLog(`GameState ${JSON.stringify(state)}`);
      // The server's position is the truth. Games made before the column
      // existed have an empty one, so they start from the opening position.
      setFen(state.gameState || new Chess().fen());
      setClocks({
        whiteTimeRemainingMs: state.whiteTimeRemainingMs,
        blackTimeRemainingMs: state.blackTimeRemainingMs,
        lastMoveAt: state.lastMoveAt,
      });
      setStatus(state.status);
      setResult(state.result);
      setWinner(state.winner);
    });
    // A move means both players are in and the game has started.
    const moveMade = () =>
      setStatus((current) =>
        current === "completed" ? current : "in_progress",
      );
    connection.onMoveConfirmed((move) => {
      addLog(`MoveConfirmed ${JSON.stringify(move)}`);
      moveMade();
    });
    connection.onGameOver((gameOver) => {
      addLog(`GameOver ${JSON.stringify(gameOver)}`);
      setStatus("completed");
      setResult(gameOver.result);
      setWinner(gameOver.winner);
    });
    connection.onClockUpdate((update) => {
      addLog(`ClockUpdate ${JSON.stringify(update)}`);
      setClocks(update);
    });
    connection.onError((message) => addLog(`Error: ${message}`));
    connection.onMoveMade((move) => {
      addLog(`MoveMade ${JSON.stringify(move)}`);
      moveMade();
      setFen((current) => {
        const game = new Chess(current);
        try {
          // The server sends a missing promotion as null.
          game.move({ ...move, promotion: move.promotion ?? undefined });
          return game.fen();
        } catch {
          return current;
        }
      });
    });
    // Connects as soon as the page opens. The server answers with GameState.
    connection
      .connectToGame(gameId)
      .catch((error: Error) => addLog(`Error: ${error.message}`));
    return () => {
      hub.current = null;
      void connection.stop();
    };
  }, [gameId]);

  function play(move: MoveIntent) {
    // Show the move straight away, and undo it if the server rejects it.
    if (!fen) return;
    const previousFen = fen;
    const game = new Chess(fen);
    game.move(move);
    const movedFen = game.fen();
    setFen(movedFen);

    hub.current?.sendMove(gameId, move).catch((error: Error) => {
      // Only undo if the board still shows this move. A GameState from the
      // server may already have replaced it, and that should win.
      setFen((current) => (current === movedFen ? previousFen : current));
      setLog((entries) => [...entries, `Error: ${error.message}`]);
    });
  }

  const position = new Chess(fen);
  const myTurn = position.turn() === (colour === "white" ? "w" : "b");

  // Whose clock is running. The side to move, except before white's first move
  // (the clock starts once a move is made) and after the game is over.
  const [, turn, , , , fullMove] = (fen ?? "").split(" ");
  const isFirstMove = turn === "w" && fullMove === "1";
  const running =
    clocks && status !== "completed" && !isFirstMove
      ? turn === "w"
        ? "white"
        : "black"
      : null;

  // Re-renders every 200 ms while a clock runs, so each tab's display changes
  // within a fifth of a second of the real time, whenever the tab was opened.
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, [running]);

  // The running clock is the server's time minus the time since the last move,
  // worked out fresh each tick, so every tab shows the same and nothing drifts.
  // All in milliseconds.
  const timeLeft = (side: "white" | "black") => {
    if (!clocks) return 0;
    const stored =
      side === "white"
        ? clocks.whiteTimeRemainingMs
        : clocks.blackTimeRemainingMs;
    if (side !== running || !clocks.lastMoveAt) return stored;
    const msUsed = now - new Date(clocks.lastMoveAt).getTime();
    return Math.max(0, stored - msUsed);
  };

  // Before GameState arrives, an empty bar of the same height keeps the layout still.
  const clockFor = (side: "white" | "black") =>
    clocks ? (
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
      {/* Three rows: status, both clocks, board. The status and clocks have
          fixed heights (5rem, 3rem, plus 2 x 0.5rem gaps = 9rem). The board is
          a square at the container's full width, so the container is never
          wider than the screen height less those rows, the site header (3.5rem,
          or 4rem from sm; components/header.tsx) and the page's padding (2rem,
          or 3rem from sm; routes/play.game.tsx): 14.5rem, or 16rem from sm.
          That way it always fits, and it's no taller than it needs to be. */}
      <div className="mx-auto grid w-full max-w-[calc(100dvh-14.5rem)] grid-rows-[5rem_3rem_auto] gap-2 sm:max-w-[calc(100dvh-16rem)]">
        {/* While waiting, the invite panel above is the page heading. */}
        {status && status !== "waiting" ? (
          <GameStatus
            status={status}
            turn={turn === "w" ? "white" : "black"}
            colour={colour}
            inCheck={position.inCheck()}
            result={result}
            winner={winner}
          />
        ) : (
          <div />
        )}
        <div className="grid grid-cols-2 gap-2">
          {clockFor("white")}
          {clockFor("black")}
        </div>
        <div className="relative aspect-square w-full">
          {fen ? (
            <ChessBoard
              title={`You are playing ${colour}`}
              fen={fen}
              orientation={colour}
              active={myTurn && status !== "completed"}
              onMove={play}
            />
          ) : (
            // Keeps the board's space while the position loads.
            <div className="size-full rounded-xl bg-muted" />
          )}
        </div>
      </div>
      {/* Fixed over the whole page, so it doesn't need to sit inside the board. */}
      {status === "completed" && !menuClosed && (
        <GameOverMenu
          result={result}
          winner={winner}
          colour={colour}
          onClose={() => setMenuClosed(true)}
        />
      )}
      <section
        aria-labelledby="event-log"
        className="mt-4 rounded-xl border p-4"
      >
        <h2 id="event-log" className="text-sm font-semibold">
          Event log
        </h2>
        <ol className="mt-2 max-h-48 space-y-1 overflow-y-auto font-mono text-xs break-all">
          {log.length === 0 ? (
            <li className="text-muted-foreground">No events yet</li>
          ) : (
            log.map((entry, index) => <li key={index}>{entry}</li>)
          )}
        </ol>
      </section>
    </>
  );
}
