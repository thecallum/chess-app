import { Link } from "react-router";
import { buttonVariants } from "~/components/ui/button";

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

const steps = [
  {
    title: "Create a game",
    description: "Pick your colour and get an invite code.",
  },
  {
    title: "Share the code",
    description: "Send it to a friend. They join with one click.",
  },
  {
    title: "Play",
    description: "Ten minutes each on the clock. No sign-up, no downloads.",
  },
];

export default function Home() {
  return (
    <main className="font-manrope mx-auto flex max-w-3xl flex-col gap-10 px-4 py-8 sm:gap-12 sm:px-6 sm:py-20">
      <section className="flex flex-col gap-4 sm:gap-6">
        <h1 className="font-serif text-5xl leading-[1.05] tracking-tight sm:text-7xl">
          Play chess with a <em className="text-accent-1">friend</em>
        </h1>
        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
          Start a game, share the code and play. No account needed.
        </p>
        <Link
          to="/play/setup"
          className={buttonVariants({
            size: "lg",
            className:
              "h-12 w-full px-6 text-base sm:h-11 sm:w-auto sm:self-start",
          })}
        >
          Start a game
        </Link>
      </section>

      <section aria-labelledby="how-it-works">
        <h2
          id="how-it-works"
          className="mb-4 text-sm font-medium text-muted-foreground uppercase"
        >
          How it works
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-xl border p-4">
              <span className="text-sm font-semibold text-accent-2">
                {index + 1}
              </span>
              <h3 className="mt-1 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
