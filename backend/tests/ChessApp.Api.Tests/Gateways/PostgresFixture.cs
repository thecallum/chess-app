using ChessApp.Api.Gateways;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace ChessApp.Api.Tests.Gateways;

// One throwaway Postgres container shared by every test in the "Postgres" collection.
// Needs Docker running. The schema comes from the real migrations.
public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:17-alpine").Build();

    public string ConnectionString => _container.GetConnectionString();

    public ChessDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<ChessDbContext>().UseNpgsql(_container.GetConnectionString()).Options);

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        await using var db = CreateContext();
        await db.Database.MigrateAsync();
    }

    // Call before each test so tests don't see each other's rows.
    public async Task ResetAsync()
    {
        await using var db = CreateContext();
        await db.Database.ExecuteSqlRawAsync("""TRUNCATE TABLE "Games";""");
    }

    public async Task DisposeAsync() => await _container.DisposeAsync();
}

[CollectionDefinition(Name)]
public sealed class PostgresCollection : ICollectionFixture<PostgresFixture>
{
    public const string Name = "Postgres";
}
