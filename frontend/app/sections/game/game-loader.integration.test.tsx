import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Game } from "~/lib/api";
import { GameLoader } from "./game-loader";
import {
  AFTER_E4,
  answerWaitingMoves,
  board,
  clickSquare,
  createFakeServer,
  finishMove,
  gameState,
  START,
} from "./integration-helpers";
import { createGameConnection } from "./lib/game-connection";
import { getGameByIdRequest } from "./requests/get-game-by-id-request";

vi.mock("react-chessboard", async () => ({
  Chessboard: (await import("./integration-helpers")).FakeChessboard,
}));
vi.mock("./lib/game-connection");
vi.mock("./requests/get-game-by-id-request");

const game: Game = {
  gameId: "g1",
  code: "ABC123",
  colour: "white",
  status: "in_progress",
};

function renderGamePage() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={["/play/games/g1"]}>
        <Routes>
          <Route path="/play/games/:gameId" element={<GameLoader />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("game page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    board.options = undefined;
  });

  afterEach(async () => {
    answerWaitingMoves();
    await finishMove();
  });

  it("sends the player's move and shows it on the board straight away", async () => {
    // Arrange
    vi.mocked(getGameByIdRequest).mockResolvedValue(game);
    const server = createFakeServer();
    renderGamePage();
    await waitFor(() =>
      expect(createGameConnection).toHaveBeenCalledWith("g1"),
    );
    server.sendState(gameState());
    await waitFor(() => expect(board.options?.position).toBe(START));

    // Act
    clickSquare("e2", "wP");
    clickSquare("e4");

    // Assert
    expect(server.connection.sendMove).toHaveBeenCalledWith(1, {
      from: "e2",
      to: "e4",
    });
    expect(board.options?.position).toBe(AFTER_E4);
  });
});
