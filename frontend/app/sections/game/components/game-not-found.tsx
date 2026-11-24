import { Link } from "react-router";
import { buttonVariants } from "~/components/ui/button";

export function GameNotFound() {
  return (
    <section className="flex flex-col rounded-xl border p-4 sm:p-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Game not found
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This game does not exist, or you are not one of its players.
      </p>
      <Link
        to="/play/setup"
        className={buttonVariants({
          size: "lg",
          className:
            "mt-4 h-12 w-full px-6 text-base sm:mt-6 sm:h-11 sm:w-auto sm:self-start",
        })}
      >
        Start a game
      </Link>
    </section>
  );
}
