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

// The reverse: the server sends the opponent's move back in the same notation.
const fromLongNotation = (notation: string): MoveMessage | undefined => {
  const match = /^\{([a-h][1-8]) - ([a-h][1-8])(?: - =([qrbn]))?\}$/.exec(
    notation,
  );
  if (!match) return undefined;
  return { from: match[1], to: match[2], promotion: match[3] };
};

// Sent to this connection only, after it connects to a game.
export type GameStateMessage = {
  gameId: string;
  code: string;
  colour: "white" | "black";
  status: "waiting" | "in_progress";
  gameState: string; // The position as a FEN string.
};

// Sent to both players when a move ends the game. Winner is null for a draw.
export type GameOverMessage = { result: string; winner: string | null };

export type GameHub = {
  ping(): Promise<void>;
  connectToGame(gameId: string): Promise<void>;
  sendMove(gameId: string, move: MoveMessage): Promise<void>;
  onGameState(handler: (state: GameStateMessage) => void): void;
  onMoveMade(handler: (move: MoveMessage) => void): void;
  onMoveConfirmed(handler: (move: unknown) => void): void;
  onGameOver(handler: (gameOver: GameOverMessage) => void): void;
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

  // Group membership is per connection, so rejoin after a reconnect.
  let joinedGameId: string | undefined;
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
      if (connection.state === HubConnectionState.Connected) {
        await connection.invoke("SendMove", gameId, toLongNotation(move));
      }
    },
    onGameState: (handler) => connection.on("GameState", handler),
    onMoveMade: (handler) =>
      connection.on("MoveMade", (notation: string) => {
        const move = fromLongNotation(notation);
        if (move) handler(move);
      }),
    onMoveConfirmed: (handler) => connection.on("MoveConfirmed", handler),
    onGameOver: (handler) => connection.on("GameOver", handler),
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
