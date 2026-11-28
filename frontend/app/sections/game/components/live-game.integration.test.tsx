import { act, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Colour, Game, GameStatus } from "~/lib/api";
import {
  AFTER_E4,
  AFTER_E4_E5,
  AFTER_E4_E5_NF3,
  answerWaitingMoves,
  board,
  clickSquare,
  createFakeServer,
  dropPiece,
  finishMove,
  FOOLS_MATE,
  gameState,
  START,
  WHITE_IN_CHECK,
} from "../integration-helpers";
import { LiveGame } from "./live-game";

vi.mock("react-chessboard", async () => ({
  Chessboard: (await import("../integration-helpers")).FakeChessboard,
}));
vi.mock("../lib/game-connection");

const game = (
  status: GameStatus = "in_progress",
  colour: Colour = "white",
): Game => ({
  gameId: "g1",
  code: "ABC123",
  colour,
  status,
});

// Waits for the connection to start, so its "connected" status doesn't land
// in the middle of a test. The router is for the game over menu's link.
async function renderLiveGame(
  status: GameStatus = "in_progress",
  colour: Colour = "white",
) {
  await act(async () => {
    render(
      <MemoryRouter>
        <LiveGame game={game(status, colour)} />
      </MemoryRouter>,
    );
  });
}

const heading = () => screen.getByRole("heading", { level: 1 });

const clock = (label: string) =>
  screen.getByText(label).parentElement as HTMLElement;

describe("LiveGame", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    board.options = undefined;
  });

  afterEach(async () => {
    answerWaitingMoves();
    await finishMove();
  });

  describe("server state reaches the screen", () => {
    it("shows the start position with no clock running", async () => {
      // Arrange
      const server = createFakeServer();
      await renderLiveGame();

      // Act
      server.sendState(gameState());

      // Assert
      expect(board.options?.position).toBe(START);
      expect(heading()).toHaveTextContent("Your move");
      expect(clock("White (you)")).toHaveClass("bg-muted");
      expect(clock("Black (opponent)")).toHaveClass("bg-muted");
    });

    it("lets the player move once the opponent has moved", async () => {
      // Arrange
      const server = createFakeServer();
      await renderLiveGame();
      server.sendState(gameState({ gameState: AFTER_E4, currentMove: 2 }));

      // Act
      server.sendState(gameState({ gameState: AFTER_E4_E5, currentMove: 3 }));
      clickSquare("g1", "wN");
      clickSquare("f3");

      // Assert
      expect(server.connection.sendMove).toHaveBeenCalledWith(3, {
        from: "g1",
        to: "f3",
      });
    });

    it("lets black move once white has moved", async () => {
      // Arrange
      const server = createFakeServer();
      await renderLiveGame("in_progress", "black");
      server.sendState(gameState());

      // Act
      server.sendState(gameState({ gameState: AFTER_E4, currentMove: 2 }));
      clickSquare("e7", "bP");
      clickSquare("e5");

      // Assert
      expect(board.options?.boardOrientation).toBe("black");
      expect(screen.getByText("Black (you)")).toBeInTheDocument();
      expect(server.connection.sendMove).toHaveBeenCalledWith(2, {
        from: "e7",
        to: "e5",
      });
    });

    it("stops the player moving on the opponent's turn", async () => {
      // Arrange
      const server = createFakeServer();
      await renderLiveGame();

      // Act
      server.sendState(gameState({ gameState: AFTER_E4, currentMove: 2 }));

      // Assert
      expect(heading()).toHaveTextContent("Opponent's move");
      expect(board.options?.allowDragging).toBe(false);
    });
  });

  describe("the player's move reaches the server", () => {
    it("sends a move made by clicking a piece and then its target", async () => {
      // Arrange
      const server = createFakeServer();
      await renderLiveGame();
      server.sendState(gameState());

      // Act
      clickSquare("e2", "wP");
      clickSquare("e4");

      // Assert
      expect(server.connection.sendMove).toHaveBeenCalledWith(1, {
        from: "e2",
        to: "e4",
      });
    });

    it("sends a move made by dragging a piece", async () => {
      // Arrange
      const server = createFakeServer();
      await renderLiveGame();
      server.sendState(gameState());

      // Act
      dropPiece("wP", "e2", "e4");

      // Assert
      expect(server.connection.sendMove).toHaveBeenCalledWith(1, {
        from: "e2",
        to: "e4",
      });
    });

    it("doesn't send an illegal move", async () => {
      // Arrange
      const server = createFakeServer();
      await renderLiveGame();
      server.sendState(gameState());

      // Act
      clickSquare("e2", "wP");
      clickSquare("e5");

      // Assert
      expect(server.connection.sendMove).not.toHaveBeenCalled();
      expect(board.options?.position).toBe(START);
    });
  });

  describe("the optimistic move and the server's reply", () => {
    it("shows the move on the board before the server replies", async () => {
      // Arrange
      const server = createFakeServer();
      await renderLiveGame();
      server.sendState(gameState());

      // Act
      clickSquare("e2", "wP");
      clickSquare("e4");

      // Explicitly the server doesnt send a response

      // Assert
      expect(server.connection.sendMove).toHaveBeenCalledOnce();
      expect(board.options?.position).toBe(AFTER_E4);
      expect(heading()).toHaveTextContent("Opponent's move");
    });

    it("keeps the move and passes the turn when the server confirms it", async () => {
      // Arrange
      const server = createFakeServer();
      await renderLiveGame();
      server.sendState(gameState());
      clickSquare("e2", "wP");
      clickSquare("e4");

      // Act
      await server.confirmMove(
        gameState({
          gameState: AFTER_E4,
          currentMove: 2,
          lastMoveAt: new Date().toISOString(),
        }),
      );

      // Assert
      expect(board.options?.position).toBe(AFTER_E4);
      expect(heading()).toHaveTextContent("Opponent's move");
      expect(clock("Black (opponent)")).toHaveClass("bg-primary");
    });

    it("puts the piece back when the server rejects the move", async () => {
      // Arrange
      const server = createFakeServer();
      server.connection.sendMove.mockRejectedValue(new Error("Illegal move"));
      await renderLiveGame();
      server.sendState(gameState());

      // Act
      clickSquare("e2", "wP");
      clickSquare("e4");
      await finishMove();

      // Assert
      expect(board.options?.position).toBe(START);
      expect(heading()).toHaveTextContent("Your move");
    });

    it("keeps the player's clock running until the server confirms the move", async () => {
      // Arrange
      const server = createFakeServer();
      await renderLiveGame();
      server.sendState(
        gameState({
          gameState: AFTER_E4_E5,
          currentMove: 3,
          lastMoveAt: new Date().toISOString(),
        }),
      );

      // Act
      clickSquare("g1", "wN");
      clickSquare("f3");

      // Assert
      expect(board.options?.position).toBe(AFTER_E4_E5_NF3);
      expect(heading()).toHaveTextContent("Opponent's move");
      expect(clock("White (you)")).toHaveClass("bg-primary");
    });
  });

  describe("clocks", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
      vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("counts down the player's clock when it's their move", async () => {
      // Arrange
      const server = createFakeServer();
      await renderLiveGame();
      server.sendState(
        gameState({
          gameState: AFTER_E4_E5,
          currentMove: 3,
          lastMoveAt: new Date().toISOString(),
        }),
      );

      // Act
      act(() => vi.advanceTimersByTime(5_000));

      // Assert
      expect(
        within(clock("White (you)")).getByText("4:55"),
      ).toBeInTheDocument();
      expect(
        within(clock("Black (opponent)")).getByText("5:00"),
      ).toBeInTheDocument();
    });

    it("switches to the other clock when the next state arrives", async () => {
      // Arrange
      const server = createFakeServer();
      await renderLiveGame();
      server.sendState(
        gameState({
          gameState: AFTER_E4_E5,
          currentMove: 3,
          lastMoveAt: new Date().toISOString(),
        }),
      );
      act(() => vi.advanceTimersByTime(5_000));

      // Act
      server.sendState(
        gameState({
          gameState: AFTER_E4_E5_NF3,
          currentMove: 4,
          whiteTimeRemainingMs: 295_000,
          lastMoveAt: new Date().toISOString(),
        }),
      );
      act(() => vi.advanceTimersByTime(3_000));

      // Assert
      expect(
        within(clock("White (you)")).getByText("4:55"),
      ).toBeInTheDocument();
      expect(
        within(clock("Black (opponent)")).getByText("4:57"),
      ).toBeInTheDocument();
    });

    it("stops both clocks when the game is over", async () => {
      // Arrange
      const server = createFakeServer();
      await renderLiveGame();
      server.sendState(
        gameState({
          gameState: AFTER_E4_E5,
          currentMove: 3,
          lastMoveAt: new Date().toISOString(),
        }),
      );

      // Act
      server.sendState(
        gameState({
          status: "completed",
          gameState: AFTER_E4_E5,
          currentMove: 3,
          whiteTimeRemainingMs: 0,
          lastMoveAt: new Date().toISOString(),
          result: "Timeout",
          winner: "black",
        }),
      );
      act(() => vi.advanceTimersByTime(5_000));

      // Assert
      expect(clock("White (you)")).toHaveClass("bg-muted");
      expect(clock("Black (opponent)")).toHaveClass("bg-muted");
      expect(
        within(clock("Black (opponent)")).getByText("5:00"),
      ).toBeInTheDocument();
    });
  });

  describe("the game's lifecycle", () => {
    it("swaps the invite panel for the game when the opponent joins", async () => {
      // Arrange
      const server = createFakeServer();
      await renderLiveGame("waiting");
      expect(
        screen.getByRole("dialog", { name: /waiting for your opponent/i }),
      ).toBeInTheDocument();

      // Act
      server.sendState(gameState());

      // Assert
      expect(
        screen.queryByRole("dialog", { name: /waiting for your opponent/i }),
      ).not.toBeInTheDocument();
      expect(heading()).toHaveTextContent("Your move");
    });

    it("shows check when the player's king is attacked", async () => {
      // Arrange
      const server = createFakeServer();
      await renderLiveGame();

      // Act
      server.sendState(
        gameState({ gameState: WHITE_IN_CHECK, currentMove: 5 }),
      );

      // Assert
      expect(
        screen.getByText("You are playing white · Check"),
      ).toBeInTheDocument();
    });

    it("shows the result and stops the board when the game ends", async () => {
      // Arrange
      const server = createFakeServer();
      await renderLiveGame();

      // Act
      server.sendState(
        gameState({
          status: "completed",
          gameState: FOOLS_MATE,
          currentMove: 5,
          result: "Checkmate",
          winner: "black",
        }),
      );
      clickSquare("e2", "wP");
      clickSquare("e4");

      // Assert
      const menu = screen.getByRole("dialog", { name: "Game over" });
      expect(within(menu).getByText("Black wins")).toBeInTheDocument();
      expect(within(menu).getByText("By checkmate")).toBeInTheDocument();
      expect(board.options?.allowDragging).toBe(false);
      expect(server.connection.sendMove).not.toHaveBeenCalled();
    });
  });

  describe("connection status", () => {
    it("shows the reconnecting menu while the connection is lost", async () => {
      // Arrange
      const server = createFakeServer();
      await renderLiveGame();
      server.sendState(gameState());

      // Act
      server.sendStatus("reconnecting");

      // Assert
      expect(
        screen.getByRole("dialog", { name: /reconnecting/i }),
      ).toBeInTheDocument();
    });

    it("hides the reconnecting menu once the connection is back", async () => {
      // Arrange
      const server = createFakeServer();
      await renderLiveGame();
      server.sendState(gameState());
      server.sendStatus("reconnecting");

      // Act
      server.sendStatus("connected");

      // Assert
      expect(
        screen.queryByRole("dialog", { name: /reconnecting/i }),
      ).not.toBeInTheDocument();
    });

    it("shows the disconnected menu when the connection can't start", async () => {
      // Arrange
      vi.spyOn(console, "error").mockImplementation(() => {});
      const server = createFakeServer();
      server.connection.start.mockRejectedValue(new Error("Network error"));

      // Act
      await renderLiveGame();

      // Assert
      expect(
        screen.getByRole("dialog", { name: "Disconnected" }),
      ).toBeInTheDocument();
    });
  });
});
