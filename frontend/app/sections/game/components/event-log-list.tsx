// A running list of what the game hub has sent and any errors, for debugging.
export function EventLogList({ entries }: { entries: string[] }) {
  return (
    <section aria-labelledby="event-log" className="mt-4 rounded-xl border p-4">
      <h2 id="event-log" className="text-sm font-semibold">
        Event log
      </h2>
      <ol className="mt-2 max-h-48 space-y-1 overflow-y-auto font-mono text-xs break-all">
        {entries.length === 0 ? (
          <li className="text-muted-foreground">No events yet</li>
        ) : (
          entries.map((entry, index) => <li key={index}>{entry}</li>)
        )}
      </ol>
    </section>
  );
}
