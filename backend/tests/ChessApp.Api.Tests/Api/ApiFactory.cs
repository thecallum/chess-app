using ChessApp.Api.Middleware;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;

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

    // A player, plus their guest cookie ("guest_id=...") for connecting to the hub,
    // which doesn't share the HttpClient's cookie jar.
    public async Task<(HttpClient Client, string Cookie)> NewPlayerWithCookieAsync()
    {
        var client = NewClient();
        var response = await client.PostAsync("/api/session", content: null);
        response.EnsureSuccessStatusCode();
        var cookie = response.Headers.GetValues("Set-Cookie").First().Split(';')[0];
        return (client, cookie);
    }

    // A connection to the game hub as the player with this cookie, or as nobody if it's
    // null. It goes through the in-process test server, using long polling: the hub,
    // auth and routing are the same as over WebSockets, only the transport differs.
    public HubConnection NewHubConnection(string? cookie)
    {
        return new HubConnectionBuilder()
            .WithUrl(new Uri(Server.BaseAddress, "api/hubs/game"), options =>
            {
                options.HttpMessageHandlerFactory = _ => Server.CreateHandler();
                options.Transports = HttpTransportType.LongPolling;
                if (cookie is not null) options.Headers["Cookie"] = cookie;
            })
            .Build();
    }
}
