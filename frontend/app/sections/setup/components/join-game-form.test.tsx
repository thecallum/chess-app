import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/lib/api";
import { joinGameRequest } from "../requests/join-game-request";
import { JoinGameForm } from "./join-game-form";

vi.mock("../requests/join-game-request");

function renderForm() {
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<JoinGameForm />} />
        <Route path="/play/games/:gameId" element={<p>Game page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("JoinGameForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows an error message when submitted empty", async () => {
    // Arrange
    const user = userEvent.setup();
    renderForm();

    // Act
    await user.click(screen.getByRole("button", { name: /join game/i }));

    // Assert
    expect(screen.getByRole("alert")).toHaveTextContent(
      /enter an invite code/i,
    );
    expect(joinGameRequest).not.toHaveBeenCalled();
  });

  it("redirects to the game page when the request succeeds", async () => {
    // Arrange
    const user = userEvent.setup();
    vi.mocked(joinGameRequest).mockResolvedValue({
      gameId: "g1",
      code: "ABC123",
      role: "guest",
      colour: "white",
      status: "in_progress",
    });
    renderForm();

    // Act
    await user.type(screen.getByLabelText(/invite code/i), "ABC123");
    await user.click(screen.getByRole("button", { name: /join game/i }));

    // Assert
    expect(joinGameRequest).toHaveBeenCalledWith("ABC123");
    expect(await screen.findByText("Game page")).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    // Arrange
    const user = userEvent.setup();
    vi.mocked(joinGameRequest).mockRejectedValue(
      new ApiError(404, "invalid_code"),
    );
    renderForm();

    // Act
    await user.type(screen.getByLabelText(/invite code/i), "NOPE");
    await user.click(screen.getByRole("button", { name: /join game/i }));

    // Assert
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /invite code doesn't exist/i,
    );
  });
});
