import { useState } from "react";
import { Bot, ChevronRight, Globe, Users, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";

// Client-only route: not in the prerender list.
export function meta() {
  return [{ title: "Start a game | Chess" }];
}

const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

type Colour = "white" | "black" | "random";
type ModeId = "friend" | "online" | "computer";

const modes: {
  id: ModeId;
  title: string;
  description: string;
  icon: LucideIcon;
  enabled: boolean;
}[] = [
  {
    id: "friend",
    title: "Play a friend",
    description: "Share an invite code.",
    icon: Users,
    enabled: true,
  },
  {
    id: "online",
    title: "Play online",
    description: "Get matched with someone.",
    icon: Globe,
    enabled: false,
  },
  {
    id: "computer",
    title: "Play the computer",
    description: "Practise against an engine.",
    icon: Bot,
    enabled: false,
  },
];

const colours: { id: Colour; label: string }[] = [
  { id: "white", label: "White" },
  { id: "black", label: "Black" },
  { id: "random", label: "Random" },
];

export default function PlaySetup() {
  const [mode, setMode] = useState<ModeId>();

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-16">
      <div className="flex min-h-[28rem] flex-col gap-6 rounded-2xl border bg-card p-4 text-card-foreground shadow-sm sm:min-h-[36rem] sm:gap-8 sm:p-8">
        {mode === "friend" ? (
          <FriendSetup onBack={() => setMode(undefined)} />
        ) : (
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
        )}
      </div>
    </main>
  );
}

type Mode = (typeof modes)[number];

function ModeButton({
  option,
  onSelect,
}: {
  option: Mode;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!option.enabled}
      onClick={onSelect}
      className="group flex min-h-24 items-center justify-between gap-3 rounded-xl bg-primary p-4 text-left text-primary-foreground outline-none transition hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-accent-1/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale disabled:hover:bg-primary"
    >
      <span className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-1 text-primary">
          <option.icon aria-hidden className="size-5" />
        </span>
        <span className="flex flex-col gap-1">
          <span className="font-semibold">{option.title}</span>
          <span className="text-sm opacity-70">{option.description}</span>
        </span>
      </span>
      <ChevronRight
        aria-hidden
        className="size-5 shrink-0 text-primary-foreground/60 transition-transform group-enabled:group-hover:translate-x-0.5"
      />
    </button>
  );
}

function FriendSetup({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const [colour, setColour] = useState<Colour>("random");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string>();

  function create(e: React.FormEvent) {
    e.preventDefault();
    // Placeholder: the server will create the game and return its id.
    const gameId = crypto.randomUUID();
    void navigate(`/play/games/${gameId}`, { state: { role: "host", colour } });
  }

  function join(e: React.FormEvent) {
    e.preventDefault();
    const value = code.trim().toLowerCase();
    if (!guid.test(value)) {
      setCodeError("That doesn't look like a valid invite code.");
      return;
    }
    // Placeholder: the server will check the code and seat the player.
    void navigate(`/play/games/${value}`, { state: { role: "guest" } });
  }

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="-mx-2 w-fit px-2 py-2 text-sm text-muted-foreground hover:underline"
      >
        ← Back
      </button>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Play a friend
      </h1>

      <form onSubmit={create} className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm font-medium text-muted-foreground uppercase">
            Your colour
          </legend>
          <div className="grid grid-cols-3 gap-3">
            {colours.map((option) => (
              <label
                key={option.id}
                className="flex h-12 cursor-pointer items-center justify-center rounded-xl border font-medium has-checked:border-accent-1 has-checked:bg-accent-1/15 has-checked:ring-1 has-checked:ring-accent-1 has-focus-visible:ring-3 has-focus-visible:ring-accent-1/50"
              >
                <input
                  type="radio"
                  name="colour"
                  value={option.id}
                  checked={colour === option.id}
                  onChange={() => setColour(option.id)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground uppercase">
            Time control
          </span>
          <span>10 minutes each</span>
        </div>

        <Button
          type="submit"
          className="h-12 w-full text-base font-semibold sm:h-11 sm:w-auto sm:self-start sm:px-6"
        >
          Create game
        </Button>
      </form>

      <section
        aria-labelledby="join"
        className="flex flex-col gap-3 border-t pt-6"
      >
        <h2
          id="join"
          className="text-sm font-medium text-muted-foreground uppercase"
        >
          Join with a code
        </h2>
        <form onSubmit={join} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setCodeError(undefined);
            }}
            placeholder="Enter an invite code"
            aria-label="Invite code"
            aria-invalid={codeError ? true : undefined}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="h-12 min-w-0 flex-1 rounded-lg border bg-background px-3 font-mono text-base sm:h-9 sm:text-sm"
          />
          <Button
            type="submit"
            variant="outline"
            className="h-12 text-base sm:h-9 sm:text-sm"
          >
            Join game
          </Button>
        </form>
        {codeError && (
          <p role="alert" className="text-sm text-destructive">
            {codeError}
          </p>
        )}
      </section>
    </>
  );
}
