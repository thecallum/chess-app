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

export function HowItWorks() {
  return (
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
  );
}
