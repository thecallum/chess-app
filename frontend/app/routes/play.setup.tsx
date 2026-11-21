import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { LinkedBoards } from "~/components/linked-boards";
import { Button } from "~/components/ui/button";
import { connectGameHub, type GameHub } from "~/lib/game-hub";

// Client-only route: not in the prerender list.
export function meta() {
  return [{ title: "Game setup | Chess" }];
}

export default function PlaySetup() {
  const hub = useRef<GameHub>(null);
  const [connected, setConnected] = useState(false);
  const [popup, setPopup] = useState(false);

  useEffect(() => {
    const connection = connectGameHub();
    hub.current = connection;
    let timer: ReturnType<typeof setTimeout>;

    connection.onStatusChange(setConnected);
    connection.onPinged(() => {
      setPopup(true);
      clearTimeout(timer);
      timer = setTimeout(() => setPopup(false), 3000);
    });

    return () => {
      clearTimeout(timer);
      void connection.stop();
    };
  }, []);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:gap-6 sm:px-6 sm:py-16">
      <Link
        to="/"
        className="-mx-2 w-fit px-2 py-2 text-sm text-muted-foreground hover:underline"
      >
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Game setup
      </h1>
      <p className="text-sm text-muted-foreground">
        {connected ? "Connected" : "Connecting…"}
      </p>
      <div>
        <Button
          onClick={() => void hub.current?.ping()}
          disabled={!connected}
          className="h-12 w-full text-base sm:h-9 sm:w-auto sm:text-sm"
        >
          Ping
        </Button>
      </div>
      <LinkedBoards />
      {popup && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 rounded-xl border bg-background p-4 text-center font-medium shadow-lg sm:inset-x-auto sm:right-4 sm:w-64"
        >
          Ping
        </div>
      )}
    </main>
  );
}
