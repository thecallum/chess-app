import { useEffect, useRef, useState } from "react";
import type { MoveIntent } from "../components/chess-board";
import {
  createGameConnection,
  type ConnectionStatus,
  type GameConnection,
  type GameStateMessage,
} from "../lib/game-connection";

export type MoveResult = { ok: true } | { ok: false; error: string };

export const toLongNotation = ({ from, to, promotion }: MoveIntent) =>
  `{${from} - ${to}${promotion ? ` - =${promotion.toLowerCase()}` : ""}}`;

export function useGameSession(gameId: string) {
  const [state, setState] = useState<GameStateMessage>();
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const connectionRef = useRef<GameConnection>(null);

  useEffect(() => {
    // Ignores events from a connection this effect has already stopped.
    let active = true;
    const setStatus = (status: ConnectionStatus) => {
      if (active) setConnectionStatus(status);
    };

    const connection = createGameConnection(gameId);
    connectionRef.current = connection;

    connection.onGameState((next) => {
      if (active) setState(next);
    });
    connection.onStatusChange(setStatus);

    connection.start().then(
      () => setStatus("connected"),
      (error) => {
        console.error(error);
        setStatus("disconnected");
      },
    );

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
      await connection.sendMove(state.currentMove, toLongNotation(intent));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }

  return { state, connectionStatus, move };
}
