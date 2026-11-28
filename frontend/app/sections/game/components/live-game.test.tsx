import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Game, GameStatus } from "~/lib/api";
import { useLiveGame } from "../hooks/use-live-game";
import type {
  ConnectionStatus,
  GameStateMessage,
} from "../lib/game-connection";
import { LiveGame } from "./live-game";

vi.mock("../hooks/use-live-game");
vi.mock("./waiting-for-opponent", () => ({
  WaitingForOpponent: () => <p>Waiting for opponent</p>,
}));
vi.mock("./game-status-bar", () => ({
  GameStatusBar: () => <p>Status bar</p>,
}));
vi.mock("./game-timer", () => ({ GameTimer: () => <p>Timer</p> }));
vi.mock("./chess-board", () => ({ ChessBoard: () => <p>Board</p> }));
vi.mock("./game-over-menu", () => ({ GameOverMenu: () => <p>Game over</p> }));
vi.mock("./connection-menu", () => ({
  ConnectionMenu: () => <p>Connection menu</p>,
}));

const game = (status: GameStatus = "in_progress"): Game => ({
  gameId: "g1",
  code: "ABC123",
  colour: "white",
  status,
});

const gameState = (status: GameStatus): GameStateMessage => ({
  gameId: "g1",
  status,
  gameState: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  currentMove: 1,
  whiteTimeRemainingMs: 300_000,
  blackTimeRemainingMs: 300_000,
  lastMoveAt: null,
  result: null,
  winner: null,
});

function mockHandler({
  state,
  connectionStatus = "connected",
}: {
  state?: GameStateMessage;
  connectionStatus?: ConnectionStatus;
}) {
  vi.mocked(useLiveGame).mockReturnValue({
    state,
    optimisticState: state,
    connectionStatus,
    turn: "white",
    inCheck: false,
    canMove: true,
    play: vi.fn(),
  });
}

describe("LiveGame", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("waiting for opponent", () => {
    it.each([
      {
        when: "the page load says waiting",
        pageStatus: "waiting" as const,
        state: undefined,
      },
      {
        when: "the live state says waiting",
        pageStatus: "in_progress" as const,
        state: gameState("waiting"),
      },
    ])("shows the waiting panel when $when", ({ pageStatus, state }) => {
      // Arrange
      mockHandler({ state });

      // Act
      render(<LiveGame game={game(pageStatus)} />);

      // Assert
      expect(screen.getByText("Waiting for opponent")).toBeInTheDocument();
    });

    it.each([
      {
        when: "the page load says in progress",
        pageStatus: "in_progress" as const,
        state: undefined,
      },
      {
        when: "the live state says in progress",
        pageStatus: "waiting" as const,
        state: gameState("in_progress"),
      },
    ])("doesn't show the waiting panel when $when", ({ pageStatus, state }) => {
      // Arrange
      mockHandler({ state });

      // Act
      render(<LiveGame game={game(pageStatus)} />);

      // Assert
      expect(
        screen.queryByText("Waiting for opponent"),
      ).not.toBeInTheDocument();
    });
  });

  describe("status bar", () => {
    it("shows the status bar once the game is under way", () => {
      // Arrange
      mockHandler({ state: gameState("in_progress") });

      // Act
      render(<LiveGame game={game()} />);

      // Assert
      expect(screen.getByText("Status bar")).toBeInTheDocument();
    });

    it.each([
      { when: "the state hasn't loaded", state: undefined },
      { when: "waiting for an opponent", state: gameState("waiting") },
    ])("doesn't show the status bar when $when", ({ state }) => {
      // Arrange
      mockHandler({ state });

      // Act
      render(<LiveGame game={game()} />);

      // Assert
      expect(screen.queryByText("Status bar")).not.toBeInTheDocument();
    });
  });

  it("shows the timer", () => {
    // Arrange
    mockHandler({ state: gameState("in_progress") });

    // Act
    render(<LiveGame game={game()} />);

    // Assert
    expect(screen.getByText("Timer")).toBeInTheDocument();
  });

  describe("board", () => {
    it("shows the board once the state has loaded", () => {
      // Arrange
      mockHandler({ state: gameState("in_progress") });

      // Act
      render(<LiveGame game={game()} />);

      // Assert
      expect(screen.getByText("Board")).toBeInTheDocument();
    });

    it("keeps the board's space while the state loads", () => {
      // Arrange
      mockHandler({ state: undefined });

      // Act
      const { container } = render(<LiveGame game={game()} />);

      // Assert
      expect(screen.queryByText("Board")).not.toBeInTheDocument();
      expect(
        container.querySelector(".aspect-square")?.firstElementChild,
      ).toBeInTheDocument();
    });
  });

  describe("game over menu", () => {
    it("shows the game over menu when the game is completed", () => {
      // Arrange
      mockHandler({ state: gameState("completed") });

      // Act
      render(<LiveGame game={game()} />);

      // Assert
      expect(screen.getByText("Game over")).toBeInTheDocument();
    });

    it("doesn't show the game over menu while the game is in progress", () => {
      // Arrange
      mockHandler({ state: gameState("in_progress") });

      // Act
      render(<LiveGame game={game()} />);

      // Assert
      expect(screen.queryByText("Game over")).not.toBeInTheDocument();
    });
  });

  describe("connection menu", () => {
    it.each<ConnectionStatus>(["reconnecting", "disconnected"])(
      "shows the connection menu when %s",
      (connectionStatus) => {
        // Arrange
        mockHandler({ state: gameState("in_progress"), connectionStatus });

        // Act
        render(<LiveGame game={game()} />);

        // Assert
        expect(screen.getByText("Connection menu")).toBeInTheDocument();
      },
    );

    it.each<ConnectionStatus>(["connecting", "connected"])(
      "doesn't show the connection menu when %s",
      (connectionStatus) => {
        // Arrange
        mockHandler({ state: gameState("in_progress"), connectionStatus });

        // Act
        render(<LiveGame game={game()} />);

        // Assert
        expect(screen.queryByText("Connection menu")).not.toBeInTheDocument();
      },
    );
  });
});
