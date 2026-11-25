using Microsoft.EntityFrameworkCore;

namespace ChessApp.Api.Gateways;

// Applies pending migrations when the app starts, before it accepts requests.
// A hosted service, not code in Program.cs, so `dotnet ef` doesn't run it.
public sealed class DatabaseMigrator : IHostedService
{
    private readonly IServiceScopeFactory _scopes;

    public DatabaseMigrator(IServiceScopeFactory scopes)
    {
        _scopes = scopes;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ChessDbContext>();
        await db.Database.MigrateAsync(cancellationToken);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
