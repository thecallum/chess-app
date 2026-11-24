import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameSection } from "./game-section";
import { useGame } from "./use-game";

vi.mock("./use-game");
// The board talks to the game hub, which isn't what's under test here.
vi.mock("./components/game-board", () => ({
  GameBoard: () => <p>Board</p>,
}));

function renderSection() {
  render(
    <MemoryRouter>
      <GameSection />
    </MemoryRouter>,
  );
}

describe("GameSection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows a loading message while loading", () => {
    // Arrange
    vi.mocked(useGame).mockReturnValue({ state: "loading" });

    // Act
    renderSection();

    // Assert
    expect(screen.getByText(/loading game/i)).toBeInTheDocument();
  });

  it("shows the not found page with a link to set up a game when the game can't be loaded", () => {
    // Arrange
    vi.mocked(useGame).mockReturnValue({ state: "error" });

    // Act
    renderSection();

    // Assert
    expect(
      screen.getByRole("heading", { name: /game not found/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start a game/i })).toHaveAttribute(
      "href",
      "/play/setup",
    );
  });

  it("shows the game when it is found and accessible", () => {
    // Arrange
    vi.mocked(useGame).mockReturnValue({
      state: "ready",
      game: {
        gameId: "g1",
        code: "ABC123",
        role: "host",
        colour: "white",
        status: "waiting",
      },
    });

    // Act
    renderSection();

    // Assert
    expect(
      screen.getByRole("heading", { name: /waiting for your opponent/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Board")).toBeInTheDocument();
  });
});
