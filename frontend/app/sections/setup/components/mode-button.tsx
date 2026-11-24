import { ChevronRight } from "lucide-react";
import type { Mode } from "../modes";

export function ModeButton({
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
