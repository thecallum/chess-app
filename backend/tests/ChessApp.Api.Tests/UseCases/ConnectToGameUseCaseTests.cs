using ChessApp.Api.Gateways.Interfaces;
using ChessApp.Api.Models;
using ChessApp.Api.UseCases;
using Moq;

namespace ChessApp.Api.Tests.UseCases;

public class ConnectToGameUseCaseTests
{
    private readonly Mock<IGamesGateway> _gateway = new();

    private ConnectToGameUseCase NewUseCase() => new(_gateway.Object);

    [Fact]
    public async Task Execute_WhenGameNotFound_ReturnsNotFoundError()
    {
        // Arrange
        var gameId = Guid.NewGuid();
        _gateway.Setup(g => g.GetGameByIdAsync(gameId)).ReturnsAsync((Game?)null);

        // Act
        var result = await NewUseCase().ExecuteAsync(Guid.NewGuid(), gameId);

        // Assert
        Assert.Null(result.Game);
        Assert.Equal(ConnectToGameError.NotFound, result.Error);
    }

    [Fact]
    public async Task Execute_WhenPlayerNotInGame_ReturnsAccessDeniedError()
    {
        // Arrange
        var game = new Game(Guid.NewGuid(), PieceColour.White);
        _gateway.Setup(g => g.GetGameByIdAsync(game.Id)).ReturnsAsync(game);

        // Act
        var result = await NewUseCase().ExecuteAsync(Guid.NewGuid(), game.Id);

        // Assert
        Assert.Null(result.Game);
        Assert.Equal(ConnectToGameError.AccessDenied, result.Error);
    }

    [Fact]
    public async Task Execute_WhenPlayerInGame_ReturnsGame()
    {
        // Arrange
        var playerId = Guid.NewGuid();
        var game = new Game(playerId, PieceColour.White);
        _gateway.Setup(g => g.GetGameByIdAsync(game.Id)).ReturnsAsync(game);

        // Act
        var result = await NewUseCase().ExecuteAsync(playerId, game.Id);

        // Assert
        Assert.Null(result.Error);
        Assert.Same(game, result.Game);
    }
}
