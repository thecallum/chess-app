import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { useEffect, useRef, useState } from "react";
import type { MoveIntent } from "./components/chess-board";

export type GameStateMessage = {
  gameId: string;
  code: string;
  colour: "white" | "black";
  status: "waiting" | "in_progress" | "completed";
  gameState: string; 
  currentMove: number; 
  moves: string[]; 
  whiteTimeRemainingMs: number; 
  blackTimeRemainingMs: number; 
  lastMoveAt: string | null; 
  result: string | null; 
  winner: "white" | "black" | null; 
};

export type MoveResult = { ok: true } | { ok: false; error: string };

const toLongNotation = ({ from, to, promotion }: MoveIntent) =>
  `{${from} - ${to}${promotion ? ` - =${promotion.toLowerCase()}` : ""}}`;

export function useGameSession(gameId: string) {
  const [state, setState] = useState<GameStateMessage>();
  const connectionRef = useRef<HubConnection>(null);

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl("/api/hubs/game")
      .withAutomaticReconnect()
      .build();
    connectionRef.current = connection;

    connection.on("GameState", (next: GameStateMessage) => {
      if (next.gameId === gameId) setState(next);
    });

    connection
      .start()
      .then(() => connection.invoke("ConnectToGame", gameId))
      .catch(console.error);

    return () => {
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

  return { state, move };
}
