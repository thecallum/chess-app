import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { useEffect, useRef, useState } from "react";
import type { Colour, GameStatus } from "~/lib/api";
import type { MoveIntent } from "../components/chess-board";

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

export type MoveResult = { ok: true } | { ok: false; error: string };

const toLongNotation = ({ from, to, promotion }: MoveIntent) =>
  `{${from} - ${to}${promotion ? ` - =${promotion.toLowerCase()}` : ""}}`;

export type ConnectionStatus =
  "connecting" | "connected" | "reconnecting" | "disconnected";

export function useGameSession(gameId: string) {
  const [state, setState] = useState<GameStateMessage>();
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const connectionRef = useRef<HubConnection>(null);

  useEffect(() => {
    // Ignores events from a connection this effect has already stopped.
    let active = true;
    const setStatus = (status: ConnectionStatus) => {
      if (active) setConnectionStatus(status);
    };

    const connection = new HubConnectionBuilder()
      .withUrl("/api/hubs/game")
      .withAutomaticReconnect()
      .build();
    connection.serverTimeoutInMilliseconds = 10_000;
    connectionRef.current = connection;

    connection.on("GameState", (next: GameStateMessage) => {
      if (next.gameId === gameId) setState(next);
    });

    connection.onreconnecting(() => setStatus("reconnecting"));

    connection.onreconnected(() => {
      setStatus("connected");
      connection.invoke("ConnectToGame", gameId).catch(console.error);
    });

    connection.onclose(() => setStatus("disconnected"));

    async function connect() {
      try {
        await connection.start();
      } catch (error) {
        console.error(error);
        setStatus("disconnected");
        return;
      }
      setStatus("connected");
      await connection.invoke("ConnectToGame", gameId).catch(console.error);
    }

    void connect();

    return () => {
      active = false;
      connectionRef.current = null;
      void connection.stop();
    };
  }, [gameId]);

  async function move(intent: MoveIntent): Promise<MoveResult> {
    const connection = connectionRef.current;
    if (!state || !connection) return { ok: false, error: "not_connected" };

    try {
      await connection.invoke(
        "SendMove",
        gameId,
        state.currentMove,
        toLongNotation(intent),
      );
      return { ok: true };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }

  return { state, connectionStatus, move };
}
