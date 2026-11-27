using ChessApp.Api.Gateways.Interfaces;
using ChessApp.Api.Models;
using ChessApp.Api.UseCases;
using Moq;

namespace ChessApp.Api.Tests.UseCases;

public class CreateGameUseCaseTests
{
    private readonly Mock<IGamesGateway> _gateway = new();
    private readonly Mock<IChessEngine> _chessEngine = new();

    private CreateGameUseCase NewUseCase() => new(_gateway.Object, _chessEngine.Object);

    [Fact]
    public async Task Execute_WhenChoosingWhite_SeatsPlayerAsWhite()
    {
        // Arrange
        var playerId = Guid.NewGuid();
        _gateway.Setup(g => g.CreateGameAsync(It.IsAny<Game>())).ReturnsAsync(true);

        // Act
        var game = await NewUseCase().ExecuteAsync(playerId, ColourChoice.White);

        // Assert
        Assert.Equal(playerId, game.WhiteClientId);
        Assert.Null(game.BlackClientId);
    }

    [Fact]
    public async Task Execute_WhenChoosingBlack_SeatsPlayerAsBlack()
    {
        // Arrange
        var playerId = Guid.NewGuid();
        _gateway.Setup(g => g.CreateGameAsync(It.IsAny<Game>())).ReturnsAsync(true);

        // Act
        var game = await NewUseCase().ExecuteAsync(playerId, ColourChoice.Black);

        // Assert
        Assert.Equal(playerId, game.BlackClientId);
        Assert.Null(game.WhiteClientId);
    }

    [Fact]
    public async Task Execute_WhenChoosingRandom_SeatsPlayerInExactlyOneColour()
    {
        // Arrange
        var playerId = Guid.NewGuid();
        _gateway.Setup(g => g.CreateGameAsync(It.IsAny<Game>())).ReturnsAsync(true);

        // Act
        var game = await NewUseCase().ExecuteAsync(playerId, ColourChoice.Random);

        // Assert
        var seats = new[] { game.WhiteClientId, game.BlackClientId };
        Assert.Single(seats, seat => seat == playerId);
        Assert.Single(seats, seat => seat is null);
    }

    [Fact]
    public async Task Execute_SavesGameWithUpperCaseInviteCode()
    {
        // Arrange
        _gateway.Setup(g => g.CreateGameAsync(It.IsAny<Game>())).ReturnsAsync(true);

        // Act
        var game = await NewUseCase().ExecuteAsync(Guid.NewGuid(), ColourChoice.White);

        // Assert
        _gateway.Verify(g => g.CreateGameAsync(game), Times.Once);
        Assert.False(string.IsNullOrEmpty(game.GameInviteCode));
        Assert.Equal(game.GameInviteCode!.ToUpperInvariant(), game.GameInviteCode);
        Assert.Equal(GameStatus.WaitingForOpponent, game.Status);
    }

    [Fact]
    public async Task Execute_WhenInviteCodeAlreadyUsed_RetriesWithNewCode()
    {
        // Arrange
        var attempts = new List<Game>();
        _gateway.SetupSequence(g => g.CreateGameAsync(Capture.In(attempts)))
            .ReturnsAsync(false)
            .ReturnsAsync(true);

        // Act
        var game = await NewUseCase().ExecuteAsync(Guid.NewGuid(), ColourChoice.White);

        // Assert
        Assert.Equal(2, attempts.Count);
        Assert.NotEqual(attempts[0].GameInviteCode, game.GameInviteCode);
        Assert.Same(attempts[1], game);
    }
}
