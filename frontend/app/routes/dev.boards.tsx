import { Link } from "react-router";
import { ChessBoard } from "~/components/chess-board";
import { boardThemes } from "~/lib/board-themes";

// Client-only dev page: compares board styles built from the site theme.
export function meta() {
  return [{ title: "Board styles | Chess" }];
}

// A game in progress, so the pieces and notation are visible.
const fen =
  "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4";

export default function DevBoards() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-16">
      <Link
        to="/"
        className="-mx-2 w-fit px-2 py-2 text-sm text-muted-foreground hover:underline"
      >
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Board styles
      </h1>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {boardThemes.map((theme) => (
          <div key={theme.name} className="flex flex-col gap-2">
            <ChessBoard
              title={theme.name}
              fen={fen}
              active={false}
              theme={theme}
              onMove={() => {}}
            />
            <p className="text-sm text-muted-foreground">{theme.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
