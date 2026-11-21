# V1 Project Notes

Status: draft · Last updated: 2026-11-21

> **Update 2026-11-21:** the scheduler is no longer a separate process. It runs as a hosted service inside the single API instance, which avoids needing a SignalR backplane in v1. Where this document says "separate scheduler", read it that way. [architecture.md](architecture.md) is current.

The working document for v1: scope, rules, architecture, data, flows, risks and open questions. [architecture.md](architecture.md) is the shorter summary and may drift from this.

**Contents**
1. [Overview](#1-overview)
2. [Decisions at a glance](#2-decisions-at-a-glance)
3. [Game rules and player experience](#3-game-rules-and-player-experience)
4. [Architecture](#4-architecture)
5. [Data model](#5-data-model)
6. [Key flows](#6-key-flows)
7. [Cross-cutting concerns](#7-cross-cutting-concerns)
8. [Security and risks](#8-security-and-risks)
9. [Assumptions to verify](#9-assumptions-to-verify)
10. [Open questions](#10-open-questions)
11. [Deferred to a later version](#11-deferred-to-a-later-version)

---

## 1. Overview

**What:** a multiplayer web chess app. Standard chess, two players.

**Goal:** learn to work with AI and to make good research and architecture decisions, not just write code. The outcome is a working, cheaply hosted product and a written record of the choices made.

### V1 scope
In:
- Web app only, standard chess rules
- Guest players only, no authentication
- Two players, one time control: 10 minutes per player
- Start a game by sharing an invite code
- Resign, draw offers, rematch
- Sound and browser notification when it's your turn

Out (see [Deferred](#11-deferred-to-a-later-version) and the future-features list in `project-context.md`):
- Matchmaking queue (play online), play against AI
- Accounts, rankings, friends, tournaments
- Chat, spectating, game replays, email or text notifications
- Presence tracking (who is connected)

### Quality attributes
From the original notes. The ranking is not yet confirmed.
- Cheap to host
- Ideally hosting-provider agnostic
- Low latency
- Well tested
- Architecture documented
- Extendable (mainly the code architecture)

### Constraints
- Cheap hosting, ideally something that runs a Docker image
- Prefer C#, React, Python or Node over learning new languages

---

## 2. Decisions at a glance

| Area | Choice | Status |
|---|---|---|
| Authority | The server is the source of truth for state, legal moves and rules. Clients send move intents. | Decided |
| Game state | Postgres. API processes are stateless about the game. | Decided |
| Clock | Stored timestamps, no per-game timers. The clock starts after the first move. | Decided |
| Timeouts and cleanup | A separate scheduler process (Coravel is a candidate). | Decided, library leaning |
| Real-time transport | WebSockets. SignalR is a candidate, which would imply C#. | Leaning |
| Backend language | Not decided. C# is implied if SignalR is chosen. | Open |
| Multiple instances | V1 runs one API instance. A managed backplane (Redis, for example) when more are needed. | Leaning |
| Identity | A random GUID in an HttpOnly cookie, issued by a separate request. | Decided |
| Invites | The code is stored on the game row. Valid for 24 hours. | Decided |
| Frontend | React, rendered client-side. Static HTML for the homepage if wanted. | Leaning |
| Presence | Not tracked in v1. | Decided, deferred |
| Matchmaking queue | Deferred. The scheduler is built so it can be added as a job. | Decided, deferred |
| Draw and rematch offers | Separate tables, not columns on the game. | Decided |
| Testing | Trust the contract and mock the SignalR client. | Leaning |
| Hosting | Cheap VPS running a Docker image. Postgres hosted separately. | Leaning |

**Design principles**
- Designed for, not built for: v1 runs one instance, but nothing should stop more.
- Group functionality so it can be moved to another server without untangling code. The scheduler is the first example.
- Wrap third-party libraries behind my own interfaces at seams likely to change (transport, state, rules engine). Not everything needs wrapping.

---

## 3. Game rules and player experience

### 3.1 Starting a game
- The homepage has some information and a link to start a game.
- The start page shows three options:
  - **Play a friend:** create a game and share a code, or join with a code.
  - **Play online:** a disabled placeholder. Deferred.
  - **Play against AI:** a disabled placeholder. Deferred.
- **Creating:** the player chooses a colour (or random). Time is fixed at 10 minutes per player. They land on a "waiting for opponent" screen showing the code to copy and share.
- **Joining:** the opponent enters the code in a form on the same menu.
- UI layout is not yet decided.

### 3.2 Playing
- The board shows whose turn it is, both clocks, and a log of previous moves. Players can step back and forward through the history while the board is locked, then return to the live position.
- Moves are made by dragging pieces. The chess UI library decides the interaction. It should prevent illegal moves as a convenience, but the server is the authority. If an illegal move gets through, the server rejects it.
- When it becomes your turn there is a sound, and a browser notification if the tab is in the background. Notifications only work while the tab is open.
- Players have no names. The other player is shown as "Opponent".
- Back and forward browsing is client-side, but a client that reconnects refetches history from the server.

### 3.3 Clocks and timeouts
- 10 minutes per player. The clock starts after the first move.
- A player who runs out of time loses, and the opponent wins.
- A disconnected player's clock keeps running. If they don't return and move, they lose on time.
- The server decides from stored timestamps. A clock expires when `last_move_time + time left for the player to move < now`.
- Lag: a move can arrive after the clock reached zero because of network delay. V1 has no compensation, and the server's arrival time is the truth. Accepted for a 10-minute clock.

### 3.4 Ending a game
End states, all standard chess:
- Checkmate (win), timeout (loss), resignation (loss)
- Stalemate, draw by agreement, threefold repetition, fifty-move rule, insufficient material (draws)

There is no abandonment state in v1. An abandoned game ends as a normal timeout.

A popup shows who won or that it was a draw, and offers **rematch** or **leave**.

**Draw offers**
- A draw button sends an offer. The opponent accepts or rejects. Accepting ends the game.
- Only one offer can be pending at a time. A second one fails validation, and the frontend handles that gracefully.
- No move can be made while an offer is pending, and the clock is not paused.

**Rematch**
- Both players must agree. A loading view shows the opponent's response (accepted, declined or waiting).
- If accepted, a new game starts automatically. If declined, or the opponent leaves, the player is told and shown the other option.

### 3.5 Disconnects, refreshes and reconnects
- V1 does not track who is connected. There is no "opponent disconnected" label, grace period, popup or early-end rule. They come with presence tracking later.
- A player who reconnects or refreshes joins the game channel and receives the current state plus the history they need. Nothing it needs depends on a particular connection or server.
- Resigning is the deliberate forfeit.
- A guest who changes browser or clears cookies loses their session and cannot rejoin. Accepted for v1.

### 3.6 Edge cases
- **Wrong or expired invite code:** a message says the code is invalid or expired.
- **Third person joins a started game:** an error says the game has started. Spectating is out of scope.
- **Creator enters their own code:** their ID matches the owner, so the server fails the request or redirects them to the game page.
- **Same person in two tabs:** allowed. The server holds the state, so both tabs show the same game.
- **Game nobody moves in:** it stays "never started". See [4.4](#44-scheduler).

---

## 4. Architecture

### 4.1 Components
- **Browser:** a React app. It shows the UI and has some client-side logic, but state and rules come from the server.
- **API instance:** handles HTTP requests and WebSocket connections, validates moves and writes state. V1 runs one.
- **Scheduler:** a separate process that finds timed-out games and cleans up games that never started. It is the only process that does time-based work.
- **Postgres:** all durable state.
- **Backplane (later):** when more than one API instance runs, a managed Redis (or similar) carries events between them.

### 4.2 HTTP and WebSocket
- **HTTP:** creating a game, joining by code, and issuing the session cookie. These need a clear reply and can fail with an error.
- **WebSocket (a game channel per game):** everything once a game exists: moves, resign, offers, and events pushed to players such as the opponent's move, game started and timeout.
- Rule of thumb: HTTP for what happens before and after a live game, the socket for the game itself.

### 4.3 Identity and session
- There is no authentication. A player is identified by a random GUID stored in an HttpOnly cookie, referenced in the database. It must come from a secure random source.
- A separate request issues the cookie, made when the player visits the "play a friend" page.
  - It must not replace an existing cookie, or a second tab would give the player a new identity and lock them out.
  - The frontend must wait for it to finish before making any other request. Later requests fail if the cookie is missing.
- Only a client whose cookie matches a seat in the game can join its channel.

### 4.4 Scheduler
- Works out timeouts by comparing time left with the last move time, for games in progress. It ends the game, records the win and notifies the players.
- Cleans up games still "never started" 24 hours after creation.
- Structured as separate jobs, so queue matching can be added later without redesign.
- One instance only, so work isn't contended. If it stops, timeouts and cleanup pause but no state is lost.
- Game state stays in the database, so restarts are safe.

### 4.5 Scaling and hosting
- V1 runs one API instance and one scheduler. Everything can sit in one Docker image. Postgres is hosted separately.
- Server processes hold no game state in memory. Open connections are tied to a process, but a client can reconnect at any time.
- With several API instances, something must carry events between them. A managed backplane is the plan, so I don't write that myself.
- Adding the backplane later is meant to be mostly configuration. State must not live in process memory, and everything sent to players must go through one seam ("publish to a game channel").

---

## 5. Data model

A rough map. Names and types are not final.

**games**

| Field | Notes |
|---|---|
| id | int, primary key |
| white_client_id | guid |
| black_client_id | guid |
| owner_client_id | guid, the creator |
| clients | list of client ids. Duplicates the owner and colour columns on purpose, for clarity. |
| current_move | int. Odd means white to move, even means black. |
| game_started_at | datetime |
| board_state | string, defined by the chess library |
| last_move_time | datetime |
| white_time_remaining | duration |
| black_time_remaining | duration |
| game_state | never started (initial), in progress (after the first move), finished |
| game_completion_status | the result and reason |
| game_completed_at | datetime |
| game_invite_code | string or null. Looked up to return the game, so the code alone is enough to join. Works like a temporary password. |
| created_at | datetime, used for the 24-hour rules |

**moves** is a history for rewinds and replays. The game row holds the important state.

| Field | Notes |
|---|---|
| id | int, primary key |
| game_id | int |
| action | string, e.g. `e2e4` |
| move_number | int |
| action_at | datetime |

**game_draw_offer** has many rows per game, but only one pending.

| Field | Notes |
|---|---|
| id | int, primary key |
| game_id | int |
| created_at | datetime |
| created_by | client id |
| status | accepted, rejected, withdrawn or pending |

**game_rematch_offer** has one row per game.

| Field | Notes |
|---|---|
| game_id | primary key |
| created_at | datetime |
| created_by | client id |
| status | accepted, rejected, withdrawn or pending |

---

## 6. Key flows

### 6.1 Create and join an invite game
1. The player visits the "play a friend" page. The browser requests a session cookie if it has none.
2. They choose a colour (or random) and send an HTTP request to create the game. The server creates it with the creator as owner, with the colour decided at this point, and the state "never started". It returns the code.
3. They join the game channel over the WebSocket. Their cookie must match a seat.
4. The opponent opens the join form, gets a cookie if needed, and sends the code over HTTP. The server looks up the game, checks it's valid (not expired, not full), and seats them.
5. The opponent joins the channel and the creator receives an "opponent joined" event.
6. On joining the channel, each client receives the current game state plus the history it needs.

Errors (invalid code, full game, expired invite) are returned over HTTP and handled by the frontend.

### 6.2 Making a move
1. The channel tells the player it is their turn.
2. The client submits the move along with the move number it believes it is making.
3. In one transaction the server checks that it's still this player's turn, that the move number matches, that the game is in progress and that the time hasn't run out. It validates the move with its chess library, adds it to `moves`, and updates the game.
4. The server tells the other player it is now their turn.

Error cases:
- **Illegal move:** rejected. This is a bug if the frontend library is working.
- **Out of turn:** rejected.
- **Late move:** compared against the time left. It is rejected and triggers a win for the opponent.
- **Duplicate (same move, move number and player):** treated as already applied. The server replies with success, not an error.

Rules:
- Adding the move and updating the game commit together.
- A second writer (a duplicate, or a move racing the scheduler) waits for the row lock, runs the same checks, and fails if the state has moved on. Waiting is the default Postgres behaviour (to verify).
- Any rejection makes the client resync by refetching the game state from the server. This is a requirement.
- Ending a game is safe to repeat. If it's already finished, ending it again does nothing.

### 6.3 Clock expiry and scheduler tick
1. The scheduler runs on an interval and finds games in progress where `last_move_time + time left < now`.
2. It ends each game, records the win for the opponent, and notifies the players. The frontend then shows what to do next.
3. It also cleans up games that are still "never started" after 24 hours. A player joining an invite also checks it against the database, so an expired invite can't be joined before cleanup runs.

### 6.4 Resign
1. The resign button sends a specific event.
2. The server confirms the game is in progress, and if so ends it.

### 6.5 Reconnect and refresh
1. The client reconnects and joins the game channel.
2. It receives the current state and history, and continues as before.

This is the same path as a refresh, and as a reconnect after a server restart.

### 6.6 Draw offer
1. Player A sends an offer. The server creates a pending row, which fails validation if one already exists.
2. The other client receives the offer with its ID, and sends accept or reject, confirming the current status.
3. Accepting ends the game, under the same safe-to-repeat rule.
4. When an offerer's connection closes, the disconnect hook withdraws their pending offers. Best effort: the hook doesn't fire if an instance crashes, and it fires per connection, so closing one of two tabs withdraws the offer.

### 6.7 Rematch
Behaves like a draw offer, using `game_rematch_offer`. Leaving or closing the tab withdraws it by the same best-effort hook. If the other player accepts and the offerer has left, the new game starts as normal and just sits there as "never started".

### 6.8 Server restart or redeploy
- A restart drops all connections. Clients reconnect and refetch state, as in 6.5.
- A move and the game update commit together, so a restart cannot leave them out of step.
- The scheduler pauses and then resumes. Clocks keep running because they are timestamp based.
- Not yet addressed: a browser with the old app meeting a new server after a deploy.

---

## 7. Cross-cutting concerns

- **Concurrency:** a move takes a row lock in a transaction. A second writer waits, re-checks, and fails if the state changed. Move vs timeout and resign vs move work the same way: the first to commit wins.
- **Retention:** finished games are kept. There's currently no reason not to.
- **Testing:** the plan is to trust the contract and mock the SignalR frontend client, and not to test every flow with two browsers.
- **Logging:** not yet decided. The original notes say to log in a structured way (game ID, player ID) from the start.
- **Message protocol:** not yet written. It should list each message and what happens if one arrives twice, late or never.

---

## 8. Security and risks

**Threat model for v1:** guests with no accounts, no names or chat. The risks are someone forging requests on a player's behalf, and someone guessing codes.

- **Illegal moves:** not a risk, because the server is the authority.
- **Cheating with an engine:** not preventable without complex detection. Out of scope.
- **Cross-site request forgery (CSRF):** another site could make a player's browser send requests that carry their cookie, for example a move over the WebSocket.
  - Set SameSite on the cookie, and check the Origin header on the WebSocket upgrade. CORS does not apply to WebSockets, so the server must do this itself.
  - The API and WebSocket are on subdomains of one root domain, so they count as the same site (to verify).
- **HTTP endpoints:** the create and join endpoints have the same risk. A game couldn't be played, but these could be triggered. Require a custom header such as `X-CSRF: 1`. Another site can't send one without a CORS preflight, which the server refuses.
- **Cross-site scripting (XSS):** injected script could act as the player. V1's only free-text input is the invite code. Never render user input unescaped. The cookie is HttpOnly, so injected script can't read it.
- **Invite codes:** someone could try many codes to find an open game. Accepted for v1. Spam prevention, such as rate limiting, is out of scope. The session cookie is a GUID from a secure random source, so guessing it isn't realistic.

---

## 9. Assumptions to verify

**Hosting**
- A cheap VPS can run a Docker image with both the API and the scheduler, with Postgres hosted separately (for example Neon).
- The host supports long-lived WebSocket connections.
- A remote database adds latency to every move, which matters for the low-latency goal. Some serverless Postgres hosts suspend idle databases. Check both, and check the storage limit, since games are kept.

**Technical**
- Postgres makes a second writer wait for a row lock by default.
- SignalR's backplane can be used with a separate scheduler process publishing to clients.
- Coravel runs inside its own process and has no distributed locking, so one scheduler instance is enforced by deployment.
- Detection and timeout settings in SignalR (the disconnect hook, client timeout of about 30 seconds) behave as assumed.
- One API instance is enough for v1.
- A cookie with SameSite is not sent on cross-site WebSocket handshakes.

---

## 10. Open questions

**Game start and identity**
- What triggers "game started"? Leaning: the second player being seated.
- The invite code: length, uniqueness among active games, and when it stops working once the game starts.
- Can one session be in more than one active game at a time? If not, a never-started game blocks that player until it's cleaned up.
- One name for the session identity (`user_session`, `client_session`, `client_id`).
- Is `clients` a database array or a separate table? Reconnect needs "which game is this session in?".
- Id types: ints and GUIDs are mixed (for example `created_by`).

**Rules**
- Colours on rematch: swap?
- Should a draw or rematch offer expire? Without it, the best-effort disconnect hook is the only way a stale offer is withdrawn.
- Limits on draw offer spam, or a block feature.
- Does the player see a message when a move is rejected?
- Can an "opponent disconnected" label exist as a best-effort message in v1, or is it deferred with presence?

**Technical**
- Backend language, and the real-time library (SignalR implies C#).
- Does a client still ask the server to check a timeout as a backup, or is the scheduler the only trigger?
- How often does the scheduler run, and is it part of the walking skeleton?
- How is exactly one scheduler instance enforced, and does it share the API's codebase?
- Old app version meeting a new server after a deploy.
- The message protocol and which events are logged.
- Which pages need static HTML for SEO, if any.

**Product**
- Quality attribute ranking.
- Whether to show a disabled "Play online" placeholder.
- UI layout for the start pages.

---

## 11. Deferred to a later version

### Matchmaking queue (play online)

Status: deferred. The complexity is out of proportion to its v1 value, because invite codes already let two people play. The v1 requirement is that the scheduler is built so this can be added later as another job.

**Design in principle**
- First in, first out. No skill-based matching, since that needs accounts. One queue, because every game is 10 minutes per player. The player sees a loading state and the wait is indefinite. Queue length and live game counts are out, because there's no data.

`game_queue`
- `id`: increasing, gives join order
- `user_id`: the player's session id, unique, so one session can't queue twice
- `joined_at`: datetime

How matching works:
- Joining is an HTTP request that adds a row and returns. The client then waits on its real-time connection. It doesn't poll.
- The scheduler takes the oldest waiting players in pairs. In one transaction it creates the game (white and black chosen at random) and deletes the two rows.
- After the commit it tells both players. They may be on different API instances, so this goes through the backplane.
- Only one scheduler runs, so no row locking is needed for matching. A match can take up to one scheduler interval.
- The end-of-game options would include rejoining the queue.

**Alternative considered first:** each waiting client polls every x seconds. Each poll runs in one transaction: lock my own row (skipping if locked), lock the oldest other row that joined before me (skipping locked rows), then create the game and delete both rows. It relies on Postgres row locking with skip-locked behaviour and a unique constraint on the player id. It was set aside because the concurrency reasoning was hard, and the scheduler approach removes most of it.

**Options researched (to verify)**
- Postgres: row locking with skip-locked, advisory locks, LISTEN/NOTIFY (not durable), and job-queue libraries built on Postgres.
- Redis: fast atomic operations on ordered collections, but a second store and a cost. Linked to the backplane.
- Message brokers: built to give each message to one consumer, which fits pairing two players poorly.
- Dedicated game matchmaking services: far more than needed, and against cheap hosting and provider independence.
- Most of these solve "give each item to one worker". They don't solve pairing two waiting players, or knowing when one has gone.

**Scaling**
- A single scheduler is expected to go a long way, because pairing without ranking is cheap. This is an assumption, not measured.
- If needed, it could be sharded, for example by game type if more time controls are added (multiple queues), or the processing divided up. That adds coordination: which instance owns which shard and what happens on failure.
- To record as a decision: the assumption, the limit (single point of failure, no horizontal scaling), the escape route, and a measurable trigger for revisiting.

**Open points**
- Ghost rows: a player who joins and disappears leaves a row a real player could be matched against. The WebSocket can remove the row on disconnect, but not if an instance crashes or a connection drops silently, so the scheduler also needs a way to expire stale rows.
- A "match found" message is lost if the player's connection is down. A reconnecting client needs a way to find out whether it's waiting, matched or no longer in the queue.
- A player already in an active game shouldn't be able to join.
- Can a separate scheduler process publish to clients through the backplane? Assumed, needs verifying.

### Presence tracking (knowing who is connected)

Status: deferred. It's a nice-to-have, not needed for correctness in v1, since the clock ends every game with a running clock. It matters more once matchmaking exists, because people could then try to game the system.

**What it would add:** an "opponent has disconnected" label, a short grace period followed by an offer to end the game early (the connected player wins), ending a game sooner when both players have left, and knowing when a rematch or draw offer's recipient has gone.

**Requirements**
1. For a given game, is each player connected right now?
2. Detect a leave, so a grace period can start.
3. Detect both players gone.

Requirement 1 is a state question. Requirements 2 and 3 are about noticing a change and acting later. Nothing in a process holds timers, so the time a player left must be stored and something must check it later. "Left" means no connections at all (two tabs are allowed), and a brief blip doesn't count.

**Considerations**
- The check must run often enough for a short grace period to mean anything.
- Keep the time a player left, not just whether they are gone. With a store that expires entries, store the last heartbeat time as the value and use expiry only as garbage collection.
- A crashed instance never reports disconnects, so a disconnect event alone isn't enough. A heartbeat is the reliable signal and the event is a fast hint.
- SignalR gives a connect hook, a disconnect hook (per connection, with a timeout of about 30 seconds for silent drops, to verify), client automatic reconnect (new connection ID, group membership lost) and keep-alive settings. The ping isn't exposed as an event, so a heartbeat would be my own message.
- Absence of a record must mean "unknown", not "disconnected". Otherwise a store restart would end every active game. Options: heartbeats rebuild the store within seconds, a durable fallback time from Postgres, a sentinel key to detect a reset, and being lenient by default.

**Leaning**
- A presence service behind my own interface, so the implementation can be swapped. Memcached is the one I'd try, for its simpler interface. It works across instances and entries can expire, but there's no notification on expiry, it can evict early, it can't list entries, and it can't be the SignalR backplane.
- A first interface sketch: add a client (client id), mark a client disconnected (client id), and confirm a list of client ids are connected. Gaps spotted: a heartbeat operation, timestamps in the answer, and per-session handling for two tabs.
- Alternatives to compare: in memory (one instance), a `last_seen` column in Postgres, and Redis (possibly sharing the backplane's server). A single Redis could serve as both backplane and presence store, at the cost that one failure takes out both.
