// TEMPORARY: preview of serif and sans font pairs. Delete once one is chosen.
export function meta() {
  return [{ title: "Font pairs | ChessApp" }];
}

// Loaded from Google Fonts for the preview only. The chosen pair will be
// installed as local packages instead.
export function links() {
  return [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossOrigin: "anonymous" as const,
    },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500&family=Inter:wght@400;500&family=DM+Sans:wght@400;500&family=Manrope:wght@400;500&family=Hanken+Grotesk:wght@400;500&family=Newsreader:ital,wght@0,400;1,400&family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Gloock&family=Bodoni+Moda:ital,wght@0,500;1,500&family=Playfair+Display:ital,wght@0,500;1,500&family=Fraunces:ital,wght@0,300;1,300&display=swap",
    },
  ];
}

const pairs: {
  serif: string;
  sans: string;
  weight: number;
  italic: boolean;
}[] = [
  { serif: "Instrument Serif", sans: "Inter", weight: 400, italic: true },
  { serif: "Instrument Serif", sans: "DM Sans", weight: 400, italic: true },
  { serif: "Instrument Serif", sans: "Manrope", weight: 400, italic: true },
  {
    serif: "Instrument Serif",
    sans: "Hanken Grotesk",
    weight: 400,
    italic: true,
  },
  { serif: "Newsreader", sans: "Geist", weight: 400, italic: true },
  { serif: "Cormorant Garamond", sans: "Geist", weight: 500, italic: true },
  { serif: "Gloock", sans: "Geist", weight: 400, italic: false },
  { serif: "Bodoni Moda", sans: "Geist", weight: 500, italic: true },
  { serif: "Playfair Display", sans: "Geist", weight: 500, italic: true },
  { serif: "Fraunces", sans: "Geist", weight: 300, italic: true },
];

export default function DevFonts() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
      <p className="text-sm text-muted-foreground">
        Heading in the serif, everything else in the sans. The header above is
        unchanged.
      </p>
      {pairs.map((pair, index) => (
        <section
          key={pair.serif}
          className="flex flex-col gap-3 rounded-xl border p-5 sm:p-6"
        >
          <p className="text-xs font-medium text-muted-foreground uppercase">
            {index + 1}. {pair.serif} + {pair.sans}
          </p>
          <h2
            className="text-4xl leading-tight tracking-tight sm:text-5xl"
            style={{ fontFamily: `'${pair.serif}'`, fontWeight: pair.weight }}
          >
            Play chess with a {pair.italic ? <em>friend</em> : "friend"}
          </h2>
          <div
            className="flex flex-col gap-3"
            style={{ fontFamily: `'${pair.sans}'` }}
          >
            <p className="text-base text-muted-foreground">
              Start a game, share the code and play. No account needed. Ten
              minutes each on the clock, and no downloads.
            </p>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground">
                Start a game
              </span>
              <span className="text-sm text-muted-foreground">
                1 · Create a game
              </span>
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
