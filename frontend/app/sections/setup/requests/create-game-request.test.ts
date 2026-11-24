import { beforeEach, describe, expect, it, vi } from "vitest";
import { request, type Game } from "~/lib/api";
import { createGameRequest } from "./create-game-request";

vi.mock("~/lib/api");

describe("createGameRequest", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("posts the chosen colour to /games and returns the game", async () => {
    // Arrange
    const game: Game = {
      gameId: "g1",
      code: "ABC123",
      role: "host",
      colour: "black",
      status: "waiting",
    };
    vi.mocked(request).mockResolvedValue(game);

    // Act
    const result = await createGameRequest("black");

    // Assert
    expect(request).toHaveBeenCalledWith("/games", {
      method: "POST",
      body: JSON.stringify({ colour: "black" }),
    });
    expect(result).toBe(game);
  });
});
