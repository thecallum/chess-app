import type { Colour } from "~/lib/api";
import type { GameStateMessage } from "../use-game-session";
import { useTimer } from "../use-timer";

export function GameTimer({
  state,
  colour,
}: {
  state: GameStateMessage | undefined;
  colour: Colour;
}) {
  const timer = useTimer(state);

  // Before GameState arrives, empty bars of the same height keep the layout still.
  if (!state) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div className="h-12" />
        <div className="h-12" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <PlayerClock
        label={`White (${colour === "white" ? "you" : "opponent"})`}
        ms={timer.white.ms}
        running={timer.white.running}
      />
      <PlayerClock
        label={`Black (${colour === "black" ? "you" : "opponent"})`}
        ms={timer.black.ms}
        running={timer.black.running}
      />
    </div>
  );
}

// One player's clock, shown as a bar above or below the board. Only shows the
// time; GameTimer counts it down. Times are in milliseconds.
function PlayerClock({
  label,
  ms,
  running,
}: {
  label: string;
  ms: number;
  running: boolean;
}) {
  return (
    <div
      className={`flex h-12 items-center justify-between rounded-xl border px-3 ${running ? "bg-primary text-primary-foreground" : "bg-muted"}`}
    >
      <p className="text-sm font-semibold">{label}</p>
      <p className="font-mono text-2xl tabular-nums" aria-live="off">
        {formatTime(ms)}
      </p>
    </div>
  );
}

// 754_900 => "12:34". Whole seconds, rounded down.
function formatTime(ms: number) {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
