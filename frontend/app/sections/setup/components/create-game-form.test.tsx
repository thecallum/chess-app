import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/lib/api";
import { createGameRequest } from "../requests/create-game-request";
import { CreateGameForm } from "./create-game-form";

vi.mock("../requests/create-game-request");

function renderForm() {
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<CreateGameForm />} />
        <Route path="/play/games/:gameId" element={<p>Game page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CreateGameForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows an error message when the request is rejected", async () => {
    // Arrange
    const user = userEvent.setup();
    vi.mocked(createGameRequest).mockRejectedValue(
      new ApiError(400, "invalid_colour"),
    );
    renderForm();

    // Act
    await user.click(screen.getByRole("button", { name: /create game/i }));

    // Assert
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /couldn't create the game/i,
    );
  });

  it.each([
    { label: "White", colour: "white" },
    { label: "Black", colour: "black" },
    { label: "Random", colour: "random" },
  ])(
    "creates a game with $colour selected and redirects to it",
    async ({ label, colour }) => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(createGameRequest).mockResolvedValue({
        gameId: "g1",
        code: "ABC123",
        colour: "white",
        status: "waiting",
      });
      renderForm();

      // Act
      await user.click(screen.getByLabelText(label));
      await user.click(screen.getByRole("button", { name: /create game/i }));

      // Assert
      expect(createGameRequest).toHaveBeenCalledWith(colour);
      expect(await screen.findByText("Game page")).toBeInTheDocument();
    },
  );
});
