using System.Net;
using System.Net.Http.Json;
using System.Threading.Channels;
using ChessApp.Api.Controllers.Responses;
using ChessApp.Api.Tests.Gateways;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.EntityFrameworkCore;

namespace ChessApp.Api.Tests.Api;

// Whole-stack tests of the game hub: a real SignalR client against the real app,
// auth, use cases, chess engine, EF Core and Postgres. These check the pieces are
// connected, one test per path through them. The rules themselves are unit tested.
[Collection(PostgresCollection.Name)]
public class GameHubApiTests : ApiTestBase
{
    // How long to wait for an event before failing, so a missing event can't hang the run.
    private static readonly TimeSpan EventTimeout = TimeSpan.FromSeconds(5);

    private readonly PostgresFixture _postgres;

    public GameHubApiTests(PostgresFixture postgres) : base(postgres)
    {
        _postgres = postgres;
    }

    // A hub connection that records every GameState it receives, in order.
    private sealed record HubClient(HubConnection Connection, ChannelReader<GameResponse> States);

    private async Task<HubClient> ConnectAsync(string cookie)
    {
        var connection = Factory.NewHubConnection(cookie);
        var states = Channel.CreateUnbounded<GameResponse>();
        connection.On<GameResponse>("GameState", state => states.Writer.TryWrite(state));
        await connection.StartAsync();
        return new HubClient(connection, states.Reader);
    }

    private static async Task<GameResponse> NextStateAsync(HubClient client)
    {
        using var timeout = new CancellationTokenSource(EventTimeout);
        try
        {
            return await client.States.ReadAsync(timeout.Token);
        }
        catch (OperationCanceledException)
        {
            throw new TimeoutException($"No GameState received within {EventTimeout.TotalSeconds}s.");
        }
    }

    private static async Task<GameResponse> CreateGameAsync(HttpClient player)
    {
        var response = await player.PostAsJsonAsync("/api/games", new { colour = "White" });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<GameResponse>())!;
    }

    private static async Task JoinGameAsync(HttpClient player, string code)
    {
        var response = await player.PostAsJsonAsync("/api/games/join", new { code });
        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task Connect_WithoutGuestCookie_IsRefused()
    {
        // Arrange: a hub connection with no guest cookie.
        await using var connection = Factory.NewHubConnection(cookie: null);

        // Act: try to open it.
        var exception = await Assert.ThrowsAsync<HttpRequestException>(() => connection.StartAsync());

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, exception.StatusCode);
    }

    [Fact]
    public async Task ConnectToGame_SendsTheCallerTheGameState()
    {
        // Arrange
        // 1. Sign in a guest, who makes a game as white.
        var (creator, creatorCookie) = await Factory.NewPlayerWithCookieAsync();
        var game = await CreateGameAsync(creator);

        // 2. Open a hub connection as that guest.
        var white = await ConnectAsync(creatorCookie);

        // Act: connect to the game.
        await white.Connection.InvokeAsync("ConnectToGame", game.GameId);

        // Assert: the reply is the game as white sees it, still waiting for an opponent.
        var state = await NextStateAsync(white);
        Assert.Equal(game.GameId, state.GameId);
        Assert.Equal("waiting", state.Status);
        Assert.Equal("white", state.Colour);
        await white.Connection.DisposeAsync();
    }

    [Fact]
    public async Task JoinGame_SendsTheConnectedCreatorTheUpdatedGameState()
    {
        // Arrange
        // 1. Sign in two guests. Only the creator needs a hub connection.
        var (creator, creatorCookie) = await Factory.NewPlayerWithCookieAsync();
        var opponent = await Factory.NewPlayerAsync();

        // 2. The creator makes a game as white.
        var game = await CreateGameAsync(creator);

        // 3. The creator connects to the game, and gets the "waiting" state in reply.
        var white = await ConnectAsync(creatorCookie);
        await white.Connection.InvokeAsync("ConnectToGame", game.GameId);
        Assert.Equal("waiting", (await NextStateAsync(white)).Status);

        // Act: the opponent joins over REST.
        await JoinGameAsync(opponent, game.Code);

        // Assert: the creator's open connection is told, with their own colour.
        var onJoin = await NextStateAsync(white);
        Assert.Equal(game.GameId, onJoin.GameId);
        Assert.Equal("in_progress", onJoin.Status);
        Assert.Equal("white", onJoin.Colour);
        await white.Connection.DisposeAsync();
    }

    [Fact]
    public async Task SendMove_SendsTheUpdatedGameStateToBothPlayers()
    {
        // Arrange
        // 1. Sign in two guests.
        var (creator, creatorCookie) = await Factory.NewPlayerWithCookieAsync();
        var (opponent, opponentCookie) = await Factory.NewPlayerWithCookieAsync();

        // 2. The creator makes a game as white, and the opponent joins it over REST.
        var game = await CreateGameAsync(creator);
        await JoinGameAsync(opponent, game.Code);

        // 3. Both open a hub connection and connect to the game.
        var white = await ConnectAsync(creatorCookie);
        var black = await ConnectAsync(opponentCookie);
        await white.Connection.InvokeAsync("ConnectToGame", game.GameId);
        await black.Connection.InvokeAsync("ConnectToGame", game.GameId);

        // 4. Each receives the current state in reply. Read it so the next one is fresh.
        await NextStateAsync(white);
        await NextStateAsync(black);

        // Act: white plays the first move.
        await white.Connection.InvokeAsync("SendMove", game.GameId, 1, "{e2 - e4}");

        // Assert: both get the position after the move, each with their own colour.
        var whiteState = await NextStateAsync(white);
        var blackState = await NextStateAsync(black);
        Assert.Equal(2, whiteState.CurrentMove);
        Assert.Equal(["{e2 - e4}"], whiteState.Moves);
        Assert.NotEqual(game.GameState, whiteState.GameState);
        Assert.Equal("white", whiteState.Colour);
        Assert.Equal(whiteState.GameState, blackState.GameState);
        Assert.Equal(2, blackState.CurrentMove);
        Assert.Equal("black", blackState.Colour);
        await white.Connection.DisposeAsync();
        await black.Connection.DisposeAsync();
    }

    [Fact]
    public async Task SendMove_WhenMoveIsCheckmate_SendsBothPlayersTheResult()
    {
        // Arrange
        // 1. Sign in two guests.
        var (creator, creatorCookie) = await Factory.NewPlayerWithCookieAsync();
        var (opponent, opponentCookie) = await Factory.NewPlayerWithCookieAsync();

        // 2. The creator makes a game as white, and the opponent joins it over REST.
        var game = await CreateGameAsync(creator);
        await JoinGameAsync(opponent, game.Code);

        // 3. Both open a hub connection and connect to the game.
        var white = await ConnectAsync(creatorCookie);
        var black = await ConnectAsync(opponentCookie);
        await white.Connection.InvokeAsync("ConnectToGame", game.GameId);
        await black.Connection.InvokeAsync("ConnectToGame", game.GameId);

        // 4. Each receives the current state in reply. Read it so the next one is fresh.
        await NextStateAsync(white);
        await NextStateAsync(black);

        // 5. Play Fool's mate up to black's last move, reading each player's update
        //    after every move.
        await white.Connection.InvokeAsync("SendMove", game.GameId, 1, "{f2 - f3}");
        await NextStateAsync(white);
        await NextStateAsync(black);
        await black.Connection.InvokeAsync("SendMove", game.GameId, 2, "{e7 - e5}");
        await NextStateAsync(white);
        await NextStateAsync(black);
        await white.Connection.InvokeAsync("SendMove", game.GameId, 3, "{g2 - g4}");
        await NextStateAsync(white);
        await NextStateAsync(black);

        // Act: the queen to h4 is checkmate.
        await black.Connection.InvokeAsync("SendMove", game.GameId, 4, "{d8 - h4}");

        // Assert
        var whiteState = await NextStateAsync(white);
        var blackState = await NextStateAsync(black);
        foreach (var state in new[] { whiteState, blackState })
        {
            Assert.Equal("completed", state.Status);
            Assert.Equal("Checkmate", state.Result);
            Assert.Equal("black", state.Winner);
        }
        await white.Connection.DisposeAsync();
        await black.Connection.DisposeAsync();
    }

    [Fact]
    public async Task SendMove_WhenPlayerHasRunOutOfTime_FailsAndSendsBothPlayersTheResult()
    {
        // Arrange
        // 1. Sign in two guests.
        var (creator, creatorCookie) = await Factory.NewPlayerWithCookieAsync();
        var (opponent, opponentCookie) = await Factory.NewPlayerWithCookieAsync();

        // 2. The creator makes a game as white, and the opponent joins it over REST.
        var game = await CreateGameAsync(creator);
        await JoinGameAsync(opponent, game.Code);

        // 3. Both open a hub connection and connect to the game.
        var white = await ConnectAsync(creatorCookie);
        var black = await ConnectAsync(opponentCookie);
        await white.Connection.InvokeAsync("ConnectToGame", game.GameId);
        await black.Connection.InvokeAsync("ConnectToGame", game.GameId);

        // 4. Each receives the current state in reply. Read it so the next one is fresh.
        await NextStateAsync(white);
        await NextStateAsync(black);
        // 5. White plays the first move, which starts black's clock.
        await white.Connection.InvokeAsync("SendMove", game.GameId, 1, "{e2 - e4}");
        await NextStateAsync(white);
        await NextStateAsync(black);

        // 6. Pretend black has been thinking for an hour, far longer than their ten
        //    minutes, by moving the last move's time back in the database.
        await using (var db = _postgres.CreateContext())
        {
            await db.Games
                .Where(g => g.Id == game.GameId)
                .ExecuteUpdateAsync(s => s.SetProperty(g => g.LastMoveAt, DateTime.UtcNow.AddHours(-1)));
        }

        // Act: black tries to move.
        var exception = await Assert.ThrowsAsync<HubException>(
            () => black.Connection.InvokeAsync("SendMove", game.GameId, 2, "{e7 - e5}"));

        // Assert: black's move is refused, and both are told white won on time.
        Assert.EndsWith("out_of_time", exception.Message);
        var whiteState = await NextStateAsync(white);
        var blackState = await NextStateAsync(black);
        foreach (var state in new[] { whiteState, blackState })
        {
            Assert.Equal("completed", state.Status);
            Assert.Equal("Timeout", state.Result);
            Assert.Equal("white", state.Winner);
            Assert.Equal(0, state.BlackTimeRemainingMs);
        }
        await white.Connection.DisposeAsync();
        await black.Connection.DisposeAsync();
    }
}
