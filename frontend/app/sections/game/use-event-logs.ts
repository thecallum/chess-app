import { useCallback, useState } from "react";

// The event log's entries, each stamped with the time it was added.
export function useEventLogs() {
  const [eventLogs, setEventLogs] = useState<string[]>([]);

  // Stable, so effects can depend on it without re-running.
  const addLog = useCallback(
    (text: string) =>
      setEventLogs((current) => [
        ...current,
        `${new Date().toLocaleTimeString()}  ${text}`,
      ]),
    [],
  );

  return { eventLogs, addLog };
}
