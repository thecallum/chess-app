import { Chess } from "chess.js";
import { useEffect, useRef, useState } from "react";
import { ChessBoard, type MoveIntent } from "./chess-board";
import { connectGameHub, type GameHub } from "../lib/game-hub";

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
  const hub = useRef<GameHub>(null);

  useEffect(() => {
    const connection = connectGameHub();
    hub.current = connection;
    connection.onMoveMade((move) => {
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
    void connection.joinGame(gameId);
    return () => {
      hub.current = null;
      void connection.stop();
    };
  }, [gameId]);

  function play(move: MoveIntent) {
    const game = new Chess(fen);
    game.move(move);
    setFen(game.fen());
    void hub.current?.sendMove(gameId, move);
  }

  const myTurn = new Chess(fen).turn() === (colour === "white" ? "w" : "b");

  return (
    <ChessBoard
      title={`You are playing ${colour}`}
      fen={fen}
      orientation={colour}
      active={myTurn}
      onMove={play}
    />
  );
}
