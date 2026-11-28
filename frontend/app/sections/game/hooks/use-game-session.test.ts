import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createGameConnection,
  type ConnectionStatus,
  type GameStateMessage,
} from "../lib/game-connection";
import { useGameSession } from "./use-game-session";

vi.mock("../lib/game-connection");

function createFakeConnection() {
  let onGameState: (state: GameStateMessage) => void = () => {};
  let onStatusChange: (status: ConnectionStatus) => void = () => {};
  let resolveStart = () => {};
  let rejectStart: (error: Error) => void = () => {};
  const started = new Promise<void>((resolve, reject) => {
    resolveStart = resolve;
    rejectStart = reject;
  });

  const connection = {
    start: vi.fn(() => started),
    stop: vi.fn(() => Promise.resolve()),
    sendMove: vi.fn(() => Promise.resolve()),
    onGameState: vi.fn((handler) => (onGameState = handler)),
    onStatusChange: vi.fn((handler) => (onStatusChange = handler)),
  };

  return {
    connection,
    resolveStart: () => act(async () => resolveStart()),
    rejectStart: () => act(async () => rejectStart(new Error("failed"))),
    emitState: (state: GameStateMessage) => act(() => onGameState(state)),
    emitStatus: (status: ConnectionStatus) => act(() => onStatusChange(status)),
  };
}

const gameState = (
  overrides: Partial<GameStateMessage> = {},
): GameStateMessage => ({
  gameId: "g1",
  status: "in_progress",
  gameState: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  currentMove: 3,
  whiteTimeRemainingMs: 300_000,
  blackTimeRemainingMs: 300_000,
  lastMoveAt: null,
  result: null,
  winner: null,
  ...overrides,
});

function setup() {
  const fake = createFakeConnection();
  vi.mocked(createGameConnection).mockReturnValue(fake.connection);
  return fake;
}

describe("useGameSession", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("is connecting with no state before the connection starts", () => {
    // Arrange
    setup();

    // Act
    const { result } = renderHook(() => useGameSession("g1"));

    // Assert
    expect(result.current.connectionStatus).toBe("connecting");
    expect(result.current.state).toBeUndefined();
    expect(createGameConnection).toHaveBeenCalledWith("g1");
  });

  it("is connected once the connection starts", async () => {
    // Arrange
    const fake = setup();
    const { result } = renderHook(() => useGameSession("g1"));

    // Act
    await fake.resolveStart();

    // Assert
    expect(result.current.connectionStatus).toBe("connected");
  });

  it("is disconnected when the connection fails to start", async () => {
    // Arrange
    const fake = setup();
    const { result } = renderHook(() => useGameSession("g1"));

    // Act
    await fake.rejectStart();

    // Assert
    expect(result.current.connectionStatus).toBe("disconnected");
  });

  it("updates the state when the server sends one", () => {
    // Arrange
    const fake = setup();
    const { result } = renderHook(() => useGameSession("g1"));
    const next = gameState();

    // Act
    fake.emitState(next);

    // Assert
    expect(result.current.state).toEqual(next);
  });

  it.each<ConnectionStatus>(["reconnecting", "connected", "disconnected"])(
    "follows the connection status when it changes to %s",
    (status) => {
      // Arrange
      const fake = setup();
      const { result } = renderHook(() => useGameSession("g1"));

      // Act
      fake.emitStatus(status);

      // Assert
      expect(result.current.connectionStatus).toBe(status);
    },
  );

  it("stops the connection and ignores later events after unmounting", () => {
    // Arrange
    const fake = setup();
    const { result, unmount } = renderHook(() => useGameSession("g1"));

    // Act
    unmount();
    fake.emitStatus("disconnected");
    fake.emitState(gameState());

    // Assert
    expect(fake.connection.stop).toHaveBeenCalled();
    expect(result.current.connectionStatus).toBe("connecting");
    expect(result.current.state).toBeUndefined();
  });

  it("replaces the connection when the game changes", () => {
    // Arrange
    const first = setup();
    const { rerender } = renderHook(({ gameId }) => useGameSession(gameId), {
      initialProps: { gameId: "g1" },
    });
    setup();

    // Act
    rerender({ gameId: "g2" });

    // Assert
    expect(first.connection.stop).toHaveBeenCalled();
    expect(createGameConnection).toHaveBeenLastCalledWith("g2");
  });

  describe("move", () => {
    it("is not connected before any state arrives", async () => {
      // Arrange
      const fake = setup();
      const { result } = renderHook(() => useGameSession("g1"));

      // Act
      const moveResult = await result.current.move({ from: "e2", to: "e4" });

      // Assert
      expect(moveResult).toEqual({ ok: false, error: "not_connected" });
      expect(fake.connection.sendMove).not.toHaveBeenCalled();
    });

    it("sends the move against the current move number", async () => {
      // Arrange
      const fake = setup();
      const { result } = renderHook(() => useGameSession("g1"));
      fake.emitState(gameState({ currentMove: 7 }));

      // Act
      const moveResult = await result.current.move({ from: "e2", to: "e4" });

      // Assert
      expect(moveResult).toEqual({ ok: true });
      expect(fake.connection.sendMove).toHaveBeenCalledWith(7, {
        from: "e2",
        to: "e4",
      });
    });

    it("returns the error when sending fails", async () => {
      // Arrange
      const fake = setup();
      fake.connection.sendMove.mockRejectedValue(new Error("illegal_move"));
      const { result } = renderHook(() => useGameSession("g1"));
      fake.emitState(gameState());

      // Act
      const moveResult = await result.current.move({ from: "e2", to: "e5" });

      // Assert
      expect(moveResult).toEqual({ ok: false, error: "illegal_move" });
    });
  });
});
