import { act, render, screen, within } from "@testing-library/react";
import type { ChessboardOptions } from "react-chessboard";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Game, GameStatus } from "~/lib/api";
import {
  createGameConnection,
  type ConnectionStatus,
  type GameStateMessage,
} from "../lib/game-connection";
import { LiveGame } from "./live-game";

const board = vi.hoisted(() => ({
  options: undefined as ChessboardOptions | undefined,
}));

vi.mock("react-chessboard", () => ({
  Chessboard: ({ options }: { options: ChessboardOptions }) => {
    board.options = options;
    return null;
  },
}));
vi.mock("../lib/game-connection");

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AFTER_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
const AFTER_E4_E5 =
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
const AFTER_E4_E5_NF3 =
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2";
// 1. f3 e6 2. e4 Qh4+
const WHITE_IN_CHECK =
  "rnb1kbnr/pppp1ppp/4p3/8/4P2q/5P2/PPPP2PP/RNBQKBNR w KQkq - 1 3";
// 1. f3 e5 2. g4 Qh4#
const FOOLS_MATE =
  "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";

const game = (status: GameStatus = "in_progress"): Game => ({
  gameId: "g1",
  code: "ABC123",
  colour: "white",
  status,
});

const gameState = (
  overrides: Partial<GameStateMessage> = {},
): GameStateMessage => ({
  gameId: "g1",
  status: "in_progress",
  gameState: START,
  currentMove: 1,
  whiteTimeRemainingMs: 300_000,
  blackTimeRemainingMs: 300_000,
  lastMoveAt: null,
  result: null,
  winner: null,
  ...overrides,
});

// React groups pending async transitions, so a move left waiting would hold
// up the next test's moves. Each test answers any it leaves behind.
let unansweredMoves: (() => void)[] = [];

function answerWaitingMoves() {
  unansweredMoves.forEach((resolve) => resolve());
  unansweredMoves = [];
}

// Stands in for the server: tests send it states and statuses, and read the
// moves sent to it. Moves wait until the test calls confirmMove.
function createFakeServer() {
  let sendState: (state: GameStateMessage) => void = () => {};
  let sendStatus: (status: ConnectionStatus) => void = () => {};

  const connection = {
    start: vi.fn(() => Promise.resolve()),
    stop: vi.fn(() => Promise.resolve()),
    sendMove: vi.fn(
      () => new Promise<void>((resolve) => unansweredMoves.push(resolve)),
    ),
    onGameState: vi.fn((handler) => (sendState = handler)),
    onStatusChange: vi.fn((handler) => (sendStatus = handler)),
  };
  vi.mocked(createGameConnection).mockReturnValue(connection);

  return {
    connection,
    sendState: (state: GameStateMessage) => act(() => sendState(state)),
    sendStatus: (status: ConnectionStatus) => act(() => sendStatus(status)),
    // Like the real server: sends the new state, then answers the move.
    confirmMove: async (state: GameStateMessage) => {
      act(() => sendState(state));
      answerWaitingMoves();
      await finishMove();
    },
  };
}

// Waits for the connection to start, so its "connected" status doesn't land
// in the middle of a test. The router is for the game over menu's link.
async function renderLiveGame(status: GameStatus = "in_progress") {
  await act(async () => {
    render(
      <MemoryRouter>
        <LiveGame game={game(status)} />
      </MemoryRouter>,
    );
  });
}

// Lets the move's transition finish once the server has replied.
const finishMove = () => act(async () => {});

const clickSquare = (square: string, pieceType?: string) =>
  act(() =>
    board.options?.onSquareClick?.({
      square,
      piece: pieceType ? { pieceType } : null,
    }),
  );

const dropPiece = (pieceType: string, from: string, to: string) =>
  act(() =>
    board.options?.onPieceDrop?.({
      piece: { pieceType, position: from, isSparePiece: false },
      sourceSquare: from,
      targetSquare: to,
    }),
  );

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
  });
});
