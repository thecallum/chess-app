import { Chess, type Square } from "chess.js";
import { useState } from "react";
import { Chessboard } from "react-chessboard";
import { defaultBoardTheme, type BoardTheme } from "../lib/board-themes";

// Our own board component, so the rest of the app doesn't depend on
// react-chessboard directly. Controlled: the parent owns the position (`fen`).
// Moves are made by dragging or by clicking a piece then its destination, and
// are reported through `onMove` as a move intent.
export type MoveIntent = { from: string; to: string; promotion?: string };

type Props = {
  title: string;
  fen: string;
  orientation?: "white" | "black";
  // Only the active board can be moved on.
  active: boolean;
  onMove: (move: MoveIntent) => void;
  theme?: BoardTheme;
};

export function ChessBoard({
  title,
  fen,
  orientation = "white",
  active,
  onMove,
  theme = defaultBoardTheme,
}: Props) {
  const [selected, setSelected] = useState<Square | null>(null);

  const game = new Chess(fen);
  const turn = game.turn() === "w" ? "White" : "Black";
  const targets =
    active && selected
      ? game.moves({ square: selected, verbose: true }).map((m) => m.to)
      : [];

  let status = `${turn} to move`;
  if (game.isCheckmate())
    status = `Checkmate. ${turn === "White" ? "Black" : "White"} wins`;
  else if (game.isDraw()) status = "Draw";
  else if (game.inCheck()) status = `${turn} to move (check)`;

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
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{status}</p>
      {/* touch-none stops the page scrolling while dragging a piece. */}
      <div className="w-full touch-none">
        <Chessboard
          options={{
            position: fen,
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
