import type { ReactNode } from "react";

export function MenuDialog({
  labelledBy,
  children,
}: {
  labelledBy: string;
  children: ReactNode;
}) {
  return (
    // z-[60] puts it above the sticky site header (z-50).
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="flex w-full flex-col gap-3 rounded-xl border bg-background p-6 text-center shadow-lg sm:max-w-sm"
      >
        {children}
      </section>
    </div>
  );
}
