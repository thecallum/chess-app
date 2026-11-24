import { SetupFlow } from "~/sections/setup/setup-flow";

// Client-only route: not in the prerender list.
export function meta() {
  return [{ title: "Start a game | Chess" }];
}

export default function PlaySetup() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-16">
      <div className="flex min-h-[28rem] flex-col gap-6 rounded-2xl border bg-card p-4 text-card-foreground shadow-sm sm:min-h-[36rem] sm:gap-8 sm:p-8">
        <SetupFlow />
      </div>
    </main>
  );
}
