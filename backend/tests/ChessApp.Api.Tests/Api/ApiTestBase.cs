using ChessApp.Api.Tests.Gateways;

namespace ChessApp.Api.Tests.Api;

// Gives each API test class a running app on a clean database.
// Subclasses need [Collection(PostgresCollection.Name)] so they share the one container.
public abstract class ApiTestBase : IAsyncLifetime, IDisposable
{
    private readonly PostgresFixture _postgres;

    protected ApiTestBase(PostgresFixture postgres)
    {
        _postgres = postgres;
        Factory = new ApiFactory(postgres.ConnectionString);
    }

    protected ApiFactory Factory { get; }

    public Task InitializeAsync() => _postgres.ResetAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    public void Dispose() => Factory.Dispose();
}
