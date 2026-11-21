import { Link } from "react-router";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-slate-950">
      <div className="mx-auto flex h-14 max-w-3xl items-center px-4 sm:h-16 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900 px-4 py-2 font-mono text-lg font-medium tracking-tight text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
        >
          ChessApp<span className="animate-pulse text-emerald-400">_</span>
        </Link>
      </div>
    </header>
  );
}
