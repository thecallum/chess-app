import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTimer } from "../hooks/use-timer";
import type { GameStateMessage } from "../lib/game-connection";
import { GameTimer } from "./game-timer";

vi.mock("../hooks/use-timer");

const state: GameStateMessage = {
  gameId: "g1",
  status: "in_progress",
  gameState: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  currentMove: 3,
  whiteTimeRemainingMs: 300_000,
  blackTimeRemainingMs: 300_000,
  lastMoveAt: null,
  result: null,
  winner: null,
};

function mockTimer(whiteRunning: boolean) {
  vi.mocked(useTimer).mockReturnValue({
    white: { ms: 754_900, running: whiteRunning },
    black: { ms: 65_000, running: !whiteRunning },
  });
}

describe("GameTimer", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockTimer(true);
  });

  it("doesn't show the clocks before the game state arrives", () => {
    // Act
    render(<GameTimer state={undefined} colour="white" />);

    // Assert
    expect(screen.queryByText(/white \(/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/black \(/i)).not.toBeInTheDocument();
  });

  it.each([
    {
      colour: "white" as const,
      white: "White (you)",
      black: "Black (opponent)",
    },
    {
      colour: "black" as const,
      white: "White (opponent)",
      black: "Black (you)",
    },
  ])(
    "labels which clock is the player's ($colour)",
    ({ colour, white, black }) => {
      // Act
      render(<GameTimer state={state} colour={colour} />);

      // Assert
      expect(screen.getByText(white)).toBeInTheDocument();
      expect(screen.getByText(black)).toBeInTheDocument();
    },
  );

  it.each([
    { whiteRunning: true, running: "White (you)", stopped: "Black (opponent)" },
    {
      whiteRunning: false,
      running: "Black (opponent)",
      stopped: "White (you)",
    },
  ])(
    "highlights the running clock ($running)",
    ({ whiteRunning, running, stopped }) => {
      // Arrange
      mockTimer(whiteRunning);

      // Act
      render(<GameTimer state={state} colour="white" />);

      // Assert
      expect(screen.getByText(running).parentElement).toHaveClass("bg-primary");
      expect(screen.getByText(stopped).parentElement).toHaveClass("bg-muted");
    },
  );

  it("shows each player's time left", () => {
    // Act
    render(<GameTimer state={state} colour="white" />);

    // Assert
    expect(useTimer).toHaveBeenCalledWith(state);
    expect(screen.getByText("12:34")).toBeInTheDocument();
    expect(screen.getByText("1:05")).toBeInTheDocument();
  });
});
