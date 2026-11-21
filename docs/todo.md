# V1 To-do

Built from [v1-project-notes.md](v1-project-notes.md) and [architecture.md](architecture.md). Ordered so each step leaves something working. Library names are candidates, not decisions.

## 1. Frontend libraries (next)
Decide and add only what the next steps need:
- [ ] Chess board UI (drag and drop, legal-move hints)
- [ ] Client-side chess rules, for move hints only (the server stays the authority)
- [ ] Real-time client (SignalR client if the backend uses SignalR)
- [ ] Styling approach
- [ ] Frontend tests (Vitest and Testing Library, or similar)

## 2. Backend foundations
- [ ] Decide the real-time library (SignalR) and the chess rules library
- [ ] Postgres access and migrations (decide EF Core or alternatives), wire up the compose connection string
- [x] Guest session: a random GUID in an HttpOnly cookie, issued by its own request, never replaced if present
- [~] Cross-site protections: SameSite cookie and custom header done; Origin check on the WebSocket upgrade still to do
- [ ] Structured logging with game id and player id

## 3. Walking skeleton: create and join a game
- [ ] Data: `games` and `moves` tables
- [x] HTTP: create a game (colour choice, invite code) and join by code, with errors for invalid, expired and full (in-memory store for now, Postgres still to do)
- [x] Frontend: homepage, start page (play a friend, disabled online and AI placeholders), waiting screen with the code (scaffolded, no requests yet)
- [ ] Game channel: join over WebSocket, receive current state, "opponent joined" event (the host's waiting screen needs a refresh until this is done)

## 4. Playing a game
- [ ] Move flow: client sends move and move number, server validates and commits in one transaction, then notifies the opponent
- [ ] Rejections make the client resync from the server
- [ ] Board UI with turn indicator, move log, step back and forward through history
- [ ] Clocks from stored timestamps, started after the first move
- [ ] Reconnect and refresh: rejoin and receive state and history
- [ ] End states: checkmate, stalemate, threefold repetition, fifty-move rule, insufficient material
- [ ] Result popup with rematch or leave

## 5. Time and cleanup
- [ ] Scheduler as a hosted service in the API: end timed-out games, clean up never-started games after 24 hours
- [ ] Reject moves after the clock has run out

## 6. Extras in scope
- [ ] Resign
- [ ] Draw offers (`game_draw_offer`, one pending at a time)
- [ ] Rematch (`game_rematch_offer`)
- [ ] Sound and browser notification on your turn

## 7. Quality and hosting
- [ ] Tests for use cases and the move flow, with the SignalR client mocked
- [ ] Verify the assumptions listed in the notes (row-lock behaviour, WebSocket support on the host, remote database latency)
- [ ] Choose a host and deploy the Docker image, with Postgres hosted separately
- [ ] Keep [architecture.md](architecture.md) up to date as decisions change

## Open questions to settle early
- What triggers "game started"? (leaning: the second player being seated)
- Invite code format and when it stops working
- Can one session be in more than one active game?
- Colours on rematch, and whether offers expire
- Rank the quality attributes
