import { Link } from "react-router";
import { buttonVariants } from "~/components/ui/button";

export function Hero() {
  return (
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
  );
}
