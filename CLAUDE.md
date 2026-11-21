# Chess App

A multiplayer web chess app (v1: guests, invite-code games, one time control). Architecture lives in [docs/architecture.md](docs/architecture.md), with working notes in [docs/v1-project-notes.md](docs/v1-project-notes.md). Update the architecture summary when a decision changes.

## Working rules

- **Never commit.** Do not run `git commit`. The user always commits their own changes. Leave work in the working tree. Creating branches is fine. (Enforced in `.claude/settings.json`.)
- **Plan first.** Present a plan and wait for approval before creating or editing project files, unless the user explicitly says to go ahead.

## Stack

- **Backend:** .NET 10 (`backend/`): `ChessApp.Api` (HTTP, WebSockets, and the timeout/cleanup scheduler as a hosted service), `ChessApp.Core` (domain logic, no framework dependencies), plus tests. v1 is a single API instance, so no SignalR backplane and no separate scheduler process.
- **Frontend:** React + TypeScript with Vite and React Router framework mode (`frontend/`). Entirely client-side, with no SSR server. Some routes are pre-rendered to static HTML and hydrated (`ssr: false` plus a `prerender` list). Others are client-only and use the SPA fallback.
- **Local dev and deployment:** Docker and Docker Compose. Postgres is hosted separately in production.

## Principles

- The server is the authority for state, rules and clocks. Clients send move intents.
- Designed for, not built for: v1 runs one API instance, but nothing should prevent more.
- Wrap third-party libraries behind our own interfaces only at seams likely to change (transport, state, rules engine).
- Don't add libraries (EF Core, SignalR, Coravel and so on) until a feature needs them.
