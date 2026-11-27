// Both players' clocks. Only shows the times; GameBoard counts them down.
// Times are in milliseconds.
export function GameClocks({
  white,
  black,
  running,
}: {
  white: number;
  black: number;
  running: "white" | "black" | null;
}) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2">
      <Clock label="White" ms={white} running={running === "white"} />
      <Clock label="Black" ms={black} running={running === "black"} />
    </div>
  );
}

function Clock({
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
      className={`rounded-xl border p-3 ${running ? "bg-primary text-primary-foreground" : "bg-muted"}`}
    >
      <p className="text-xs font-semibold">{label}</p>
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
