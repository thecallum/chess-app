using ChessApp.Api.Controllers.Responses;
using ChessApp.Api.Models;

namespace ChessApp.Api.Tests.Controllers.Responses;

public class GameResponseFactoryTests
{
    [Fact]
    public void Create_MapsGameIdAndInviteCode()
    {
        // Arrange
        var playerId = Guid.NewGuid();
        var game = new Game(playerId, PieceColour.White, "ABC123");

        // Act
        var response = GameResponseFactory.Create(game, playerId);

        // Assert
        Assert.Equal(game.Id, response.GameId);
        Assert.Equal("ABC123", response.Code);
    }

    [Fact]
    public void Create_WhenGameHasNoInviteCode_ReturnsEmptyCode()
    {
        // Arrange
        var playerId = Guid.NewGuid();
        var game = new Game(playerId, PieceColour.White);

        // Act
        var response = GameResponseFactory.Create(game, playerId);

        // Assert
        Assert.Equal("", response.Code);
    }

    [Theory]
    [InlineData(PieceColour.White, "white")]
    [InlineData(PieceColour.Black, "black")]
    public void Create_WhenPlayerOwnsGame_ReturnsTheirColour(PieceColour ownerColour, string expected)
    {
        // Arrange
        var playerId = Guid.NewGuid();
        var game = new Game(playerId, ownerColour);

        // Act
        var response = GameResponseFactory.Create(game, playerId);

        // Assert
        Assert.Equal(expected, response.Colour);
    }

    [Fact]
    public void Create_WhenPlayerIsTheJoiningOpponent_ReturnsTheOtherColour()
    {
        // Arrange
        var joinerId = Guid.NewGuid();
        var game = new Game(Guid.NewGuid(), PieceColour.White) { BlackClientId = joinerId };

        // Act
        var response = GameResponseFactory.Create(game, joinerId);

        // Assert
        Assert.Equal("black", response.Colour);
    }

    [Fact]
    public void Create_WhenWaitingForOpponent_ReturnsWaitingStatus()
    {
        // Arrange
        var playerId = Guid.NewGuid();
        var game = new Game(playerId, PieceColour.White) { Status = GameStatus.WaitingForOpponent };

        // Act
        var response = GameResponseFactory.Create(game, playerId);

        // Assert
        Assert.Equal("waiting", response.Status);
    }

    [Theory]
    [InlineData(GameStatus.WaitingForFirstMove)]
    [InlineData(GameStatus.InProgress)]
    public void Create_WhenOpponentHasJoined_ReturnsInProgressStatus(GameStatus status)
    {
        // Arrange
        var playerId = Guid.NewGuid();
        var game = new Game(playerId, PieceColour.White) { BlackClientId = Guid.NewGuid(), Status = status };

        // Act
        var response = GameResponseFactory.Create(game, playerId);

        // Assert
        Assert.Equal("in_progress", response.Status);
    }

    [Fact]
    public void Create_WhenCompleted_ReturnsCompletedStatus()
    {
        // Arrange
        var playerId = Guid.NewGuid();
        var game = new Game(playerId, PieceColour.White) { Status = GameStatus.Completed };

        // Act
        var response = GameResponseFactory.Create(game, playerId);

        // Assert
        Assert.Equal("completed", response.Status);
    }

    [Fact]
    public void Create_MapsPositionMovesAndClocks()
    {
        // Arrange
        var playerId = Guid.NewGuid();
        var lastMoveAt = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        var game = new Game(playerId, PieceColour.White)
        {
            GameState = "position",
            CurrentMove = 3,
            Moves = ["{e2 - e4}", "{e7 - e5}"],
            WhiteTimeRemainingMs = 590_000,
            BlackTimeRemainingMs = 580_000,
            LastMoveAt = lastMoveAt,
        };

        // Act
        var response = GameResponseFactory.Create(game, playerId);

        // Assert
        Assert.Equal("position", response.GameState);
        Assert.Equal(3, response.CurrentMove);
        Assert.Equal(["{e2 - e4}", "{e7 - e5}"], response.Moves);
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
        var response = GameResponseFactory.Create(game, playerId);

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
        var response = GameResponseFactory.Create(game, white);

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
        var response = GameResponseFactory.Create(game, playerId);

        // Assert
        Assert.Equal("Stalemate", response.Result);
        Assert.Null(response.Winner);
    }
}
