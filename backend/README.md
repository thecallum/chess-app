# Backend

.NET 10. A single API instance in v1.

| Project | Purpose |
|---|---|
| `src/ChessApp.Api` | ASP.NET Core: HTTP API and the SignalR game hub (`/api/hubs/game`, ping demo only). |
| `src/ChessApp.Core` | Domain logic. No framework dependencies. Empty for now. |
| `tests/ChessApp.Core.Tests` | xUnit tests for Core. No tests yet. |

## Commands

```bash
dotnet build
dotnet test
dotnet run --project src/ChessApp.Api    # http://localhost:5236 (launch profile)
```

Or via Docker with hot reload (`dotnet watch`), from this directory:

```bash
make help    # list commands
make dev     # API in Docker with hot reload on http://localhost:5080
```

`docker build` here produces the API image.
