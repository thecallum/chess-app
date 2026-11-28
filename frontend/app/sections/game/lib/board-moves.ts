import { Chess, type Square } from "chess.js";
import type { CSSProperties } from "react";
import type { MoveIntent } from "../components/chess-board";

function legalTargets(
  gameState: string,
  selectedSquare: Square,
  boardIsActiveForPlayer: boolean,
): Square[] {
  // 1. Nothing to show when the board isn't active.
  if (!boardIsActiveForPlayer) return [];

  // 2. Every square the selected piece can legally move to.
  return new Chess(gameState)
    .moves({ square: selectedSquare, verbose: true })
    .map((move) => move.to);
}

export function findMove(
  gameState: string,
  from: string,
  to: string,
): MoveIntent | null {
  try {
    // Promotion is always to a queen for now.
    const move = new Chess(gameState).move({ from, to, promotion: "q" });
    return { from: move.from, to: move.to, promotion: move.promotion };
  } catch {
    return null;
  }
}

// pieceType is like "wP" or "bK": the first letter is the piece's colour.
export function isPlayersPiece(
  gameState: string,
  pieceType: string | undefined,
): boolean {
  const isEmptySquare = !pieceType;
  if (isEmptySquare) return false;

  return pieceType.startsWith(new Chess(gameState).turn());
}

export function squareHighlights(
  gameState: string,
  selectedSquare: Square | null,
  boardIsActiveForPlayer: boolean,
): Record<string, CSSProperties> {
  // 1. Nothing to highlight when no square is selected.
  if (!selectedSquare) return {};

  // 2. Highlight the selected square.
  const styles: Record<string, CSSProperties> = {
    [selectedSquare]: { background: "rgba(250, 204, 21, 0.5)" },
  };

  // 3. Put a dot on each square the selected piece can move to.
  const targets = legalTargets(
    gameState,
    selectedSquare,
    boardIsActiveForPlayer,
  );
  for (const square of targets) {
    styles[square] = {
      background:
        "radial-gradient(circle, rgba(0,0,0,0.25) 25%, transparent 26%)",
    };
  }

  return styles;
}
