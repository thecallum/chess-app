import { useEffect, useState } from "react";
import { playerTimerIsRunning, timeLeftInMs } from "../lib/clocks";
import type { GameStateMessage } from "../lib/game-connection";

function useTimerInterval(timerIsRunning: boolean) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timerIsRunning) return;

    // When rendering the time left from state, it can look out of sync depending on the devices clock.
    // We run this every 200ms to ensure time left appears in sync

    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, [timerIsRunning]);

  return now;
}

export function useTimer(state: GameStateMessage | undefined) {
  const whiteTimerIsRunning = playerTimerIsRunning(state, "white");
  const blackTimerIsRunning = playerTimerIsRunning(state, "black");

  const now = useTimerInterval(whiteTimerIsRunning || blackTimerIsRunning);

  return {
    white: {
      ms: timeLeftInMs(state, "white", now, whiteTimerIsRunning),
      running: whiteTimerIsRunning,
    },
    black: {
      ms: timeLeftInMs(state, "black", now, blackTimerIsRunning),
      running: blackTimerIsRunning,
    },
  };
}
