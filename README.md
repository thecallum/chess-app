# Chess App

A multiplayer web chess app. Scope and decisions are in [docs/](docs/). The code is currently a bare project skeleton.

## Components

- **[backend/](backend/README.md)**: .NET 10 API (HTTP, WebSockets, and the in-process scheduler) plus a Core library for game logic. A single instance in v1.
- **[frontend/](frontend/README.md)**: React + Vite + React Router. Static files only: some pages are pre-rendered to HTML and hydrated, the rest are client-rendered.
- **[docs/](docs/architecture.md)**: the architecture summary and the [v1 working notes](docs/v1-project-notes.md).

## Running it

**Development** (frontend hot reload):

```bash
docker compose up -d --build api      # API on http://localhost:5080
cd frontend && pnpm dev                              # http://localhost:5001, proxies /api to the API
```

**Everything in Docker** (production-style, nginx serves the static frontend):

```bash
docker compose --profile full up --build
```

- Frontend: http://localhost:8080
- API: http://localhost:5080 (also proxied at http://localhost:8080/api/)

See the component READMEs for native commands. The to-do list is in [docs/todo.md](docs/todo.md).
