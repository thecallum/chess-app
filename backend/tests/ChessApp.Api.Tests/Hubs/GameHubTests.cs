using System.Security.Claims;
using ChessApp.Api.Controllers.Responses;
using ChessApp.Api.Hubs;
using ChessApp.Api.Models;
using ChessApp.Api.UseCases;
using ChessApp.Api.UseCases.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace ChessApp.Api.Tests.Hubs;

public class GameHubTests
{
    private readonly Mock<IConnectToGameUseCase> _connectToGameUseCase = new();
    private readonly Mock<ISendMoveUseCase> _sendMoveUseCase = new();

    // What SignalR normally gives a hub: the caller's connection and user, the
    // groups, and the clients to send to.
    private readonly Mock<HubCallerContext> _context = new();
    private readonly Mock<IGroupManager> _groups = new();
    private readonly Mock<IHubCallerClients> _clients = new();
    private readonly Mock<ISingleClientProxy> _caller = new();

    private readonly Guid _playerId = Guid.NewGuid();
    private const string ConnectionId = "connection-1";
    private const string AMove = "{e2 - e4}";

    private GameHub NewHub()
    {
        // The guest's id, as the auth handler puts it on the user.
        var user = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, _playerId.ToString())], "Guest"));
        _context.Setup(c => c.User).Returns(user);
        _context.Setup(c => c.ConnectionId).Returns(ConnectionId);
        _clients.Setup(c => c.Caller).Returns(_caller.Object);

        return new GameHub(
            NullLogger<GameHub>.Instance,
            _connectToGameUseCase.Object,
            _sendMoveUseCase.Object)
        {
            Context = _context.Object,
            Groups = _groups.Object,
            Clients = _clients.Object,
        };
    }

    // ConnectToGame

    [Fact]
    public async Task ConnectToGame_WhenGameNotFound_ThrowsNotFound()
    {
        // Arrange
        var gameId = Guid.NewGuid();
        _connectToGameUseCase.Setup(u => u.ExecuteAsync(_playerId, gameId))
            .ReturnsAsync(new ConnectToGameResult(null, ConnectToGameError.NotFound));

        // Act
        var exception = await Assert.ThrowsAsync<HubException>(() => NewHub().ConnectToGame(gameId));

        // Assert
        Assert.Equal("not_found", exception.Message);
    }

    [Fact]
    public async Task ConnectToGame_WhenAccessDenied_ThrowsAccessDenied()
    {
        // Arrange
        var gameId = Guid.NewGuid();
        _connectToGameUseCase.Setup(u => u.ExecuteAsync(_playerId, gameId))
            .ReturnsAsync(new ConnectToGameResult(null, ConnectToGameError.AccessDenied));

        // Act
        var exception = await Assert.ThrowsAsync<HubException>(() => NewHub().ConnectToGame(gameId));

        // Assert
        Assert.Equal("access_denied", exception.Message);
    }

    [Fact]
    public async Task ConnectToGame_WhenGameFound_AddsConnectionToTheGamesGroup()
    {
        // Arrange
        var game = new Game(_playerId, PieceColour.White);
        _connectToGameUseCase.Setup(u => u.ExecuteAsync(_playerId, game.Id))
            .ReturnsAsync(new ConnectToGameResult(game, null));

        // Act
        await NewHub().ConnectToGame(game.Id);

        // Assert
        _groups.Verify(g => g.AddToGroupAsync(
            ConnectionId, $"game:{game.Id}", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ConnectToGame_WhenGameFound_SendsTheCallerTheirGameState()
    {
        // Arrange
        var game = new Game(_playerId, PieceColour.White);
        _connectToGameUseCase.Setup(u => u.ExecuteAsync(_playerId, game.Id))
            .ReturnsAsync(new ConnectToGameResult(game, null));
        var expected = GameResponseFactory.Create(game, _playerId);

        // Act
        await NewHub().ConnectToGame(game.Id);

        // Assert
        _caller.Verify(c => c.SendCoreAsync(
            "GameState",
            It.Is<object?[]>(args => args.Length == 1 && Equals(args[0], expected)),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    // SendMove

    [Theory]
    [InlineData(SendMoveError.NotFound, "not_found")]
    [InlineData(SendMoveError.AccessDenied, "access_denied")]
    [InlineData(SendMoveError.GameNotActive, "game_not_active")]
    [InlineData(SendMoveError.StaleMove, "stale_move")]
    [InlineData(SendMoveError.NotYourTurn, "not_your_turn")]
    [InlineData(SendMoveError.OutOfTime, "out_of_time")]
    [InlineData(SendMoveError.IllegalMove, "illegal_move")]
    public async Task SendMove_WhenUseCaseReturnsAnError_ThrowsTheMatchingMessage(
        SendMoveError error, string expectedMessage)
    {
        // Arrange
        var gameId = Guid.NewGuid();
        _sendMoveUseCase.Setup(u => u.ExecuteAsync(_playerId, gameId, 1, AMove))
            .ReturnsAsync(new SendMoveResult(null, error));

        // Act
        var exception = await Assert.ThrowsAsync<HubException>(
            () => NewHub().SendMove(gameId, 1, AMove));

        // Assert
        Assert.Equal(expectedMessage, exception.Message);
    }

    [Fact]
    public async Task SendMove_WhenMoveRepeated_CompletesWithoutAnError()
    {
        // Arrange
        var gameId = Guid.NewGuid();
        _sendMoveUseCase.Setup(u => u.ExecuteAsync(_playerId, gameId, 1, AMove))
            .ReturnsAsync(new SendMoveResult(null, SendMoveError.RepeatedMove));

        // Act
        var exception = await Record.ExceptionAsync(() => NewHub().SendMove(gameId, 1, AMove));

        // Assert
        Assert.Null(exception);
    }

    [Fact]
    public async Task SendMove_WhenMoveValid_CompletesWithoutAnError()
    {
        // Arrange
        var game = new Game(_playerId, PieceColour.White);
        _sendMoveUseCase.Setup(u => u.ExecuteAsync(_playerId, game.Id, 1, AMove))
            .ReturnsAsync(new SendMoveResult(game, null));

        // Act
        var exception = await Record.ExceptionAsync(() => NewHub().SendMove(game.Id, 1, AMove));

        // Assert
        Assert.Null(exception);
        _sendMoveUseCase.Verify(u => u.ExecuteAsync(_playerId, game.Id, 1, AMove), Times.Once);
    }
}
