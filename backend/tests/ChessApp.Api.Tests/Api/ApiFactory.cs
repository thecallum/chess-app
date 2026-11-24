using ChessApp.Api.Middleware;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace ChessApp.Api.Tests.Api;

// Starts the real API in-process, pointed at the test Postgres container.
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    private readonly string _connectionString;

    public ApiFactory(string connectionString)
    {
        _connectionString = connectionString;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:Default", _connectionString);
    }

    // A client with its own cookie jar, so each one acts as a separate player.
    // It already sends the CSRF header, but has no guest cookie until SignInAsync.
    public HttpClient NewClient()
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Add(CsrfProtectionMiddleware.HeaderName, CsrfProtectionMiddleware.HeaderValue);
        return client;
    }

    public async Task<HttpClient> NewPlayerAsync()
    {
        var client = NewClient();
        var response = await client.PostAsync("/api/session", content: null);
        response.EnsureSuccessStatusCode();
        return client;
    }
}
