import { act } from "@testing-library/react";
import type { ChessboardOptions } from "react-chessboard";
import { vi } from "vitest";
import {
  createGameConnection,
  type ConnectionStatus,
  type GameStateMessage,
} from "./lib/game-connection";

// Shared by the game section's integration tests. Each test file still mocks
// "react-chessboard" (with FakeChessboard) and "./lib/game-connection" itself,
// because vi.mock only applies to the file that calls it.

export const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
export const AFTER_E4 =
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
export const AFTER_E4_E5 =
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
export const AFTER_E4_E5_NF3 =
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2";
// 1. f3 e6 2. e4 Qh4+
export const WHITE_IN_CHECK =
  "rnb1kbnr/pppp1ppp/4p3/8/4P2q/5P2/PPPP2PP/RNBQKBNR w KQkq - 1 3";
// 1. f3 e5 2. g4 Qh4#
export const FOOLS_MATE =
  "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";

export const gameState = (
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

// The options the app last passed to the board.
export const board = {
  options: undefined as ChessboardOptions | undefined,
};

// Stands in for react-chessboard: records its options and renders nothing.
export function FakeChessboard({ options }: { options: ChessboardOptions }) {
  board.options = options;
  return null;
}

export const clickSquare = (square: string, pieceType?: string) =>
  act(() =>
    board.options?.onSquareClick?.({
      square,
      piece: pieceType ? { pieceType } : null,
    }),
  );

export const dropPiece = (pieceType: string, from: string, to: string) =>
  act(() =>
    board.options?.onPieceDrop?.({
      piece: { pieceType, position: from, isSparePiece: false },
      sourceSquare: from,
      targetSquare: to,
    }),
  );

// React groups pending async transitions, so a move left waiting would hold
// up the next test's moves. Each test answers any it leaves behind.
let unansweredMoves: (() => void)[] = [];

export function answerWaitingMoves() {
  unansweredMoves.forEach((resolve) => resolve());
  unansweredMoves = [];
}

// Lets the move's transition finish once the server has replied.
export const finishMove = () => act(async () => {});

// Stands in for the server: tests send it states and statuses, and read the
// moves sent to it. Moves wait until the test calls confirmMove.
export function createFakeServer() {
  let sendState: (state: GameStateMessage) => void = () => {};
  let sendStatus: (status: ConnectionStatus) => void = () => {};

  const connection = {
    start: vi.fn(() => Promise.resolve()),
    stop: vi.fn(() => Promise.resolve()),
    sendMove: vi.fn(
      () => new Promise<void>((resolve) => unansweredMoves.push(resolve)),
    ),
    onGameState: vi.fn((handler) => (sendState = handler)),
    onStatusChange: vi.fn((handler) => (sendStatus = handler)),
  };
  vi.mocked(createGameConnection).mockReturnValue(connection);

  return {
    connection,
    sendState: (state: GameStateMessage) => act(() => sendState(state)),
    sendStatus: (status: ConnectionStatus) => act(() => sendStatus(status)),
    // Like the real server: sends the new state, then answers the move.
    confirmMove: async (state: GameStateMessage) => {
      act(() => sendState(state));
      answerWaitingMoves();
      await finishMove();
    },
  };
}
