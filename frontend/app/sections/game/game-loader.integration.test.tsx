import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, waitFor } from "@testing-library/react";
import type { ChessboardOptions } from "react-chessboard";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Game } from "~/lib/api";
import { GameLoader } from "./game-loader";
import {
  createGameConnection,
  type GameStateMessage,
} from "./lib/game-connection";
import { getGameByIdRequest } from "./requests/get-game-by-id-request";

const board = vi.hoisted(() => ({
  options: undefined as ChessboardOptions | undefined,
}));

vi.mock("react-chessboard", () => ({
  Chessboard: ({ options }: { options: ChessboardOptions }) => {
    board.options = options;
    return null;
  },
}));
vi.mock("./lib/game-connection");
vi.mock("./requests/get-game-by-id-request");

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AFTER_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

const game: Game = {
  gameId: "g1",
  code: "ABC123",
  colour: "white",
  status: "in_progress",
};

const gameState = (
  overrides: Partial<GameStateMessage> = {},
): GameStateMessage => ({
  gameId: "g1",
  status: "in_progress",
  gameState: START,
  currentMove: 1,
  whiteTimeRemainingMs: 300_000,
  blackTimeRemainingMs: 300_000,
  lastMoveAt: null,
  result: null,
  winner: null,
  ...overrides,
});

// Stands in for the server: tests send it states and read the moves sent to it.
function createFakeServer() {
  let sendState: (state: GameStateMessage) => void = () => {};

  const connection = {
    start: vi.fn(() => Promise.resolve()),
    stop: vi.fn(() => Promise.resolve()),
    sendMove: vi.fn(() => new Promise<void>(() => {})),
    onGameState: vi.fn((handler) => (sendState = handler)),
    onStatusChange: vi.fn(),
  };
  vi.mocked(createGameConnection).mockReturnValue(connection);

  return {
    connection,
    sendState: (state: GameStateMessage) => act(() => sendState(state)),
  };
}

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

const clickSquare = (square: string, pieceType?: string) =>
  act(() =>
    board.options?.onSquareClick?.({
      square,
      piece: pieceType ? { pieceType } : null,
    }),
  );

describe("game page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    board.options = undefined;
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
