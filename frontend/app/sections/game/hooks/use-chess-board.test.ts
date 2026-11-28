import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MoveIntent } from "../components/chess-board";
import { findMove, isPlayersPiece, squareHighlights } from "../lib/board-moves";
import { useChessBoard } from "./use-chess-board";

vi.mock("../lib/board-moves");

const GAME_STATE = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const E2_E4: MoveIntent = { from: "e2", to: "e4" };
const whitePawn = { pieceType: "wP" };

function renderBoard(boardIsActiveForPlayer = true) {
  const onMove = vi.fn();
  const { result } = renderHook(() =>
    useChessBoard({ gameState: GAME_STATE, boardIsActiveForPlayer, onMove }),
  );
  return { result, onMove };
}

const selectedSquare = () => vi.mocked(squareHighlights).mock.lastCall?.[1];

describe("useChessBoard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.each([true, false])(
    "returns the square styles from squareHighlights (board active: %s)",
    (boardIsActiveForPlayer) => {
      // Arrange
      const styles = { e2: { background: "yellow" } };
      vi.mocked(squareHighlights).mockReturnValue(styles);

      // Act
      const { result } = renderBoard(boardIsActiveForPlayer);

      // Assert
      expect(squareHighlights).toHaveBeenCalledWith(
        GAME_STATE,
        null,
        boardIsActiveForPlayer,
      );
      expect(result.current.squareStyles).toBe(styles);
    },
  );

  describe("canDragPiece", () => {
    it("can't drag a piece when the board is inactive", () => {
      // Arrange
      vi.mocked(isPlayersPiece).mockReturnValue(true);
      const { result } = renderBoard(false);

      // Act
      const canDrag = result.current.canDragPiece({
        isSparePiece: false,
        piece: whitePawn,
        square: "e2",
      });

      // Assert
      expect(canDrag).toBe(false);
    });

    it("can't drag a piece that isn't the player's", () => {
      // Arrange
      vi.mocked(isPlayersPiece).mockReturnValue(false);
      const { result } = renderBoard();

      // Act
      const canDrag = result.current.canDragPiece({
        isSparePiece: false,
        piece: { pieceType: "bP" },
        square: "e7",
      });

      // Assert
      expect(canDrag).toBe(false);
      expect(isPlayersPiece).toHaveBeenCalledWith(GAME_STATE, "bP");
    });

    it("can drag the player's piece", () => {
      // Arrange
      vi.mocked(isPlayersPiece).mockReturnValue(true);
      const { result } = renderBoard();

      // Act
      const canDrag = result.current.canDragPiece({
        isSparePiece: false,
        piece: whitePawn,
        square: "e2",
      });

      // Assert
      expect(canDrag).toBe(true);
    });
  });

  describe("onPieceDrop", () => {
    const drop = (targetSquare: string | null) => ({
      piece: { isSparePiece: false, position: "e2", pieceType: "wP" },
      sourceSquare: "e2",
      targetSquare,
    });

    it("returns false when the board is inactive", () => {
      // Arrange
      vi.mocked(findMove).mockReturnValue(E2_E4);
      const { result, onMove } = renderBoard(false);

      // Act
      const dropped = result.current.onPieceDrop(drop("e4"));

      // Assert
      expect(dropped).toBe(false);
      expect(onMove).not.toHaveBeenCalled();
    });

    it("returns false when there is no target square", () => {
      // Arrange
      const { result, onMove } = renderBoard();

      // Act
      const dropped = result.current.onPieceDrop(drop(null));

      // Assert
      expect(dropped).toBe(false);
      expect(onMove).not.toHaveBeenCalled();
    });

    it("returns false when the move isn't legal", () => {
      // Arrange
      vi.mocked(findMove).mockReturnValue(null);
      const { result, onMove } = renderBoard();

      // Act
      const dropped = result.current.onPieceDrop(drop("e5"));

      // Assert
      expect(dropped).toBe(false);
      expect(findMove).toHaveBeenCalledWith(GAME_STATE, "e2", "e5");
      expect(onMove).not.toHaveBeenCalled();
    });

    it("makes the move and returns true when the move is legal", () => {
      // Arrange
      vi.mocked(findMove).mockReturnValue(E2_E4);
      const { result, onMove } = renderBoard();

      // Act
      let dropped = false;
      act(() => {
        dropped = result.current.onPieceDrop(drop("e4"));
      });

      // Assert
      expect(dropped).toBe(true);
      expect(onMove).toHaveBeenCalledWith(E2_E4);
      expect(selectedSquare()).toBeNull();
    });
  });

  describe("onSquareClick", () => {
    it("does nothing when the board is inactive", () => {
      // Arrange
      vi.mocked(isPlayersPiece).mockReturnValue(true);
      const { result, onMove } = renderBoard(false);

      // Act
      act(() =>
        result.current.onSquareClick({ square: "e2", piece: whitePawn }),
      );

      // Assert
      expect(selectedSquare()).toBeNull();
      expect(onMove).not.toHaveBeenCalled();
    });

    it("selects the player's piece when nothing is selected", () => {
      // Arrange
      vi.mocked(isPlayersPiece).mockReturnValue(true);
      const { result, onMove } = renderBoard();

      // Act
      act(() =>
        result.current.onSquareClick({ square: "e2", piece: whitePawn }),
      );

      // Assert
      expect(selectedSquare()).toBe("e2");
      expect(findMove).not.toHaveBeenCalled();
      expect(onMove).not.toHaveBeenCalled();
    });

    it("doesn't select a square without the player's piece", () => {
      // Arrange
      vi.mocked(isPlayersPiece).mockReturnValue(false);
      const { result } = renderBoard();

      // Act
      act(() => result.current.onSquareClick({ square: "e4", piece: null }));

      // Assert
      expect(selectedSquare()).toBeNull();
    });

    it("makes the move and clears the selection when the clicked square is a legal move", () => {
      // Arrange
      vi.mocked(isPlayersPiece).mockReturnValue(true);
      vi.mocked(findMove).mockReturnValue(E2_E4);
      const { result, onMove } = renderBoard();
      act(() =>
        result.current.onSquareClick({ square: "e2", piece: whitePawn }),
      );

      // Act
      act(() => result.current.onSquareClick({ square: "e4", piece: null }));

      // Assert
      expect(findMove).toHaveBeenCalledWith(GAME_STATE, "e2", "e4");
      expect(onMove).toHaveBeenCalledWith(E2_E4);
      expect(selectedSquare()).toBeNull();
    });

    it("switches the selection when the clicked square isn't a legal move but holds the player's piece", () => {
      // Arrange
      vi.mocked(isPlayersPiece).mockReturnValue(true);
      vi.mocked(findMove).mockReturnValue(null);
      const { result, onMove } = renderBoard();
      act(() =>
        result.current.onSquareClick({ square: "e2", piece: whitePawn }),
      );

      // Act
      act(() =>
        result.current.onSquareClick({ square: "d2", piece: whitePawn }),
      );

      // Assert
      expect(selectedSquare()).toBe("d2");
      expect(onMove).not.toHaveBeenCalled();
    });

    it("clears the selection when the clicked square isn't a legal move or the player's piece", () => {
      // Arrange
      vi.mocked(isPlayersPiece)
        .mockReturnValueOnce(true)
        .mockReturnValue(false);
      vi.mocked(findMove).mockReturnValue(null);
      const { result, onMove } = renderBoard();
      act(() =>
        result.current.onSquareClick({ square: "e2", piece: whitePawn }),
      );

      // Act
      act(() => result.current.onSquareClick({ square: "e5", piece: null }));

      // Assert
      expect(selectedSquare()).toBeNull();
      expect(onMove).not.toHaveBeenCalled();
    });
  });
});
