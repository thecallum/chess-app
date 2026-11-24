import { useState } from "react";
import { FriendSetup } from "./components/friend-setup";
import { ModeButton } from "./components/mode-button";
import { modes, type ModeId } from "./modes";

// The setup page's content: pick a mode, then that mode's setup.
export function SetupFlow() {
  const [mode, setMode] = useState<ModeId>();

  if (mode === "friend") return <FriendSetup onBack={() => setMode(undefined)} />;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Start a game
      </h1>
      <div className="flex flex-col gap-3">
        {modes
          .filter((option) => option.enabled)
          .map((option) => (
            <ModeButton
              key={option.id}
              option={option}
              onSelect={() => setMode(option.id)}
            />
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
            <ModeButton
              key={option.id}
              option={option}
              onSelect={() => setMode(option.id)}
            />
          ))}
      </section>
    </>
  );
}
