import { useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

// Client-only route: not in the prerender list.
export function meta() {
  return [{ title: "Game setup | Chess" }];
}

export default function PlaySetup() {
  const [result, setResult] = useState<string>();

  async function loadWeather() {
    const response = await fetch("/api/weatherforecast");
    setResult(JSON.stringify(await response.json(), null, 2));
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:gap-6 sm:px-6 sm:py-16">
      <Link
        to="/"
        className="-mx-2 w-fit px-2 py-2 text-sm text-muted-foreground hover:underline"
      >
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Game setup
      </h1>
      <div>
        <Button
          onClick={loadWeather}
          className="h-12 w-full text-base sm:h-9 sm:w-auto sm:text-sm"
        >
          Get weather
        </Button>
      </div>
      {result && (
        <pre className="overflow-x-auto rounded-xl border p-4 text-sm">
          {result}
        </pre>
      )}
    </main>
  );
}
