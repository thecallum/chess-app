using ChessApp.Api.Gateways;
using ChessApp.Api.Gateways.Interfaces;
using ChessApp.Api.Models;

namespace ChessApp.Api.Tests.Gateways;

[Collection(PostgresCollection.Name)]
public class GamesGatewayTests : IAsyncLifetime
{
    private readonly PostgresFixture _postgres;

    public GamesGatewayTests(PostgresFixture postgres)
    {
        _postgres = postgres;
    }

    public Task InitializeAsync() => _postgres.ResetAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    // Each call gets its own context, like separate requests would.
    private GamesGateway NewGateway() => new(_postgres.CreateContext());

    private static Game NewGame(PieceColour ownerColour = PieceColour.White, string? code = null) =>
        new(Guid.NewGuid(), ownerColour, code ?? Guid.NewGuid().ToString("N"));

    // CreateGameAsync

    [Fact]
    public async Task CreateGame_WhenCodeAlreadyUsed_ReturnsFalse()
    {
        // Arrange
        var first = NewGame(code: "SAME");
        var second = NewGame(code: "SAME");
        await NewGateway().CreateGameAsync(first);

        // Act
        var created = await NewGateway().CreateGameAsync(second);

        // Assert
        Assert.False(created);
        Assert.Null(await NewGateway().GetGameByIdAsync(second.Id));
        Assert.NotNull(await NewGateway().GetGameByIdAsync(first.Id));
    }

    [Fact]
    public async Task CreateGame_WhenValid_CreatesGame()
    {
        // Arrange
        var game = NewGame(PieceColour.Black, "ABC123");

        // Act
        var created = await NewGateway().CreateGameAsync(game);

        // Assert
        Assert.True(created);
        var saved = await NewGateway().GetGameByIdAsync(game.Id);
        Assert.NotNull(saved);
        Assert.Equal("ABC123", saved.GameInviteCode);
        Assert.Equal(game.BlackClientId, saved.BlackClientId);
        Assert.Null(saved.WhiteClientId);
        Assert.Equal(GameStatus.WaitingForOpponent, saved.Status);
    }

    // GetGameByIdAsync

    [Fact]
    public async Task GetGameByIdAsync_WhenNotFound_ReturnsNull()
    {
        // Arrange
        var unknownId = Guid.NewGuid();

        // Act
        var game = await NewGateway().GetGameByIdAsync(unknownId);

        // Assert
        Assert.Null(game);
    }

    [Fact]
    public async Task GetGameByIdAsync_WhenFound_ReturnsGame()
    {
        // Arrange
        var game = NewGame();
        await NewGateway().CreateGameAsync(game);

        // Act
        var found = await NewGateway().GetGameByIdAsync(game.Id);

        // Assert
        Assert.NotNull(found);
        Assert.Equal(game.Id, found.Id);
        Assert.Equal(game.GameInviteCode, found.GameInviteCode);
    }

    // JoinGameByCodeAsync

    [Fact]
    public async Task JoinGame_WhenGameNotFound_ReturnsInvalidCodeResponse()
    {
        // Arrange
        var playerId = Guid.NewGuid();

        // Act
        var result = await NewGateway().JoinGameByCodeAsync("NOSUCHCODE", playerId);

        // Assert
        Assert.Null(result.Game);
        Assert.Equal(JoinGameByCodeError.InvalidCode, result.Error);
    }

    [Fact]
    public async Task JoinGame_WhenAlreadyInTheGame_ReturnsTheGame()
    {
        // Arrange
        var game = NewGame(PieceColour.White, "MINE");
        await NewGateway().CreateGameAsync(game);

        // Act
        var result = await NewGateway().JoinGameByCodeAsync("MINE", game.WhiteClientId!.Value);

        // Assert
        Assert.Null(result.Error);
        Assert.Equal(game.Id, result.Game?.Id);
        Assert.Null(result.Game?.BlackClientId);
    }

    [Fact]
    public async Task JoinGame_WhenInviteClosed_ReturnsNotJoinableError()
    {
        // Arrange
        var game = NewGame(PieceColour.White, "CLOSED");
        game.Status = GameStatus.InProgress;
        await NewGateway().CreateGameAsync(game);

        // Act
        var result = await NewGateway().JoinGameByCodeAsync("CLOSED", Guid.NewGuid());

        // Assert
        Assert.Null(result.Game);
        Assert.Equal(JoinGameByCodeError.NotJoinable, result.Error);
    }

    [Fact]
    public async Task JoinGame_WhenBothPlayersSet_ReturnsGameFullError()
    {
        // Arrange
        // Shouldn't happen while the status is still WaitingForOpponent, but the check exists.
        var game = NewGame(PieceColour.White, "FULL");
        game.BlackClientId = Guid.NewGuid();
        await NewGateway().CreateGameAsync(game);

        // Act
        var result = await NewGateway().JoinGameByCodeAsync("FULL", Guid.NewGuid());

        // Assert
        Assert.Null(result.Game);
        Assert.Equal(JoinGameByCodeError.GameFull, result.Error);
    }

    [Fact]
    public async Task JoinGame_JoinsGameAsWhitePlayer()
    {
        // Arrange
        var game = NewGame(PieceColour.Black, "JOINWHITE");
        await NewGateway().CreateGameAsync(game);
        var joinerId = Guid.NewGuid();

        // Act
        var result = await NewGateway().JoinGameByCodeAsync("JOINWHITE", joinerId);

        // Assert
        Assert.Null(result.Error);
        Assert.Equal(joinerId, result.Game?.WhiteClientId);
        Assert.Equal(game.BlackClientId, result.Game?.BlackClientId);
        Assert.Equal(GameStatus.WaitingForFirstMove, result.Game?.Status);

        var saved = await NewGateway().GetGameByIdAsync(game.Id);
        Assert.Equal(joinerId, saved?.WhiteClientId);
        Assert.Equal(GameStatus.WaitingForFirstMove, saved?.Status);
    }

    [Fact]
    public async Task JoinGame_JoinsGameAsBlackPlayer()
    {
        // Arrange
        var game = NewGame(PieceColour.White, "JOINBLACK");
        await NewGateway().CreateGameAsync(game);
        var joinerId = Guid.NewGuid();

        // Act
        var result = await NewGateway().JoinGameByCodeAsync("JOINBLACK", joinerId);

        // Assert
        Assert.Null(result.Error);
        Assert.Equal(joinerId, result.Game?.BlackClientId);
        Assert.Equal(game.WhiteClientId, result.Game?.WhiteClientId);
        Assert.Equal(GameStatus.WaitingForFirstMove, result.Game?.Status);

        var saved = await NewGateway().GetGameByIdAsync(game.Id);
        Assert.Equal(joinerId, saved?.BlackClientId);
        Assert.Equal(GameStatus.WaitingForFirstMove, saved?.Status);
    }

    // Concurrency.
    // We can't pause the gateway between its read and its update, so this can't force the exact
    // race. Instead it fires many joins at once, each on its own connection. If the seat update
    // weren't atomic, more than one of them would win it.
    [Fact]
    public async Task JoinGame_WhenManyJoinAtOnce_SeatsExactlyOnePlayer()
    {
        // Arrange
        var game = NewGame(PieceColour.White, "RACE");
        await NewGateway().CreateGameAsync(game);
        var joinerIds = Enumerable.Range(0, 8).Select(_ => Guid.NewGuid()).ToList();

        // Act
        var results = await Task.WhenAll(joinerIds.Select(id =>
            Task.Run(() => NewGateway().JoinGameByCodeAsync("RACE", id))));

        // Assert
        var winners = results.Where(r => r.Error is null).ToList();
        var losers = results.Where(r => r.Error is not null).ToList();
        Assert.Single(winners);
        Assert.All(losers, r => Assert.True(
            r.Error is JoinGameByCodeError.GameFull or JoinGameByCodeError.NotJoinable));

        var saved = await NewGateway().GetGameByIdAsync(game.Id);
        Assert.Contains(saved!.BlackClientId, joinerIds.Select(id => (Guid?)id));
        Assert.Equal(saved.BlackClientId, winners.Single().Game?.BlackClientId);
    }
}
