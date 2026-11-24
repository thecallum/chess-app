import { Hero } from "~/sections/home/components/hero";
import { HowItWorks } from "~/sections/home/components/how-it-works";

// Pre-rendered at build time, so this is real HTML before any JavaScript runs.
export function meta() {
  return [
    { title: "Chess | Play a friend online" },
    {
      name: "description",
      content:
        "Play a game of chess with a friend online. No account needed: just share an invite code.",
    },
  ];
}

export default function Home() {
  return (
    <>
      {/* Homepage-only background (see .bg-board in app.css). */}
      <div aria-hidden className="bg-board" />
      <main className="font-manrope mx-auto flex max-w-3xl flex-col gap-10 px-4 py-8 sm:gap-12 sm:px-6 sm:py-20">
        <Hero />
        <HowItWorks />
      </main>
    </>
  );
}
