import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";

// Our own seam over SignalR, so components never touch the library directly.
export type GameHub = {
  ping(): Promise<void>;
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

  connection
    .start()
    .then(() => statusHandler(true))
    .catch(() => statusHandler(false));

  return {
    async ping() {
      if (connection.state === HubConnectionState.Connected) {
        await connection.invoke("Ping");
      }
    },
    onPinged: (handler) => connection.on("Pinged", handler),
    onStatusChange: (handler) => {
      statusHandler = handler;
    },
    stop: () => connection.stop(),
  };
}
