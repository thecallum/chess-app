import { beforeEach, describe, expect, it, vi } from "vitest";
import { request, type Game } from "~/lib/api";
import { getGameByIdRequest } from "./get-game-by-id-request";

vi.mock("~/lib/api");

describe("getGameByIdRequest", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("gets the game from /games/:id and returns it", async () => {
    // Arrange
    const game: Game = {
      gameId: "g1",
      code: "ABC123",
      colour: "white",
      status: "in_progress",
    };
    vi.mocked(request).mockResolvedValue(game);

    // Act
    const result = await getGameByIdRequest("g1");

    // Assert
    expect(request).toHaveBeenCalledWith("/games/g1");
    expect(result).toBe(game);
  });
});
