import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import type { Mode } from "../modes";

const className =
  "group flex min-h-24 items-center justify-between gap-3 rounded-xl bg-primary p-4 text-left text-primary-foreground outline-none transition hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-accent-1/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale disabled:hover:bg-primary";

function Content({ option }: { option: Mode }) {
  return (
    <>
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
    </>
  );
}

// Enabled modes are links to their setup page. Coming-soon modes stay
// disabled buttons, since a link can't be disabled.
export function ModeButton({ option }: { option: Mode }) {
  if (!option.enabled || !option.path) {
    return (
      <button type="button" disabled className={className}>
        <Content option={option} />
      </button>
    );
  }
  return (
    <Link to={option.path} className={className}>
      <Content option={option} />
    </Link>
  );
}
