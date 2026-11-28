import { HubConnectionBuilder } from "@microsoft/signalr";
import type { Colour, GameStatus } from "~/lib/api";
import type { MoveIntent } from "../components/chess-board";
import { toLongNotation } from "./long-notation";

export type GameStateMessage = {
  gameId: string;
  status: GameStatus;
  gameState: string;
  currentMove: number;
  whiteTimeRemainingMs: number;
  blackTimeRemainingMs: number;
  lastMoveAt: string | null;
  result: string | null;
  winner: Colour | null;
};

export type ConnectionStatus =
  "connecting" | "connected" | "reconnecting" | "disconnected";

export type GameConnection = {
  start(): Promise<void>;
  stop(): Promise<void>;
  sendMove(currentMove: number, intent: MoveIntent): Promise<void>;
  onGameState(handler: (state: GameStateMessage) => void): void;
  onStatusChange(handler: (status: ConnectionStatus) => void): void;
};

export function createGameConnection(gameId: string): GameConnection {
  const connection = new HubConnectionBuilder()
    .withUrl("/api/hubs/game")
    .withAutomaticReconnect()
    .build();
  connection.serverTimeoutInMilliseconds = 10_000;

  const joinGame = () => connection.invoke("ConnectToGame", gameId);

  connection.onreconnected(() => {
    joinGame().catch(console.error);
  });

  return {
    async start() {
      await connection.start();
      joinGame().catch(console.error);
    },
    stop: () => connection.stop(),
    async sendMove(currentMove, intent) {
      await connection.invoke(
        "SendMove",
        gameId,
        currentMove,
        toLongNotation(intent),
      );
    },
    onGameState(handler) {
      connection.on("GameState", (next: GameStateMessage) => {
        if (next.gameId === gameId) handler(next);
      });
    },
    onStatusChange(handler) {
      connection.onreconnecting(() => handler("reconnecting"));
      connection.onreconnected(() => handler("connected"));
      connection.onclose(() => handler("disconnected"));
    },
  };
}
