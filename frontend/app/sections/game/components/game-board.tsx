import { Chess } from "chess.js";
import { useEffect, useRef, useState } from "react";
import { ChessBoard, type MoveIntent } from "./chess-board";
import { GameClocks } from "./game-clocks";
import {
  connectGameHub,
  type ClockMessage,
  type GameHub,
} from "../lib/game-hub";

// One board for this player. Moves made here are sent over the game's channel,
// and moves from the opponent arrive on it. Scaffolding: the server just
// relays moves, so the position only lives in this browser.
export function GameBoard({
  gameId,
  colour,
}: {
  gameId: string;
  colour: "white" | "black";
}) {
  const [fen, setFen] = useState(() => new Chess().fen());
  const [log, setLog] = useState<string[]>([]);
  // The server's clocks as of the last move. Undefined until GameState arrives.
  const [clocks, setClocks] = useState<ClockMessage>();
  const [gameOver, setGameOver] = useState(false);
  // Ticks once a second while a clock runs, so the display updates.
  const [now, setNow] = useState(() => Date.now());
  const hub = useRef<GameHub>(null);

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
      // existed have an empty one, so keep the starting position for those.
      if (state.gameState) setFen(state.gameState);
      setClocks({
        whiteTimeRemaining: state.whiteTimeRemaining,
        blackTimeRemaining: state.blackTimeRemaining,
        lastMoveAt: state.lastMoveAt,
      });
      setGameOver(state.status === "completed");
    });
    connection.onMoveConfirmed((move) =>
      addLog(`MoveConfirmed ${JSON.stringify(move)}`),
    );
    connection.onGameOver((gameOver) => {
      addLog(`GameOver ${JSON.stringify(gameOver)}`);
      setGameOver(true);
    });
    connection.onClockUpdate((update) => {
      addLog(`ClockUpdate ${JSON.stringify(update)}`);
      setClocks(update);
    });
    connection.onError((message) => addLog(`Error: ${message}`));
    connection.onMoveMade((move) => {
      addLog(`MoveMade ${JSON.stringify(move)}`);
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
    const game = new Chess(fen);
    game.move(move);
    setFen(game.fen());
    hub.current
      ?.sendMove(gameId, move)
      .catch((error: Error) =>
        setLog((entries) => [...entries, `Error: ${error.message}`]),
      );
  }

  const myTurn = new Chess(fen).turn() === (colour === "white" ? "w" : "b");

  // Whose clock is running. The side to move, except before white's first move
  // (the clock starts once a move is made) and after the game is over.
  const [, turn, , , , fullMove] = fen.split(" ");
  const isFirstMove = turn === "w" && fullMove === "1";
  const running =
    clocks && !gameOver && !isFirstMove
      ? turn === "w"
        ? "white"
        : "black"
      : null;

  // Re-renders once a second while a clock runs.
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  // The running clock is the server's time minus the time since the last move,
  // worked out fresh each tick, so every tab shows the same and nothing drifts.
  const timeLeft = (side: "white" | "black") => {
    if (!clocks) return 0;
    const stored =
      side === "white" ? clocks.whiteTimeRemaining : clocks.blackTimeRemaining;
    if (side !== running || !clocks.lastMoveAt) return stored;
    const secondsUsed = Math.floor(
      (now - new Date(clocks.lastMoveAt).getTime()) / 1000,
    );
    return Math.max(0, stored - secondsUsed);
  };

  return (
    <>
      {clocks && (
        <GameClocks
          white={timeLeft("white")}
          black={timeLeft("black")}
          running={running}
        />
      )}
      <ChessBoard
        title={`You are playing ${colour}`}
        fen={fen}
        orientation={colour}
        active={myTurn}
        onMove={play}
      />
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
