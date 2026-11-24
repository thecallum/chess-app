import { ModeButton } from "~/sections/setup/components/mode-button";
import { SetupCard } from "~/sections/setup/components/setup-card";
import { modes } from "~/sections/setup/modes";

// Client-only route: not in the prerender list.
export function meta() {
  return [{ title: "Start a game | Chess" }];
}

export default function PlaySetup() {
  return (
    <SetupCard>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Start a game
      </h1>
      <div className="flex flex-col gap-3">
        {modes
          .filter((option) => option.enabled)
          .map((option) => (
            <ModeButton key={option.id} option={option} />
          ))}
      </div>
      <section
        aria-labelledby="coming-soon"
        className="flex flex-col gap-3 pt-4 sm:pt-6"
      >
        <h2
          id="coming-soon"
          className="text-sm font-medium text-muted-foreground uppercase"
        >
          Coming soon
        </h2>
        {modes
          .filter((option) => !option.enabled)
          .map((option) => (
            <ModeButton key={option.id} option={option} />
          ))}
      </section>
    </SetupCard>
  );
}
