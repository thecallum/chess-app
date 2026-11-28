import { Chessboard } from "react-chessboard";
import type { Colour } from "~/lib/api";
import { useChessBoard } from "../hooks/use-chess-board";
import { defaultBoardTheme } from "../lib/board-themes";

// Our own board component, so the rest of the app doesn't depend on
// react-chessboard directly. Controlled: the parent owns the position (`gameState`).
// Moves are made by dragging or by clicking a piece then its destination, and
// are reported through `onMove` as a move intent.
export type MoveIntent = { from: string; to: string; promotion?: string };

const themeProps = {
  lightSquareStyle: { backgroundColor: defaultBoardTheme.light },
  darkSquareStyle: { backgroundColor: defaultBoardTheme.dark },
  boardStyle: defaultBoardTheme.board,
  darkSquareNotationStyle: {
    color: defaultBoardTheme.notation ?? defaultBoardTheme.light,
  },
  lightSquareNotationStyle: {
    color: defaultBoardTheme.notation ?? defaultBoardTheme.dark,
  },
};

type Props = {
  // Labels the board for screen readers. Not shown.
  title: string;
  gameState: string;
  orientation?: Colour;
  // Only the active board can be moved on.
  boardIsActiveForPlayer: boolean;
  onMove: (move: MoveIntent) => void;
};

export function ChessBoard({
  title,
  gameState,
  orientation = "white",
  boardIsActiveForPlayer,
  onMove,
}: Props) {
  const boardHandlers = useChessBoard({
    gameState,
    boardIsActiveForPlayer,
    onMove,
  });

  return (
    <section aria-label={title} className="flex flex-col gap-3">
      {/* touch-none stops the page scrolling while dragging a piece. */}
      <div className="w-full touch-none">
        <Chessboard
          options={{
            position: gameState,
            boardOrientation: orientation,
            allowDragging: boardIsActiveForPlayer,
            ...themeProps,
            ...boardHandlers,
          }}
        />
      </div>
    </section>
  );
}
