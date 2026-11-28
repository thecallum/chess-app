import { describe, expect, it } from "vitest";
import type { Colour } from "~/lib/api";
import { playerTimerIsRunning, timeLeftInMs } from "./clocks";
import type { GameStateMessage } from "./game-connection";

const LAST_MOVE_AT = "2026-01-01T12:00:00.000Z";
const TEN_SECONDS_LATER = Date.parse(LAST_MOVE_AT) + 10_000;

const gameState = (
  overrides: Partial<GameStateMessage> = {},
): GameStateMessage => ({
  gameId: "g1",
  status: "in_progress",
  gameState: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  currentMove: 3,
  whiteTimeRemainingMs: 300_000,
  blackTimeRemainingMs: 200_000,
  lastMoveAt: LAST_MOVE_AT,
  result: null,
  winner: null,
  ...overrides,
});

describe("playerTimerIsRunning", () => {
  it.each<Colour>(["white", "black"])(
    "is false for %s before the game state arrives",
    (player) => {
      // Act
      const isRunning = playerTimerIsRunning(undefined, player);

      // Assert
      expect(isRunning).toBe(false);
    },
  );

  it.each<Colour>(["white", "black"])(
    "is false for %s once the game is completed",
    (player) => {
      // Arrange
      const state = gameState({ status: "completed" });

      // Act
      const isRunning = playerTimerIsRunning(state, player);

      // Assert
      expect(isRunning).toBe(false);
    },
  );

  it.each<Colour>(["white", "black"])(
    "is false for %s before white's first move",
    (player) => {
      // Arrange
      const state = gameState({ currentMove: 1 });

      // Act
      const isRunning = playerTimerIsRunning(state, player);

      // Assert
      expect(isRunning).toBe(false);
    },
  );

  it.each<[number, Colour, boolean]>([
    [3, "white", true],
    [3, "black", false],
    [2, "white", false],
    [2, "black", true],
  ])(
    "on move %i, is %s's timer running: %s",
    (currentMove, player, expected) => {
      // Arrange
      const state = gameState({ currentMove });

      // Act
      const isRunning = playerTimerIsRunning(state, player);

      // Assert
      expect(isRunning).toBe(expected);
    },
  );
});

describe("timeLeftInMs", () => {
  it("is 0 before the game state arrives", () => {
    // Act
    const ms = timeLeftInMs(undefined, "white", TEN_SECONDS_LATER, false);

    // Assert
    expect(ms).toBe(0);
  });

  it.each<[Colour, number]>([
    ["white", 300_000],
    ["black", 200_000],
  ])(
    "shows %s's stored time when their timer isn't running",
    (side, stored) => {
      // Arrange
      const state = gameState();

      // Act
      const ms = timeLeftInMs(state, side, TEN_SECONDS_LATER, false);

      // Assert
      expect(ms).toBe(stored);
    },
  );

  it("shows the stored time when there is no last move time", () => {
    // Arrange
    const state = gameState({ lastMoveAt: null });

    // Act
    const ms = timeLeftInMs(state, "white", TEN_SECONDS_LATER, true);

    // Assert
    expect(ms).toBe(300_000);
  });

  it("takes the time since the last move off a running timer", () => {
    // Arrange
    const state = gameState();

    // Act
    const ms = timeLeftInMs(state, "black", TEN_SECONDS_LATER, true);

    // Assert
    expect(ms).toBe(190_000);
  });

  it("never goes below 0", () => {
    // Arrange
    const state = gameState({ whiteTimeRemainingMs: 5_000 });

    // Act
    const ms = timeLeftInMs(state, "white", TEN_SECONDS_LATER, true);

    // Assert
    expect(ms).toBe(0);
  });
});
