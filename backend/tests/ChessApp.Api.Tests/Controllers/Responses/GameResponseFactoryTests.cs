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
}
