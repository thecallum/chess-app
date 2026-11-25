using ChessApp.Api.Models;

namespace ChessApp.Api.Tests.Models;

public class GameTests
{
    // IsParticipant

    [Theory]
    [InlineData(PieceColour.White)]
    [InlineData(PieceColour.Black)]
    public void IsParticipant_WhenPlayerHoldsASeat_ReturnsTrue(PieceColour colour)
    {
        // Arrange
        var playerId = Guid.NewGuid();
        var game = new Game(playerId, colour);

        // Act
        var isParticipant = game.IsParticipant(playerId);

        // Assert
        Assert.True(isParticipant);
    }

    [Fact]
    public void IsParticipant_WhenOpponentHoldsTheOtherSeat_ReturnsTrueForBothPlayers()
    {
        // Arrange
        var owner = Guid.NewGuid();
        var opponent = Guid.NewGuid();
        var game = new Game(owner, PieceColour.White) { BlackClientId = opponent };

        // Act
        var ownerIsParticipant = game.IsParticipant(owner);
        var opponentIsParticipant = game.IsParticipant(opponent);

        // Assert
        Assert.True(ownerIsParticipant);
        Assert.True(opponentIsParticipant);
    }

    [Fact]
    public void IsParticipant_WhenPlayerHoldsNoSeat_ReturnsFalse()
    {
        // Arrange
        var game = new Game(Guid.NewGuid(), PieceColour.White) { BlackClientId = Guid.NewGuid() };

        // Act
        var isParticipant = game.IsParticipant(Guid.NewGuid());

        // Assert
        Assert.False(isParticipant);
    }

    [Fact]
    public void IsParticipant_WhenASeatIsEmpty_ReturnsFalseForEmptyId()
    {
        // Arrange
        var game = new Game(Guid.NewGuid(), PieceColour.White);

        // Act
        var isParticipant = game.IsParticipant(Guid.Empty);

        // Assert
        Assert.False(isParticipant);
    }
}
