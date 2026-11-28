import { describe, expect, it } from "vitest";
import type { Colour, GameStatus } from "~/lib/api";
import {
  gameCompletedMessage,
  gameInProgressMessage,
  headingText,
  outcomeText,
  resultText,
} from "./game-text";

describe("headingText", () => {
  it.each<[GameStatus, boolean, string]>([
    ["waiting", true, "Waiting for your opponent"],
    ["completed", true, "Game over"],
    ["in_progress", true, "Your move"],
    ["in_progress", false, "Opponent's move"],
  ])("when %s and isMyTurn is %s, shows %s", (status, isMyTurn, expected) => {
    // Act
    const text = headingText(status, isMyTurn);

    // Assert
    expect(text).toBe(expected);
  });
});

describe("outcomeText", () => {
  it.each<[Colour | null, Colour, string]>([
    [null, "white", "Draw"],
    ["white", "white", "White wins (you)"],
    ["white", "black", "White wins"],
    ["black", "black", "Black wins (you)"],
    ["black", "white", "Black wins"],
  ])(
    "when the winner is %s and the player is %s, shows %s",
    (winner, colour, expected) => {
      // Act
      const text = outcomeText(winner, colour);

      // Assert
      expect(text).toBe(expected);
    },
  );
});

describe("resultText", () => {
  it.each([
    ["Checkmate", "checkmate"],
    ["Stalemate", "stalemate"],
    ["InsufficientMaterial", "insufficient material"],
    ["FiftyMoveRule", "fifty-move rule"],
    ["Repetition", "repetition"],
    ["Timeout", "timeout"],
  ])("shows %s as %s", (result, expected) => {
    // Act
    const text = resultText(result);

    // Assert
    expect(text).toBe(expected);
  });

  it("shows an unknown result as it is", () => {
    // Act
    const text = resultText("Resignation");

    // Assert
    expect(text).toBe("Resignation");
  });
});

describe("gameCompletedMessage", () => {
  it("shows the outcome and how the game ended", () => {
    // Act
    const text = gameCompletedMessage("white", "white", "Checkmate");

    // Assert
    expect(text).toBe("White wins (you) · checkmate");
  });

  it("shows only the outcome when there is no result", () => {
    // Act
    const text = gameCompletedMessage(null, "white", null);

    // Assert
    expect(text).toBe("Draw");
  });
});

describe("gameInProgressMessage", () => {
  it("shows which colour the player is playing", () => {
    // Act
    const text = gameInProgressMessage("black", false);

    // Assert
    expect(text).toBe("You are playing black");
  });

  it("adds check when the side to move is in check", () => {
    // Act
    const text = gameInProgressMessage("white", true);

    // Assert
    expect(text).toBe("You are playing white · Check");
  });
});
