// One player's clock, shown as a bar above or below the board. Only shows the
// time; GameBoard counts it down. Times are in milliseconds.
export function PlayerClock({
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
