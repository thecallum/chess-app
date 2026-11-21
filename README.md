# Chess App

A multiplayer web chess app. Scope and decisions are in [docs/](docs/). The code is currently a bare project skeleton.

## Components

- **[backend/](backend/README.md)**: .NET 10 API (HTTP, WebSockets, and the in-process scheduler) plus a Core library for game logic. A single instance in v1.
- **[frontend/](frontend/README.md)**: React + Vite + React Router. Static files only: some pages are pre-rendered to HTML and hydrated, the rest are client-rendered.
- **[docs/](docs/architecture.md)**: the architecture summary and the [v1 working notes](docs/v1-project-notes.md).

## Running it

Everything in Docker:

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- API: http://localhost:5080/api/weatherforecast (also proxied at http://localhost:8080/api/weatherforecast)

For day-to-day work, run the apps natively. See the component READMEs for their commands.
