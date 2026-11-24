import { GameSection } from "~/sections/game/game-section";

// Client-only route: not in the prerender list.
export function meta() {
  return [{ title: "Game | Chess" }];
}

export default function PlayGame() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-16">
      <GameSection />
    </main>
  );
}
