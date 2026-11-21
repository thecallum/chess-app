import { Link } from "react-router";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-primary">
      <div className="mx-auto flex h-14 max-w-3xl items-center px-4 sm:h-16 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-4 py-2 font-mono text-lg font-medium tracking-tight text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          ChessApp<span className="animate-pulse text-accent-1">_</span>
        </Link>
      </div>
    </header>
  );
}
