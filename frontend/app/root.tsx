import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import instrumentSerif from "@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2?url";
import instrumentSerifItalic from "@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2?url";
import jetbrainsMono from "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?url";
import manrope from "@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2?url";
import { Header } from "./components/header";
import type { Route } from "./+types/root";
import "./app.css";

// Preload the fonts used above the fold, so they download with the CSS and the
// page doesn't flash a fallback font first. Only the latin subsets are listed.
export const links: Route.LinksFunction = () =>
  [instrumentSerif, instrumentSerifItalic, jetbrainsMono, manrope].map(
    (href) => ({
      rel: "preload",
      href,
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    }),
  );

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Header />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // One client for the whole app. In state so it survives re-renders.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-16">
      <h1 className="text-2xl font-semibold">{message}</h1>
      <p className="mt-2 text-muted-foreground">{details}</p>
      {stack && (
        <pre className="mt-4 overflow-x-auto rounded-xl border p-4 text-sm">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
