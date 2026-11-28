import { beforeEach, describe, expect, it, vi } from "vitest";
import { request, type Game } from "~/lib/api";
import { joinGameRequest } from "./join-game-request";

vi.mock("~/lib/api");

describe("joinGameRequest", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("posts the code to /games/join and returns the game", async () => {
    // Arrange
    const game: Game = {
      gameId: "g1",
      code: "ABC123",
      colour: "white",
      status: "in_progress",
    };
    vi.mocked(request).mockResolvedValue(game);

    // Act
    const result = await joinGameRequest("ABC123");

    // Assert
    expect(request).toHaveBeenCalledWith("/games/join", {
      method: "POST",
      body: JSON.stringify({ code: "ABC123" }),
    });
    expect(result).toBe(game);
  });
});
