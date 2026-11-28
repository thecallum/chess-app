import { render, screen } from "@testing-library/react";
import type { ChessboardOptions } from "react-chessboard";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChessBoard } from "../hooks/use-chess-board";
import { defaultBoardTheme } from "../lib/board-themes";
import { ChessBoard } from "./chess-board";

const board = vi.hoisted(() => ({
  options: undefined as ChessboardOptions | undefined,
}));

vi.mock("react-chessboard", () => ({
  Chessboard: ({ options }: { options: ChessboardOptions }) => {
    board.options = options;
    return null;
  },
}));
vi.mock("../hooks/use-chess-board");

const GAME_STATE = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function mockBoardHandlers() {
  const handlers = {
    squareStyles: { e2: { background: "yellow" } },
    canDragPiece: vi.fn(),
    onPieceDrop: vi.fn(),
    onSquareClick: vi.fn(),
  };
  vi.mocked(useChessBoard).mockReturnValue(handlers);
  return handlers;
}

function renderBoard(
  props: Partial<React.ComponentProps<typeof ChessBoard>> = {},
) {
  const onMove = vi.fn();
  render(
    <ChessBoard
      title="You are playing white"
      gameState={GAME_STATE}
      boardIsActiveForPlayer
      onMove={onMove}
      {...props}
    />,
  );
  return { onMove };
}

describe("ChessBoard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    board.options = undefined;
    mockBoardHandlers();
  });

  it("labels the board with the title", () => {
    // Act
    renderBoard({ title: "You are playing black" });

    // Assert
    expect(
      screen.getByRole("region", { name: "You are playing black" }),
    ).toBeInTheDocument();
  });

  it("shows the game state", () => {
    // Act
    renderBoard();

    // Assert
    expect(board.options?.position).toBe(GAME_STATE);
  });

  it("uses the given orientation", () => {
    // Act
    renderBoard({ orientation: "black" });

    // Assert
    expect(board.options?.boardOrientation).toBe("black");
  });

  it("is oriented for white by default", () => {
    // Act
    renderBoard();

    // Assert
    expect(board.options?.boardOrientation).toBe("white");
  });

  it.each([true, false])(
    "allows dragging only when the board is active (active: %s)",
    (boardIsActiveForPlayer) => {
      // Act
      renderBoard({ boardIsActiveForPlayer });

      // Assert
      expect(board.options?.allowDragging).toBe(boardIsActiveForPlayer);
    },
  );

  it("passes the game state, active flag and onMove to useChessBoard", () => {
    // Act
    const { onMove } = renderBoard({ boardIsActiveForPlayer: false });

    // Assert
    expect(useChessBoard).toHaveBeenCalledWith({
      gameState: GAME_STATE,
      boardIsActiveForPlayer: false,
      onMove,
    });
  });

  it("passes the square styles and handlers from useChessBoard to the board", () => {
    // Arrange
    const handlers = mockBoardHandlers();

    // Act
    renderBoard();

    // Assert
    expect(board.options?.squareStyles).toBe(handlers.squareStyles);
    expect(board.options?.canDragPiece).toBe(handlers.canDragPiece);
    expect(board.options?.onPieceDrop).toBe(handlers.onPieceDrop);
    expect(board.options?.onSquareClick).toBe(handlers.onSquareClick);
  });

  it("applies the default board theme", () => {
    // Act
    renderBoard();

    // Assert
    expect(board.options?.lightSquareStyle).toEqual({
      backgroundColor: defaultBoardTheme.light,
    });
    expect(board.options?.darkSquareStyle).toEqual({
      backgroundColor: defaultBoardTheme.dark,
    });
  });
});
