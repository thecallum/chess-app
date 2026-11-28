import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Game, GameStatus } from "~/lib/api";
import type {
  ConnectionStatus,
  GameStateMessage,
} from "../lib/game-connection";
import { useLiveGame } from "./use-live-game";
import { useGameSession, type MoveResult } from "./use-game-session";

vi.mock("./use-game-session");

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AFTER_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
const BLACK_IN_CHECK =
  "rnbqkbnr/ppppp1pp/8/5p1Q/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 1 2";

const game: Game = {
  gameId: "g1",
  code: "ABC123",
  colour: "white",
  status: "in_progress",
};

const gameState = (
  overrides: Partial<GameStateMessage> = {},
): GameStateMessage => ({
  gameId: "g1",
  status: "in_progress",
  gameState: START,
  currentMove: 0,
  whiteTimeRemainingMs: 300_000,
  blackTimeRemainingMs: 300_000,
  lastMoveAt: null,
  result: null,
  winner: null,
  ...overrides,
});

function mockSession({
  state,
  connectionStatus = "connected",
  move = vi.fn(),
}: {
  state?: GameStateMessage;
  connectionStatus?: ConnectionStatus;
  move?: (...args: unknown[]) => Promise<MoveResult>;
}) {
  vi.mocked(useGameSession).mockReturnValue({ state, connectionStatus, move });
}

function deferredMove() {
  let resolve: (result: MoveResult) => void = () => {};
  const move = vi.fn(
    () => new Promise<MoveResult>((resolveMove) => (resolve = resolveMove)),
  );
  return {
    move,
    resolve: (result: MoveResult) => act(async () => resolve(result)),
  };
}

describe("useLiveGame", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("follows the connection status from the session", () => {
    // Arrange
    mockSession({ connectionStatus: "connecting" });
    const { result, rerender } = renderHook(() => useLiveGame(game));

    // Act
    mockSession({ connectionStatus: "reconnecting" });
    rerender();

    // Assert
    expect(result.current.connectionStatus).toBe("reconnecting");
  });

  it("follows the game state from the session", () => {
    // Arrange
    mockSession({ state: gameState() });
    const { result, rerender } = renderHook(() => useLiveGame(game));
    const next = gameState({ gameState: AFTER_E4, currentMove: 1 });

    // Act
    mockSession({ state: next });
    rerender();

    // Assert
    expect(result.current.state).toEqual(next);
    expect(result.current.optimisticState).toEqual(next);
  });

  it("ignores a move before the game state has arrived", () => {
    // Arrange
    const move = vi.fn();
    mockSession({ move });
    const { result } = renderHook(() => useLiveGame(game));

    // Act
    act(() => result.current.play({ from: "e2", to: "e4" }));

    // Assert
    expect(move).not.toHaveBeenCalled();
  });

  it("shows a move straight away and keeps it once the server accepts it", async () => {
    // Arrange
    const { move, resolve } = deferredMove();
    mockSession({ state: gameState(), move });
    const { result, rerender } = renderHook(() => useLiveGame(game));

    // Act
    act(() => result.current.play({ from: "e2", to: "e4" }));
    const shownWhileSending = result.current.optimisticState?.gameState;
    mockSession({
      state: gameState({ gameState: AFTER_E4, currentMove: 1 }),
      move,
    });
    rerender();
    await resolve({ ok: true });

    // Assert
    expect(move).toHaveBeenCalledWith({ from: "e2", to: "e4" });
    expect(shownWhileSending).toBe(AFTER_E4);
    expect(result.current.optimisticState?.gameState).toBe(AFTER_E4);
  });

  it("shows a move straight away and reverts it when the server rejects it", async () => {
    // Arrange
    const { move, resolve } = deferredMove();
    mockSession({ state: gameState(), move });
    const { result } = renderHook(() => useLiveGame(game));

    // Act
    act(() => result.current.play({ from: "e2", to: "e4" }));
    const shownWhileSending = result.current.optimisticState?.gameState;
    await resolve({ ok: false, error: "illegal_move" });

    // Assert
    expect(shownWhileSending).toBe(AFTER_E4);
    expect(result.current.optimisticState?.gameState).toBe(START);
  });

  it.each([
    { fen: START, turn: "white" },
    { fen: AFTER_E4, turn: "black" },
  ])("shows that it is $turn's turn", ({ fen, turn }) => {
    // Arrange
    mockSession({ state: gameState({ gameState: fen }) });

    // Act
    const { result } = renderHook(() => useLiveGame(game));

    // Assert
    expect(result.current.turn).toBe(turn);
  });

  it.each<[boolean, string, string, GameStatus]>([
    [true, "it is their turn", START, "in_progress"],
    [false, "it is the opponent's turn", AFTER_E4, "in_progress"],
    [false, "the game is waiting", START, "waiting"],
    [false, "the game is completed", START, "completed"],
  ])("sets canMove to %s when %s", (canMove, _, fen, status) => {
    // Arrange
    mockSession({ state: gameState({ gameState: fen, status }) });

    // Act
    const { result } = renderHook(() => useLiveGame(game));

    // Assert
    expect(result.current.canMove).toBe(canMove);
  });

  it.each([
    { label: "in check", fen: BLACK_IN_CHECK, inCheck: true },
    { label: "not in check", fen: START, inCheck: false },
  ])("shows when the side to move is $label", ({ fen, inCheck }) => {
    // Arrange
    mockSession({ state: gameState({ gameState: fen }) });

    // Act
    const { result } = renderHook(() => useLiveGame(game));

    // Assert
    expect(result.current.inCheck).toBe(inCheck);
  });
});
