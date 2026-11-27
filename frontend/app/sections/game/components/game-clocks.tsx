// Both players' clocks. Only shows the times; GameBoard counts them down.
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
      <Clock label="White" seconds={white} running={running === "white"} />
      <Clock label="Black" seconds={black} running={running === "black"} />
    </div>
  );
}

function Clock({
  label,
  seconds,
  running,
}: {
  label: string;
  seconds: number;
  running: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${running ? "bg-primary text-primary-foreground" : "bg-muted"}`}
    >
      <p className="text-xs font-semibold">{label}</p>
      <p className="font-mono text-2xl tabular-nums" aria-live="off">
        {formatTime(seconds)}
      </p>
    </div>
  );
}

// 754 => "12:34"
function formatTime(totalSeconds: number) {
  const seconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
