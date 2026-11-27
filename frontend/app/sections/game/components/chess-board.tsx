import { Chess, type Square } from "chess.js";
import { useState } from "react";
import { Chessboard } from "react-chessboard";
import { defaultBoardTheme, type BoardTheme } from "../lib/board-themes";

// Our own board component, so the rest of the app doesn't depend on
// react-chessboard directly. Controlled: the parent owns the position (`gameState`).
// Moves are made by dragging or by clicking a piece then its destination, and
// are reported through `onMove` as a move intent.
export type MoveIntent = { from: string; to: string; promotion?: string };

type Props = {
  // Labels the board for screen readers. Not shown.
  title: string;
  gameState: string;
  orientation?: "white" | "black";
  // Only the active board can be moved on.
  active: boolean;
  onMove: (move: MoveIntent) => void;
  theme?: BoardTheme;
};

export function ChessBoard({
  title,
  gameState,
  orientation = "white",
  active,
  onMove,
  theme = defaultBoardTheme,
}: Props) {
  const [selected, setSelected] = useState<Square | null>(null);

  const game = new Chess(gameState);
  const targets =
    active && selected
      ? game.moves({ square: selected, verbose: true }).map((m) => m.to)
      : [];

  function tryMove(from: string, to: string) {
    try {
      // Promotion is always to a queen for now.
      const move = game.move({ from, to, promotion: "q" });
      setSelected(null);
      onMove({ from: move.from, to: move.to, promotion: move.promotion });
      return true;
    } catch {
      return false;
    }
  }

  const squareStyles: Record<string, React.CSSProperties> = {};
  if (selected) {
    squareStyles[selected] = { background: "rgba(250, 204, 21, 0.5)" };
  }
  for (const square of targets) {
    squareStyles[square] = {
      background:
        "radial-gradient(circle, rgba(0,0,0,0.25) 25%, transparent 26%)",
    };
  }

  return (
    <section aria-label={title} className="flex flex-col gap-3">
      {/* touch-none stops the page scrolling while dragging a piece. */}
      <div className="w-full touch-none">
        <Chessboard
          options={{
            position: gameState,
            boardOrientation: orientation,
            squareStyles,
            lightSquareStyle: { backgroundColor: theme.light },
            darkSquareStyle: { backgroundColor: theme.dark },
            boardStyle: theme.board,
            darkSquareNotationStyle: { color: theme.notation ?? theme.light },
            lightSquareNotationStyle: { color: theme.notation ?? theme.dark },
            allowDragging: active,
            canDragPiece: ({ piece }) =>
              active && piece.pieceType.startsWith(game.turn()),
            onPieceDrop: ({ sourceSquare, targetSquare }) =>
              active && targetSquare
                ? tryMove(sourceSquare, targetSquare)
                : false,
            onSquareClick: ({ square, piece }) => {
              if (!active) return;
              if (selected && tryMove(selected, square)) return;
              const own = piece?.pieceType.startsWith(game.turn());
              setSelected(own ? (square as Square) : null);
            },
          }}
        />
      </div>
    </section>
  );
}
