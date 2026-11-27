using ChessApp.Api.Gateways.Interfaces;
using ChessApp.Api.Models;
using ChessApp.Api.UseCases;
using Moq;

namespace ChessApp.Api.Tests.UseCases;

public class JoinGameUseCaseTests
{
    private readonly Mock<IGamesGateway> _gateway = new();
    private readonly Mock<IGameNotifier> _gameNotifier = new();

    private JoinGameUseCase NewUseCase() => new(_gateway.Object, _gameNotifier.Object);

    [Fact]
    public async Task Execute_WhenGatewayJoinsGame_ReturnsGame()
    {
        // Arrange
        var playerId = Guid.NewGuid();
        var game = new Game(Guid.NewGuid(), PieceColour.White, "ABC");
        _gateway.Setup(g => g.JoinGameByCodeAsync("ABC", playerId))
            .ReturnsAsync(new JoinGameByCodeResult(game, null));

        // Act
        var result = await NewUseCase().ExecuteAsync(playerId, "ABC");

        // Assert
        Assert.Null(result.Error);
        Assert.Same(game, result.Game);
    }

    [Fact]
    public async Task Execute_WhenGatewayJoinsGame_SendsGameState()
    {
        // Arrange
        var playerId = Guid.NewGuid();
        var game = new Game(Guid.NewGuid(), PieceColour.White, "ABC");
        _gateway.Setup(g => g.JoinGameByCodeAsync("ABC", playerId))
            .ReturnsAsync(new JoinGameByCodeResult(game, null));

        // Act
        await NewUseCase().ExecuteAsync(playerId, "ABC");

        // Assert
        _gameNotifier.Verify(n => n.SendGameStateAsync(game), Times.Once);
    }

    [Fact]
    public async Task Execute_PassesTrimmedUpperCaseCodeToGateway()
    {
        // Arrange
        var playerId = Guid.NewGuid();
        _gateway.Setup(g => g.JoinGameByCodeAsync(It.IsAny<string>(), It.IsAny<Guid>()))
            .ReturnsAsync(new JoinGameByCodeResult(null, JoinGameByCodeError.InvalidCode));

        // Act
        await NewUseCase().ExecuteAsync(playerId, "  abc123 ");

        // Assert
        _gateway.Verify(g => g.JoinGameByCodeAsync("ABC123", playerId), Times.Once);
    }

    [Theory]
    [InlineData(JoinGameByCodeError.InvalidCode, JoinError.InvalidCode)]
    [InlineData(JoinGameByCodeError.NotJoinable, JoinError.NotJoinable)]
    [InlineData(JoinGameByCodeError.GameFull, JoinError.GameFull)]
    public async Task Execute_WhenGatewayReturnsError_ReturnsMatchingError(
        JoinGameByCodeError gatewayError, JoinError expected)
    {
        // Arrange
        _gateway.Setup(g => g.JoinGameByCodeAsync(It.IsAny<string>(), It.IsAny<Guid>()))
            .ReturnsAsync(new JoinGameByCodeResult(null, gatewayError));

        // Act
        var result = await NewUseCase().ExecuteAsync(Guid.NewGuid(), "ABC");

        // Assert
        Assert.Null(result.Game);
        Assert.Equal(expected, result.Error);
    }

    [Theory]
    [InlineData(JoinGameByCodeError.InvalidCode)]
    [InlineData(JoinGameByCodeError.NotJoinable)]
    [InlineData(JoinGameByCodeError.GameFull)]
    public async Task Execute_WhenGatewayReturnsError_SendsNoGameState(JoinGameByCodeError gatewayError)
    {
        // Arrange
        _gateway.Setup(g => g.JoinGameByCodeAsync(It.IsAny<string>(), It.IsAny<Guid>()))
            .ReturnsAsync(new JoinGameByCodeResult(null, gatewayError));

        // Act
        await NewUseCase().ExecuteAsync(Guid.NewGuid(), "ABC");

        // Assert
        _gameNotifier.Verify(n => n.SendGameStateAsync(It.IsAny<Game>()), Times.Never);
    }
}
