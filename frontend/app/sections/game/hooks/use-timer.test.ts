import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { playerTimerIsRunning, timeLeftInMs } from "../lib/clocks";
import type { GameStateMessage } from "../lib/game-connection";
import { useTimer } from "./use-timer";

vi.mock("../lib/clocks");

const START = Date.parse("2026-01-01T12:00:00.000Z");

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

function mockTimersRunning(white: boolean, black: boolean) {
  vi.mocked(playerTimerIsRunning).mockImplementation((_state, player) =>
    player === "white" ? white : black,
  );
}

function renderTimer(state: GameStateMessage | undefined) {
  return renderHook((props) => useTimer(props.state), {
    initialProps: { state },
  });
}

describe("useTimer", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    { white: true, black: false },
    { white: false, black: true },
    { white: false, black: false },
  ])(
    "returns whether each player's timer is running (white: $white, black: $black)",
    ({ white, black }) => {
      // Arrange
      const state = gameState();
      mockTimersRunning(white, black);

      // Act
      const { result } = renderTimer(state);

      // Assert
      expect(playerTimerIsRunning).toHaveBeenCalledWith(state, "white");
      expect(playerTimerIsRunning).toHaveBeenCalledWith(state, "black");
      expect(result.current.white.running).toBe(white);
      expect(result.current.black.running).toBe(black);
    },
  );

  it("doesn't tick when neither player's timer is running", () => {
    // Arrange
    mockTimersRunning(false, false);
    renderTimer(gameState());
    vi.mocked(timeLeftInMs).mockClear();

    // Act
    act(() => vi.advanceTimersByTime(1_000));

    // Assert
    expect(timeLeftInMs).not.toHaveBeenCalled();
  });

  it("updates the time every 200ms while a player's timer is running", () => {
    // Arrange
    const state = gameState();
    mockTimersRunning(true, false);
    renderTimer(state);

    // Act
    act(() => vi.advanceTimersByTime(200));
    const afterOneTick = vi.mocked(timeLeftInMs).mock.lastCall;
    act(() => vi.advanceTimersByTime(200));
    const afterTwoTicks = vi.mocked(timeLeftInMs).mock.lastCall;

    // Assert
    expect(afterOneTick).toEqual([state, "black", START + 200, false]);
    expect(afterTwoTicks).toEqual([state, "black", START + 400, false]);
    expect(timeLeftInMs).toHaveBeenCalledWith(
      state,
      "white",
      START + 400,
      true,
    );
  });

  it("stops ticking when the timer stops", () => {
    // Arrange
    mockTimersRunning(true, false);
    const { rerender } = renderTimer(gameState());
    mockTimersRunning(false, false);
    rerender({ state: gameState({ status: "completed" }) });
    vi.mocked(timeLeftInMs).mockClear();

    // Act
    act(() => vi.advanceTimersByTime(1_000));

    // Assert
    expect(timeLeftInMs).not.toHaveBeenCalled();
  });

  it("returns each player's time left", () => {
    // Arrange
    const state = gameState();
    mockTimersRunning(true, false);
    vi.mocked(timeLeftInMs).mockImplementation((_state, side) =>
      side === "white" ? 120_000 : 90_000,
    );

    // Act
    const { result } = renderTimer(state);

    // Assert
    expect(timeLeftInMs).toHaveBeenCalledWith(state, "white", START, true);
    expect(timeLeftInMs).toHaveBeenCalledWith(state, "black", START, false);
    expect(result.current.white.ms).toBe(120_000);
    expect(result.current.black.ms).toBe(90_000);
  });
});
