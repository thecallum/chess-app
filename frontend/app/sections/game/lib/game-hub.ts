import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";

// Our own seam over SignalR, so components never touch the library directly.
export type MoveMessage = { from: string; to: string; promotion?: string };

export type GameHub = {
  ping(): Promise<void>;
  joinGame(gameId: string): Promise<void>;
  sendMove(gameId: string, move: MoveMessage): Promise<void>;
  onMoveMade(handler: (move: MoveMessage) => void): void;
  onPinged(handler: () => void): void;
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

  // Group membership is per connection, so rejoin after a reconnect.
  let joinedGameId: string | undefined;
  const rejoin = () =>
    joinedGameId
      ? connection.invoke("JoinGame", joinedGameId).catch(() => {})
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
    async joinGame(gameId) {
      joinedGameId = gameId;
      if (connection.state === HubConnectionState.Connected) {
        await connection.invoke("JoinGame", gameId);
      }
    },
    async sendMove(gameId, move) {
      if (connection.state === HubConnectionState.Connected) {
        await connection.invoke("SendMove", gameId, move);
      }
    },
    onMoveMade: (handler) => connection.on("MoveMade", handler),
    onPinged: (handler) => connection.on("Pinged", handler),
    onStatusChange: (handler) => {
      statusHandler = handler;
    },
    stop: () => connection.stop(),
  };
}
