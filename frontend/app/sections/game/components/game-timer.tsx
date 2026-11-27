import { PlayerClock } from "./game-clocks";
import type { GameStateMessage } from "../use-game-session";
import { useTimer } from "../use-timer";

export function GameTimer({
  state,
  colour,
}: {
  state: GameStateMessage | undefined;
  colour: GameStateMessage["colour"];
}) {
  const timer = useTimer(state);

  // Before GameState arrives, an empty bar of the same height keeps the layout still.
  const clockFor = (side: "white" | "black") =>
    state ? (
      <PlayerClock
        label={`${side === "white" ? "White" : "Black"} (${side === colour ? "you" : "opponent"})`}
        ms={timer[side].ms}
        running={timer[side].running}
      />
    ) : (
      <div className="h-12" />
    );

  return (
    <div className="grid grid-cols-2 gap-2">
      {clockFor("white")}
      {clockFor("black")}
    </div>
  );
}
