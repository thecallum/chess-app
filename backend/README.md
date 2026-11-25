# Backend

.NET 10. A single API instance in v1.

| Project | Purpose |
|---|---|
| `src/ChessApp.Api` | ASP.NET Core: HTTP API (`Controllers/`, `UseCases/`, `Gateways/`, `Models/`) and the SignalR game hub (`/api/hubs/game`, ping demo only). |
| `tests/ChessApp.Api.Tests` | xUnit tests. No tests yet. |

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
