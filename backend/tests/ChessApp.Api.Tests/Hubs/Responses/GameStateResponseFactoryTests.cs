using ChessApp.Api.Hubs.Responses;
using ChessApp.Api.Models;

namespace ChessApp.Api.Tests.Hubs.Responses;

public class GameStateResponseFactoryTests
{
    [Fact]
    public void Create_MapsGameIdAndStatus()
    {
        // Arrange
        var playerId = Guid.NewGuid();
        var game = new Game(playerId, PieceColour.White) { Status = GameStatus.Completed };

        // Act
        var response = GameStateResponseFactory.Create(game);

        // Assert
        Assert.Equal(game.Id, response.GameId);
        Assert.Equal("completed", response.Status);
    }

    [Fact]
    public void Create_MapsPositionAndClocks()
    {
        // Arrange
        var playerId = Guid.NewGuid();
        var lastMoveAt = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        var game = new Game(playerId, PieceColour.White)
        {
            GameState = "position",
            CurrentMove = 3,
            WhiteTimeRemainingMs = 590_000,
            BlackTimeRemainingMs = 580_000,
            LastMoveAt = lastMoveAt,
        };

        // Act
        var response = GameStateResponseFactory.Create(game);

        // Assert
        Assert.Equal("position", response.GameState);
        Assert.Equal(3, response.CurrentMove);
        Assert.Equal(590_000, response.WhiteTimeRemainingMs);
        Assert.Equal(580_000, response.BlackTimeRemainingMs);
        Assert.Equal(lastMoveAt, response.LastMoveAt);
    }

    [Fact]
    public void Create_WhenGameNotEnded_ReturnsNoResultOrWinner()
    {
        // Arrange
        var playerId = Guid.NewGuid();
        var game = new Game(playerId, PieceColour.White) { Status = GameStatus.InProgress };

        // Act
        var response = GameStateResponseFactory.Create(game);

        // Assert
        Assert.Null(response.Result);
        Assert.Null(response.Winner);
    }

    [Theory]
    [InlineData(PieceColour.White, "white")]
    [InlineData(PieceColour.Black, "black")]
    public void Create_WhenGameWon_ReturnsResultAndTheWinnersColour(PieceColour winner, string expected)
    {
        // Arrange
        var white = Guid.NewGuid();
        var black = Guid.NewGuid();
        var game = new Game(white, PieceColour.White)
        {
            BlackClientId = black,
            Status = GameStatus.Completed,
            Result = GameResult.Checkmate,
            WinningPlayerId = winner == PieceColour.White ? white : black,
        };

        // Act
        var response = GameStateResponseFactory.Create(game);

        // Assert
        Assert.Equal("Checkmate", response.Result);
        Assert.Equal(expected, response.Winner);
    }

    [Fact]
    public void Create_WhenGameDrawn_ReturnsResultWithNoWinner()
    {
        // Arrange
        var playerId = Guid.NewGuid();
        var game = new Game(playerId, PieceColour.White)
        {
            BlackClientId = Guid.NewGuid(),
            Status = GameStatus.Completed,
            Result = GameResult.Stalemate,
        };

        // Act
        var response = GameStateResponseFactory.Create(game);

        // Assert
        Assert.Equal("Stalemate", response.Result);
        Assert.Null(response.Winner);
    }
}
