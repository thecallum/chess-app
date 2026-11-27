using ChessApp.Api.Controllers.Responses;
using ChessApp.Api.Gateways;
using ChessApp.Api.Hubs;
using ChessApp.Api.Models;
using Microsoft.AspNetCore.SignalR;
using Moq;

namespace ChessApp.Api.Tests.Gateways;

public class GameNotifierTests
{
    // IHubContext -> Clients -> User(id) -> SendCoreAsync(...). SendAsync is an
    // extension method that calls SendCoreAsync, so verify SendCoreAsync.
    private readonly Mock<IHubContext<GameHub>> _hubContext = new();
    private readonly Mock<IHubClients> _clients = new();
    private readonly Mock<IClientProxy> _client = new();

    private GameNotifier NewNotifier()
    {
        _hubContext.Setup(h => h.Clients).Returns(_clients.Object);
        return new(_hubContext.Object);
    }

    [Fact]
    public async Task SendGameStateAsync_SendsEachPlayerTheirOwnGameState()
    {
        // Arrange
        var white = Guid.NewGuid();
        var black = Guid.NewGuid();
        var game = new Game(white, PieceColour.White) { BlackClientId = black };
        var whiteClient = new Mock<IClientProxy>();
        var blackClient = new Mock<IClientProxy>();
        _clients.Setup(c => c.User(white.ToString())).Returns(whiteClient.Object);
        _clients.Setup(c => c.User(black.ToString())).Returns(blackClient.Object);

        var expectedForWhite = GameResponseFactory.Create(game, white);
        var expectedForBlack = GameResponseFactory.Create(game, black);

        // Act
        await NewNotifier().SendGameStateAsync(game);

        // Assert: each gets the game as they see it, with their own colour.
        whiteClient.Verify(c => c.SendCoreAsync(
            "GameState",
            It.Is<object?[]>(args => args.Length == 1 && Equals(args[0], expectedForWhite)),
            It.IsAny<CancellationToken>()), Times.Once);
        blackClient.Verify(c => c.SendCoreAsync(
            "GameState",
            It.Is<object?[]>(args => args.Length == 1 && Equals(args[0], expectedForBlack)),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SendGameStateAsync_ForOnePlayer_OnlySendsToThatPlayer()
    {
        // Arrange
        var white = Guid.NewGuid();
        var black = Guid.NewGuid();
        var game = new Game(white, PieceColour.White) { BlackClientId = black };
        _clients.Setup(c => c.User(black.ToString())).Returns(_client.Object);
        var expected = GameResponseFactory.Create(game, black);

        // Act
        await NewNotifier().SendGameStateAsync(game, black);

        // Assert
        _clients.Verify(c => c.User(black.ToString()), Times.Once);
        _clients.Verify(c => c.User(It.IsAny<string>()), Times.Once);
        _client.Verify(c => c.SendCoreAsync(
            "GameState",
            It.Is<object?[]>(args => args.Length == 1 && Equals(args[0], expected)),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SendGameStateAsync_WhenASeatIsEmpty_OnlySendsToTheSeatedPlayer()
    {
        // Arrange: only white is seated.
        var white = Guid.NewGuid();
        var game = new Game(white, PieceColour.White);
        _clients.Setup(c => c.User(white.ToString())).Returns(_client.Object);
        var expected = GameResponseFactory.Create(game, white);

        // Act
        await NewNotifier().SendGameStateAsync(game);

        // Assert
        _clients.Verify(c => c.User(white.ToString()), Times.Once);
        _clients.Verify(c => c.User(It.IsAny<string>()), Times.Once);
        _client.Verify(c => c.SendCoreAsync(
            "GameState",
            It.Is<object?[]>(args => args.Length == 1 && Equals(args[0], expected)),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
