import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { outcomeText, resultText } from "../lib/game-text";
import { GameOverMenu } from "./game-over-menu";

vi.mock("../lib/game-text");

function renderMenu() {
  render(
    <MemoryRouter>
      <GameOverMenu result="Checkmate" winner="white" colour="black" />
    </MemoryRouter>,
  );
}

describe("GameOverMenu", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(outcomeText).mockReturnValue("Outcome");
    vi.mocked(resultText).mockReturnValue("result");
  });

  it("shows the outcome, how the game ended and a link to a new game", () => {
    // Act
    renderMenu();

    // Assert
    expect(
      screen.getByRole("dialog", { name: /game over/i }),
    ).toBeInTheDocument();
    expect(outcomeText).toHaveBeenCalledWith("white", "black");
    expect(resultText).toHaveBeenCalledWith("Checkmate");
    expect(screen.getByText("Outcome")).toBeInTheDocument();
    expect(screen.getByText("By result")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /new game/i })).toHaveAttribute(
      "href",
      "/play/setup",
    );
  });

  it("closes when View board is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    renderMenu();

    // Act
    await user.click(screen.getByRole("button", { name: /view board/i }));

    // Assert
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
