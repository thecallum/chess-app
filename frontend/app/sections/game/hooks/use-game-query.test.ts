import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Game } from "~/lib/api";
import { getGameByIdRequest } from "../requests/get-game-by-id-request";
import { useGameQuery } from "./use-game-query";

vi.mock("../requests/get-game-by-id-request");

function renderQuery(gameId: string | undefined) {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return renderHook(() => useGameQuery(gameId), { wrapper });
}

describe("useGameQuery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("requests the game when there is a game id", async () => {
    // Arrange
    const game: Game = {
      gameId: "g1",
      code: "ABC123",
      colour: "white",
      status: "in_progress",
    };
    vi.mocked(getGameByIdRequest).mockResolvedValue(game);

    // Act
    const { result } = renderQuery("g1");

    // Assert
    await waitFor(() => expect(result.current.data).toBe(game));
    expect(getGameByIdRequest).toHaveBeenCalledWith("g1");
  });

  it("doesn't request anything when there is no game id", () => {
    // Act
    const { result } = renderQuery(undefined);

    // Assert
    expect(getGameByIdRequest).not.toHaveBeenCalled();
    expect(result.current.isPending).toBe(true);
  });
});
