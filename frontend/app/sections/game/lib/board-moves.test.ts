import type { CSSProperties } from "react";
import { describe, expect, it } from "vitest";
import { findMove, isPlayersPiece, squareHighlights } from "./board-moves";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AFTER_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
const WHITE_PAWN_ABOUT_TO_PROMOTE = "k7/4P3/8/8/8/8/8/4K3 w - - 0 1";

const SELECTED = "rgba(250, 204, 21, 0.5)";

const dotSquares = (styles: Record<string, CSSProperties>) =>
  Object.keys(styles).filter((square) =>
    String(styles[square].background).includes("radial-gradient"),
  );

describe("findMove", () => {
  it("returns the move when it is legal", () => {
    // Act
    const move = findMove(START, "e2", "e4");

    // Assert
    expect(move).toEqual({ from: "e2", to: "e4" });
  });

  it("promotes to a queen", () => {
    // Act
    const move = findMove(WHITE_PAWN_ABOUT_TO_PROMOTE, "e7", "e8");

    // Assert
    expect(move).toEqual({ from: "e7", to: "e8", promotion: "q" });
  });

  it("returns null when no legal move is found", () => {
    // Act
    const move = findMove(START, "e2", "e5");

    // Assert
    expect(move).toBeNull();
  });
});

describe("isPlayersPiece", () => {
  it("returns false for an empty square", () => {
    // Act
    const result = isPlayersPiece(START, undefined);

    // Assert
    expect(result).toBe(false);
  });

  it.each([
    { position: "white to move", fen: START, pieceType: "wP" },
    { position: "black to move", fen: AFTER_E4, pieceType: "bN" },
  ])(
    "returns true for the player's piece ($position)",
    ({ fen, pieceType }) => {
      // Act
      const result = isPlayersPiece(fen, pieceType);

      // Assert
      expect(result).toBe(true);
    },
  );

  it.each([
    { position: "white to move", fen: START, pieceType: "bP" },
    { position: "black to move", fen: AFTER_E4, pieceType: "wN" },
  ])(
    "returns false for the opponent's piece ($position)",
    ({ fen, pieceType }) => {
      // Act
      const result = isPlayersPiece(fen, pieceType);

      // Assert
      expect(result).toBe(false);
    },
  );
});

describe("squareHighlights", () => {
  it("returns an empty object when no square is selected", () => {
    // Act
    const styles = squareHighlights(START, null, true);

    // Assert
    expect(styles).toEqual({});
  });

  it("shows no dots when the selected piece has no legal moves", () => {
    // Act
    const styles = squareHighlights(START, "a1", true);

    // Assert
    expect(dotSquares(styles)).toEqual([]);
  });

  it("highlights the selected square", () => {
    // Act
    const styles = squareHighlights(START, "e2", true);

    // Assert
    expect(styles.e2).toEqual({ background: SELECTED });
  });

  it("shows no dots when the board is inactive", () => {
    // Act
    const styles = squareHighlights(START, "e2", false);

    // Assert
    expect(dotSquares(styles)).toEqual([]);
  });

  it("puts a dot on every legal move of the selected piece", () => {
    // Act
    const styles = squareHighlights(START, "e2", true);

    // Assert
    expect(dotSquares(styles).sort()).toEqual(["e3", "e4"]);
  });
});
