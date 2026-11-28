import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  gameCompletedMessage,
  gameInProgressMessage,
  headingText,
} from "../lib/game-text";
import { GameStatusBar } from "./game-status-bar";

vi.mock("../lib/game-text");

describe("GameStatusBar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(headingText).mockReturnValue("Your move");
    vi.mocked(gameCompletedMessage).mockReturnValue("Completed message");
    vi.mocked(gameInProgressMessage).mockReturnValue("In progress message");
  });

  it.each([
    { turn: "white" as const, isMyTurn: true },
    { turn: "black" as const, isMyTurn: false },
  ])(
    "shows the heading for the status and whose turn it is ($turn to move)",
    ({ turn, isMyTurn }) => {
      // Act
      render(
        <GameStatusBar
          status="in_progress"
          turn={turn}
          colour="white"
          inCheck={false}
          result={null}
          winner={null}
        />,
      );

      // Assert
      expect(headingText).toHaveBeenCalledWith("in_progress", isMyTurn);
      expect(
        screen.getByRole("heading", { name: "Your move" }),
      ).toBeInTheDocument();
    },
  );

  it("shows the outcome when the game is completed", () => {
    // Act
    render(
      <GameStatusBar
        status="completed"
        turn="white"
        colour="black"
        inCheck={false}
        result="Checkmate"
        winner="white"
      />,
    );

    // Assert
    expect(gameCompletedMessage).toHaveBeenCalledWith(
      "white",
      "black",
      "Checkmate",
    );
    expect(screen.getByText("Completed message")).toBeInTheDocument();
    expect(gameInProgressMessage).not.toHaveBeenCalled();
  });

  it("shows the player's colour when the game is in progress", () => {
    // Act
    render(
      <GameStatusBar
        status="in_progress"
        turn="white"
        colour="black"
        inCheck
        result={null}
        winner={null}
      />,
    );

    // Assert
    expect(gameInProgressMessage).toHaveBeenCalledWith("black", true);
    expect(screen.getByText("In progress message")).toBeInTheDocument();
    expect(gameCompletedMessage).not.toHaveBeenCalled();
  });
});
