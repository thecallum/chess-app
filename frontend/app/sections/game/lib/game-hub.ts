import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";

// Our own seam over SignalR, so components never touch the library directly.
export type MoveMessage = { from: string; to: string; promotion?: string };

// TODO: temporary translation layer. The server currently wants the chess
// library's long notation, like "{e2 - e4}" or "{a7 - a8 - =q}".
const toLongNotation = ({ from, to, promotion }: MoveMessage) =>
  `{${from} - ${to}${promotion ? ` - =${promotion.toLowerCase()}` : ""}}`;

// The only event the server sends: the whole game as this player sees it. It
// comes after connecting, and after every change (a join, a move, the game
// ending), so the page just shows the latest one.
export type GameStateMessage = {
  gameId: string;
  code: string;
  colour: "white" | "black";
  status: "waiting" | "in_progress" | "completed";
  gameState: string; // The position as a FEN string.
  currentMove: number; // The move number the server expects next.
  moves: string[]; // Every move played so far, in order. Not used yet.
  whiteTimeRemainingMs: number; // Milliseconds, as of the last move.
  blackTimeRemainingMs: number; // Milliseconds, as of the last move.
  lastMoveAt: string | null; // ISO time of the last move. Null before the first.
  result: string | null; // How the game ended, like "Checkmate". Null until it has.
  winner: "white" | "black" | null; // Null for a draw or an unfinished game.
};

export type GameHub = {
  ping(): Promise<void>;
  connectToGame(gameId: string): Promise<void>;
  sendMove(gameId: string, move: MoveMessage): Promise<void>;
  onGameState(handler: (state: GameStateMessage) => void): void;
  onPinged(handler: () => void): void;
  onError(handler: (message: string) => void): void;
  onStatusChange(handler: (connected: boolean) => void): void;
  stop(): Promise<void>;
};

export function connectGameHub(): GameHub {
  const connection: HubConnection = new HubConnectionBuilder()
    .withUrl("/api/hubs/game")
    .withAutomaticReconnect()
    .build();

  let statusHandler: (connected: boolean) => void = () => {};
  connection.onreconnecting(() => statusHandler(false));
  connection.onreconnected(() => statusHandler(true));
  connection.onclose(() => statusHandler(false));

  let errorHandler: (message: string) => void = () => {};

  // The game this connection is for. The server can send GameState to a player
  // directly (when their opponent joins), and that reaches every tab they have
  // open, so ignore state for a different game.
  let joinedGameId: string | undefined;
  const isThisGame = (state: GameStateMessage) =>
    !joinedGameId || state.gameId === joinedGameId;

  // The move number sent with each move, so the server can reject a move made
  // on an old position. Always the one from the latest GameState.
  let currentMove: number | undefined;
  connection.on("GameState", (state: GameStateMessage) => {
    if (isThisGame(state)) currentMove = state.currentMove;
  });

  // Only one move is sent at a time, so a double click can't send it twice.
  let moveInFlight = false;

  // Group membership is per connection, so rejoin after a reconnect.
  const rejoin = () =>
    joinedGameId
      ? connection
          .invoke("ConnectToGame", joinedGameId)
          .catch((error: Error) => errorHandler(error.message))
      : Promise.resolve();
  connection.onreconnected(() => void rejoin());

  connection
    .start()
    .then(() => {
      statusHandler(true);
      return rejoin();
    })
    .catch(() => statusHandler(false));

  return {
    async ping() {
      if (connection.state === HubConnectionState.Connected) {
        await connection.invoke("Ping");
      }
    },
    async connectToGame(gameId) {
      joinedGameId = gameId;
      if (connection.state === HubConnectionState.Connected) {
        await connection.invoke("ConnectToGame", gameId);
      }
    },
    async sendMove(gameId, move) {
      if (currentMove === undefined) throw new Error("No game state yet");
      if (moveInFlight) return;
      if (connection.state !== HubConnectionState.Connected) return;

      moveInFlight = true;
      try {
        await connection.invoke(
          "SendMove",
          gameId,
          currentMove,
          toLongNotation(move),
        );
      } catch (error) {
        // The game moved on without us. Ask for the current state again, which
        // resets the board and the move number through GameState.
        if (error instanceof Error && error.message.endsWith("stale_move")) {
          void rejoin();
        }
        throw error;
      } finally {
        moveInFlight = false;
      }
    },
    onGameState: (handler) =>
      connection.on("GameState", (state: GameStateMessage) => {
        if (isThisGame(state)) handler(state);
      }),
    onPinged: (handler) => connection.on("Pinged", handler),
    onError: (handler) => {
      errorHandler = handler;
    },
    onStatusChange: (handler) => {
      statusHandler = handler;
    },
    stop: () => connection.stop(),
  };
}
