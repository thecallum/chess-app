import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createGameConnection,
  type ConnectionStatus,
  type GameStateMessage,
} from "./game-connection";
import { toLongNotation } from "./long-notation";

const signalr = vi.hoisted(() => ({
  withUrl: vi.fn(),
  withAutomaticReconnect: vi.fn(),
  build: vi.fn(),
}));

vi.mock("@microsoft/signalr", () => ({
  HubConnectionBuilder: class {
    withUrl(url: string) {
      signalr.withUrl(url);
      return this;
    }
    withAutomaticReconnect() {
      signalr.withAutomaticReconnect();
      return this;
    }
    build() {
      return signalr.build();
    }
  },
}));
vi.mock("./long-notation");

type Handler = (...args: unknown[]) => void;

function createFakeHub() {
  const handlers = new Map<string, Handler[]>();
  const register = (event: string) => (handler: Handler) => {
    handlers.set(event, [...(handlers.get(event) ?? []), handler]);
  };

  const hub = {
    serverTimeoutInMilliseconds: 0,
    start: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    stop: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    invoke: vi.fn<(...args: unknown[]) => Promise<unknown>>(() =>
      Promise.resolve(),
    ),
    on: vi.fn((event: string, handler: Handler) => register(event)(handler)),
    onreconnecting: vi.fn(register("reconnecting")),
    onreconnected: vi.fn(register("reconnected")),
    onclose: vi.fn(register("close")),
  };

  return {
    hub,
    emit: (event: string, ...args: unknown[]) =>
      handlers.get(event)?.forEach((handler) => handler(...args)),
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
  const fake = createFakeHub();
  signalr.build.mockReturnValue(fake.hub);
  return { ...fake, connection: createGameConnection("g1") };
}

describe("createGameConnection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("configures the hub connection", () => {
    // Act
    const { hub } = setup();

    // Assert
    expect(signalr.withUrl).toHaveBeenCalledWith("/api/hubs/game");
    expect(signalr.withAutomaticReconnect).toHaveBeenCalled();
    expect(hub.serverTimeoutInMilliseconds).toBe(10_000);
  });

  describe("start", () => {
    it("starts the hub and then joins the game", async () => {
      // Arrange
      const { hub, connection } = setup();

      // Act
      await connection.start();

      // Assert
      expect(hub.start).toHaveBeenCalledBefore(hub.invoke);
      expect(hub.invoke).toHaveBeenCalledWith("ConnectToGame", "g1");
    });

    it("still resolves and logs the error when joining fails", async () => {
      // Arrange
      const { hub, connection } = setup();
      const error = new Error("join_failed");
      hub.invoke.mockRejectedValue(error);

      // Act
      const started = connection.start();

      // Assert
      await expect(started).resolves.toBeUndefined();
      await vi.waitFor(() => expect(console.error).toHaveBeenCalledWith(error));
    });

    it("rejects without joining when the hub fails to start", async () => {
      // Arrange
      const { hub, connection } = setup();
      hub.start.mockRejectedValue(new Error("start_failed"));

      // Act
      const started = connection.start();

      // Assert
      await expect(started).rejects.toThrow("start_failed");
      expect(hub.invoke).not.toHaveBeenCalled();
    });
  });

  it("stops the hub", async () => {
    // Arrange
    const { hub, connection } = setup();

    // Act
    await connection.stop();

    // Assert
    expect(hub.stop).toHaveBeenCalled();
  });

  describe("sendMove", () => {
    it("sends the move in long notation", async () => {
      // Arrange
      const { hub, connection } = setup();
      const intent = { from: "e2", to: "e4" };
      vi.mocked(toLongNotation).mockReturnValue("notation");

      // Act
      await connection.sendMove(7, intent);

      // Assert
      expect(toLongNotation).toHaveBeenCalledWith(intent);
      expect(hub.invoke).toHaveBeenCalledWith("SendMove", "g1", 7, "notation");
    });

    it("rejects when the hub rejects the move", async () => {
      // Arrange
      const { hub, connection } = setup();
      hub.invoke.mockRejectedValue(new Error("illegal_move"));

      // Act
      const sent = connection.sendMove(7, { from: "e2", to: "e5" });

      // Assert
      await expect(sent).rejects.toThrow("illegal_move");
    });
  });

  describe("onGameState", () => {
    it("passes on states for this game", () => {
      // Arrange
      const { emit, connection } = setup();
      const handler = vi.fn();
      connection.onGameState(handler);
      const state = gameState();

      // Act
      emit("GameState", state);

      // Assert
      expect(handler).toHaveBeenCalledWith(state);
    });

    it("ignores states for other games", () => {
      // Arrange
      const { emit, connection } = setup();
      const handler = vi.fn();
      connection.onGameState(handler);

      // Act
      emit("GameState", gameState({ gameId: "g2" }));

      // Assert
      expect(handler).not.toHaveBeenCalled();
    });
  });

  it.each<[string, ConnectionStatus]>([
    ["reconnecting", "reconnecting"],
    ["reconnected", "connected"],
    ["close", "disconnected"],
  ])("reports %s as %s", (event, status) => {
    // Arrange
    const { emit, connection } = setup();
    const handler = vi.fn();
    connection.onStatusChange(handler);

    // Act
    emit(event);

    // Assert
    expect(handler).toHaveBeenCalledWith(status);
  });

  it("joins the game again after reconnecting", () => {
    // Arrange
    const { hub, emit } = setup();

    // Act
    emit("reconnected");

    // Assert
    expect(hub.invoke).toHaveBeenCalledWith("ConnectToGame", "g1");
  });
});
