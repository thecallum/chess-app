export function GameNotFound() {
  return (
    <section className="rounded-xl border p-4 sm:p-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Game not found
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This game does not exist, or you are not one of its players.
      </p>
    </section>
  );
}
