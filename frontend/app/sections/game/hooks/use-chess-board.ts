import type { Square } from "chess.js";
import { useState } from "react";
import type {
  PieceDropHandlerArgs,
  PieceHandlerArgs,
  SquareHandlerArgs,
} from "react-chessboard";
import type { MoveIntent } from "../components/chess-board";
import { findMove, isPlayersPiece, squareHighlights } from "../lib/board-moves";

export function useChessBoard({
  gameState,
  boardIsActiveForPlayer,
  onMove,
}: {
  gameState: string;
  boardIsActiveForPlayer: boolean;
  onMove: (move: MoveIntent) => void;
}) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  function tryMove(from: string, to: string) {
    const move = findMove(gameState, from, to);
    if (!move) return false;
    setSelectedSquare(null);
    onMove(move);
    return true;
  }

  function canDragPiece({ piece }: PieceHandlerArgs) {
    return boardIsActiveForPlayer && isPlayersPiece(gameState, piece.pieceType);
  }

  function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
    // 1. Ignore drops when it isn't this player's turn or off the board.
    if (!boardIsActiveForPlayer || !targetSquare) return false;

    // 2. Try the move. Returning false puts the piece back.
    return tryMove(sourceSquare, targetSquare);
  }

  function onSquareClick({ square, piece }: SquareHandlerArgs) {
    // 1. Ignore clicks when it isn't this player's turn.
    if (!boardIsActiveForPlayer) return;

    // 2. With a piece selected, try moving it to the clicked square.
    if (selectedSquare && tryMove(selectedSquare, square)) return;

    // 3. Otherwise, select the clicked square if it holds a piece of the side
    //    to move, or clear the selection.
    setSelectedSquare(
      isPlayersPiece(gameState, piece?.pieceType) ? (square as Square) : null,
    );
  }

  return {
    squareStyles: squareHighlights(
      gameState,
      selectedSquare,
      boardIsActiveForPlayer,
    ),
    canDragPiece,
    onPieceDrop,
    onSquareClick,
  };
}
