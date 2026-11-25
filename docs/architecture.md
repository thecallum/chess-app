# Architecture Summary

A short, bulleted summary of the architecture. The working notes and reasoning live in [v1-project-notes.md](v1-project-notes.md). They may drift apart. Update this one when a decision changes.

Last updated: 2026-11-21

## Purpose and scope (v1)
- A multiplayer web chess app: standard rules, two players, guests only.
- Goal: learn to work with AI and make good architecture decisions. Outcome: a working, cheaply hosted product with a written record of the choices.
- In: invite-code games, one time control (10 minutes per player), resign, draw offers, rematch, sound and browser notification on your turn.
- Out: matchmaking queue, AI opponent, accounts, chat, spectating, replays, email or text notifications, presence tracking.

## Quality attributes (ranked)
Ranking not yet confirmed. Current list:
- Cheap to host
- Hosting-provider agnostic (ideally)
- Low latency
- Well tested
- Architecture documented
- Extendable (mainly code architecture)

## Components
- **Browser:** React app, rendered client-side. UI and light client logic only.
- **API instance:** one project laid out as `Controllers/` (HTTP, thin), `UseCases/` (application logic), `Gateways/` (storage and other outside systems, behind interfaces) and `Models/` (domain types). HTTP endpoints, WebSocket game channels and the scheduler service. Validates moves and writes state. One instance in v1. Controllers receive use cases as interfaces through constructor injection, so they can be tested against fakes.
- **Scheduler:** a hosted background service inside the API process (not a separate project). Ends timed-out games and cleans up never-started games. Safe because v1 runs exactly one API instance.
- **Postgres:** all durable state, hosted separately from the app.
- **Backplane (later):** managed Redis or similar, to carry events between API instances.
- Everything except Postgres runs in one Docker image on a cheap VPS, alongside the static frontend files.

## Data
- **games:** colours, owner, clients, board state, last move time, time remaining per player, state (never started, in progress, finished), result, invite code, created time.
- **moves:** history of each move with number and time, for rewinds and replays.
- **game_draw_offer:** many per game, one pending at a time.
- **game_rematch_offer:** one per game.
- Identity is a random GUID in an HttpOnly cookie, referenced by the game rows.
- **Invite code:** 6 characters from an unambiguous alphabet (no 0/O/1/I/L), case-insensitive, valid for 24 hours. Games are stored in Postgres through EF Core (Npgsql) behind `IGamesGateway`, and migrations are applied at startup. Gateway tests run against a throwaway Postgres via Testcontainers, so they need Docker running.

## Key flows
- **Create and join:** session cookie issued by a separate request, then HTTP create returns a code, the opponent joins by code over HTTP, both join the game channel over the socket and receive the current state.
- **Move:** the client sends the move and its move number. In one transaction the server checks turn, move number, game state and clock, validates the move, writes the move and the game, then notifies the opponent.
- **Rejection:** any rejection makes the client resync from the server.
- **Timeout:** the scheduler finds in-progress games where last move time plus time left is in the past, ends them and notifies players.
- **Reconnect or refresh:** rejoin the channel, receive state and history.
- **Draw offer and rematch:** separate tables, one pending offer, withdrawn by the disconnect hook (best effort).
- **Restart:** connections drop, clients reconnect and refetch. Stored state is safe because a move and the game update commit together.

## Decisions
One entry each: what was chosen, why, what was rejected, and what would make me revisit it.

- **Server is the authority.**
  - Why: tamper-resistant, one source of truth, clocks and results decided in one place.
  - Rejected: client-authoritative play.
  - Revisit: if move round-trip latency is unacceptable on real networks.
- **State in Postgres, stateless API processes.**
  - Why: resilient to restarts, allows more instances later.
  - Rejected: holding game state in process memory, and Redis as the main store (extra complexity).
  - Revisit: if traffic outgrows Postgres.
- **Clocks are timestamps, started after the first move.**
  - Why: no per-game timers, nothing depends on open sockets, and a restart can't lose a running clock.
  - Rejected: server timers per game.
  - Revisit: if clock accuracy under lag becomes a complaint.
- **The scheduler runs inside the API process, as a hosted service.** (Changed 2026-11-21: was a separate process.)
  - Why: a separate process would need a SignalR backplane to notify players, which is complexity v1 doesn't need. With one API instance there is one scheduler and no competition for the same work. It can take on queue matching later.
  - Rejected: a separate scheduler project and process (needs the backplane), and clients asking the server about timeouts as the only trigger.
  - Revisit: when a second API instance is needed. Then the scheduler must be split out or made safe to run on several instances, along with the backplane.
- **WebSockets for the game, HTTP for before and after.**
  - Why: the socket suits pushed events and low latency, while HTTP gives clear replies and errors for create and join.
  - Rejected: everything over the socket.
  - Implementation: a SignalR hub at `/api/hubs/game` (`GameHub`), wrapped on the client by `app/lib/game-hub.ts`.
  - Revisit: if the split causes awkward flows.
- **One API instance in v1, backplane later.**
  - Why: simplest to build, designed so more instances are possible.
  - Rejected: building for multiple instances now.
  - Revisit: when a second instance is needed for capacity or zero-downtime deploys.
- **Guest identity as a random GUID in an HttpOnly cookie, issued by its own request.**
  - Why: keeps identity separate from the socket handshake, so accounts can be added later.
  - Rejected: issuing it inside create or join.
  - Revisit: when accounts are added.
- **No presence tracking in v1.**
  - Why: it adds a feature (ending games sooner), not correctness, and the clock ends every game with a running clock.
  - Rejected: Memcached, Redis or a Postgres `last_seen` for presence, for now.
  - Revisit: when matchmaking arrives, since people could then game the system.
- **Matchmaking queue deferred.**
  - Why: the concurrency and presence problems are out of proportion to its value when invite codes already work.
  - Rejected: a polling queue with row locks.
  - Revisit: when users who don't know each other need to be matched.
- **Draw and rematch offers in their own tables.**
  - Why: keeps the game table simple.
  - Rejected: extra columns on the game.
  - Revisit: if offer rules get complicated.
- **Cross-site protections.**
  - Chosen: SameSite cookie, Origin check on the WebSocket upgrade, and a custom header on the HTTP endpoints.
  - Why: CORS doesn't apply to WebSockets and cookies ride along on requests.
- **Testing by contract with the SignalR client mocked.**
  - Why: keeps tests simple and fast.
  - Revisit: if timing or wiring bugs show up that mocks hide.

## Deferred to a later version
- **Matchmaking queue (play online).** First in, first out. The scheduler pairs waiting players and notifies them through the backplane. Ghost rows and lost "match found" messages are the open problems.
- **Presence tracking.** An "opponent disconnected" label, a grace period, and ending abandoned games sooner. The leaning is a service behind an interface, with Memcached to try, and a heartbeat plus event design.
- Accounts, AI opponent, chat, spectating, replays, email or text notifications, rankings.

## Constraints and assumptions
- Cheap hosting, ideally a VPS running a Docker image. Postgres hosted separately.
- Prefer C#, React, Python or Node.
- Assumed and to verify:
  - Postgres makes a second writer wait for a row lock by default.
  - The host supports long-lived WebSocket connections.
  - A remote database's latency, and any idle suspension, are acceptable.
  - One API instance is enough for v1.

## Open questions
- Backend language and real-time library (SignalR implies C#).
- What triggers "game started"? Leaning: the second player being seated.
- Can one session be in more than one active game?
- The invite code format and when it stops working.
- Colours on rematch, and whether offers expire.
- Is the scheduler part of the first walking skeleton, and how often does it run?
- A browser with the old app meeting a new server after a deploy.
- The message protocol and what is logged.
- The ranking of the quality attributes.
