import { Chess } from "chess.js";
import { useState } from "react";
import { ChessBoard, type MoveIntent } from "~/components/chess-board";
import { Button } from "~/components/ui/button";

// Two boards with separate state. Whoever's turn it is, white uses the left
// board and black uses the right (upside down). A move made on the active
// board is submitted to the other board too.
export function LinkedBoards() {
  const [left, setLeft] = useState(() => new Chess().fen());
  const [right, setRight] = useState(() => new Chess().fen());

  // Each board checks the move against its own position.
  const whiteToMove = new Chess(left).turn() === "w";

  function play(from: "left" | "right", move: MoveIntent) {
    console.log(`Move on ${from} board:`, move);
    const apply = (fen: string) => {
      const game = new Chess(fen);
      game.move(move);
      return game.fen();
    };
    try {
      // The board that was moved on already validated it; the other board
      // applies it to its own state.
      if (from === "left") {
        setLeft(apply(left));
        setRight(apply(right));
      } else {
        setRight(apply(right));
        setLeft(apply(left));
      }
    } catch {
      // The boards disagree about legality, so leave both unchanged.
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stacked on mobile, side by side from md. */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChessBoard
          title="White's board"
          fen={left}
          active={whiteToMove}
          onMove={(m) => play("left", m)}
        />
        <ChessBoard
          title="Black's board"
          fen={right}
          orientation="black"
          active={!whiteToMove}
          onMove={(m) => play("right", m)}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setLeft(new Chess().fen());
          setRight(new Chess().fen());
        }}
        className="h-12 w-full text-base sm:h-9 sm:w-auto sm:text-sm"
      >
        Reset boards
      </Button>
    </div>
  );
}
