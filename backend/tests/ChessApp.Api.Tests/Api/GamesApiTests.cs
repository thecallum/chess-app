using System.Net;
using System.Net.Http.Json;
using ChessApp.Api.Controllers.Responses;
using ChessApp.Api.Tests.Gateways;

namespace ChessApp.Api.Tests.Api;

// Whole-stack tests: real HTTP, auth, controllers, use cases, EF Core and Postgres.
// Shares the Postgres container, and so its collection, with the gateway tests.
[Collection(PostgresCollection.Name)]
public class GamesApiTests : ApiTestBase
{
    public GamesApiTests(PostgresFixture postgres) : base(postgres)
    {
    }

    private static async Task<GameResponse> CreateGameAsync(HttpClient player, string colour = "White")
    {
        var response = await player.PostAsJsonAsync("/api/games", new { colour });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<GameResponse>())!;
    }

    // Authentication

    [Fact]
    public async Task CreateGame_WithoutGuestCookie_Returns401()
    {
        // Arrange
        var client = Factory.NewClient();

        // Act
        var response = await client.PostAsJsonAsync("/api/games", new { colour = "White" });

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // Create

    [Fact]
    public async Task CreateGame_WhenSignedIn_ReturnsWaitingGame()
    {
        // Arrange
        var player = await Factory.NewPlayerAsync();

        // Act
        var response = await player.PostAsJsonAsync("/api/games", new { colour = "Black" });

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var game = await response.Content.ReadFromJsonAsync<GameResponse>();
        Assert.NotNull(game);
        Assert.NotEqual(Guid.Empty, game.GameId);
        Assert.False(string.IsNullOrEmpty(game.Code));
        Assert.Equal("black", game.Colour);
        Assert.Equal("waiting", game.Status);
    }

    // Get

    [Fact]
    public async Task GetGame_WhenPlayerIsInGame_ReturnsGame()
    {
        // Arrange
        var player = await Factory.NewPlayerAsync();
        var created = await CreateGameAsync(player);

        // Act
        var response = await player.GetAsync($"/api/games/{created.GameId}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var game = await response.Content.ReadFromJsonAsync<GameResponse>();
        Assert.Equal(created, game);
    }

    [Fact]
    public async Task GetGame_WhenPlayerIsNotInGame_Returns403()
    {
        // Arrange
        var owner = await Factory.NewPlayerAsync();
        var stranger = await Factory.NewPlayerAsync();
        var created = await CreateGameAsync(owner);

        // Act
        var response = await stranger.GetAsync($"/api/games/{created.GameId}");

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // Join

    [Fact]
    public async Task JoinGame_WithoutGuestCookie_Returns401()
    {
        // Arrange
        var host = await Factory.NewPlayerAsync();
        var created = await CreateGameAsync(host);
        var client = Factory.NewClient();

        // Act
        var response = await client.PostAsJsonAsync("/api/games/join", new { code = created.Code });

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task JoinGame_WithInviteCode_SeatsSecondPlayerAndStartsGame()
    {
        // Arrange
        var host = await Factory.NewPlayerAsync();
        var guest = await Factory.NewPlayerAsync();
        var created = await CreateGameAsync(host, "White");

        // Act
        var response = await guest.PostAsJsonAsync("/api/games/join", new { code = created.Code });

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var joined = await response.Content.ReadFromJsonAsync<GameResponse>();
        Assert.NotNull(joined);
        Assert.Equal(created.GameId, joined.GameId);
        Assert.Equal("black", joined.Colour);
        Assert.Equal("in_progress", joined.Status);

        var hostView = await host.GetFromJsonAsync<GameResponse>($"/api/games/{created.GameId}");
        Assert.Equal("white", hostView?.Colour);
        Assert.Equal("in_progress", hostView?.Status);
    }
}
