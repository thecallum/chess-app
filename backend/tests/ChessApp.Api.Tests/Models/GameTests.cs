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

    // IsGameActive

    [Theory]
    [InlineData(GameStatus.WaitingForOpponent, false)]
    [InlineData(GameStatus.WaitingForFirstMove, true)]
    [InlineData(GameStatus.InProgress, true)]
    [InlineData(GameStatus.Completed, false)]
    public void IsGameActive_ReturnsWhetherTheStatusIsPlayable(GameStatus status, bool expected)
    {
        // Arrange
        var game = new Game(Guid.NewGuid(), PieceColour.White) { Status = status };

        // Act
        var isActive = game.IsGameActive();

        // Assert
        Assert.Equal(expected, isActive);
    }

    [Fact]
    public void IsGameActive_WhenCompletedAtIsSet_ReturnsFalse()
    {
        // Arrange
        var game = new Game(Guid.NewGuid(), PieceColour.White)
        {
            Status = GameStatus.InProgress,
            CompletedAt = DateTime.UtcNow,
        };

        // Act
        var isActive = game.IsGameActive();

        // Assert
        Assert.False(isActive);
    }

    // IsPlayersTurn

    [Theory]
    [InlineData(1, PieceColour.White, true)]
    [InlineData(1, PieceColour.Black, false)]
    [InlineData(2, PieceColour.Black, true)]
    [InlineData(2, PieceColour.White, false)]
    [InlineData(3, PieceColour.White, true)]
    public void IsPlayersTurn_WhiteOnOddMovesBlackOnEven(int currentMove, PieceColour colour, bool expected)
    {
        // Arrange
        var game = new Game(Guid.NewGuid(), PieceColour.White) { CurrentMove = currentMove };

        // Act
        var isTurn = game.IsPlayersTurn(colour);

        // Assert
        Assert.Equal(expected, isTurn);
    }

    // CalculateTimeRemaining

    [Fact]
    public void CalculateTimeRemaining_BeforeAnyMove_ReturnsTheStoredTime()
    {
        // Arrange
        var game = new Game(Guid.NewGuid(), PieceColour.White) { WhiteTimeRemainingMs = 600_000 };

        // Act
        var timeRemaining = game.CalculateTimeRemaining(PieceColour.White, DateTime.UtcNow);

        // Assert
        Assert.Equal(600_000, timeRemaining);
    }

    [Theory]
    [InlineData(PieceColour.White, 595_000)]
    [InlineData(PieceColour.Black, 395_000)]
    public void CalculateTimeRemaining_TakesTheTimeSinceTheLastMoveOffThatPlayersClock(
        PieceColour colour, int expected)
    {
        // Arrange
        var now = new DateTime(2026, 1, 1, 12, 0, 5, DateTimeKind.Utc);
        var game = new Game(Guid.NewGuid(), PieceColour.White)
        {
            WhiteTimeRemainingMs = 600_000,
            BlackTimeRemainingMs = 400_000,
            LastMoveAt = now.AddSeconds(-5),
        };

        // Act
        var timeRemaining = game.CalculateTimeRemaining(colour, now);

        // Assert
        Assert.Equal(expected, timeRemaining);
    }

    [Fact]
    public void CalculateTimeRemaining_WhenTimeHasRunOut_ReturnsANegativeTime()
    {
        // Arrange
        var now = new DateTime(2026, 1, 1, 12, 0, 5, DateTimeKind.Utc);
        var game = new Game(Guid.NewGuid(), PieceColour.White)
        {
            WhiteTimeRemainingMs = 1_000,
            LastMoveAt = now.AddSeconds(-5),
        };

        // Act
        var timeRemaining = game.CalculateTimeRemaining(PieceColour.White, now);

        // Assert
        Assert.Equal(-4_000, timeRemaining);
    }

    // Start

    [Fact]
    public void Start_SetsStartedAtAndInProgress()
    {
        // Arrange
        var now = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        var game = new Game(Guid.NewGuid(), PieceColour.White) { Status = GameStatus.WaitingForFirstMove };

        // Act
        game.Start(now);

        // Assert
        Assert.Equal(now, game.StartedAt);
        Assert.Equal(GameStatus.InProgress, game.Status);
    }

    // RecordMove

    [Fact]
    public void RecordMove_RecordsTheMovePositionMoveNumberAndTime()
    {
        // Arrange
        var now = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        var game = new Game(Guid.NewGuid(), PieceColour.White) { GameState = "position-before" };

        // Act
        game.RecordMove("{e2 - e4}", "position-after", PieceColour.White, 590_000, now);

        // Assert
        Assert.Equal(["{e2 - e4}"], game.Moves);
        Assert.Equal("position-after", game.GameState);
        Assert.Equal(2, game.CurrentMove);
        Assert.Equal(now, game.LastMoveAt);
    }

    [Theory]
    [InlineData(PieceColour.White)]
    [InlineData(PieceColour.Black)]
    public void RecordMove_SetsOnlyTheMoversClock(PieceColour mover)
    {
        // Arrange
        var game = new Game(Guid.NewGuid(), PieceColour.White)
        {
            WhiteTimeRemainingMs = 600_000,
            BlackTimeRemainingMs = 600_000,
        };

        // Act
        game.RecordMove("{e2 - e4}", "position-after", mover, 590_000, DateTime.UtcNow);

        // Assert
        Assert.Equal(mover == PieceColour.White ? 590_000 : 600_000, game.WhiteTimeRemainingMs);
        Assert.Equal(mover == PieceColour.Black ? 590_000 : 600_000, game.BlackTimeRemainingMs);
    }

    // IsRepeatOfLastMove

    [Fact]
    public void IsRepeatOfLastMove_WhenSameMoveNumberPlayerAndMove_ReturnsTrue()
    {
        // Arrange: white has played move 1.
        var game = new Game(Guid.NewGuid(), PieceColour.White) { Moves = ["{e2 - e4}"], CurrentMove = 2 };

        // Act
        var isRepeat = game.IsRepeatOfLastMove(1, PieceColour.White, "{e2 - e4}");

        // Assert
        Assert.True(isRepeat);
    }

    [Fact]
    public void IsRepeatOfLastMove_WhenNoMovesPlayed_ReturnsFalse()
    {
        // Arrange
        var game = new Game(Guid.NewGuid(), PieceColour.White);

        // Act
        var isRepeat = game.IsRepeatOfLastMove(1, PieceColour.White, "{e2 - e4}");

        // Assert
        Assert.False(isRepeat);
    }

    [Theory]
    [InlineData(2, PieceColour.White, "{e2 - e4}")] // not the last move's number
    [InlineData(1, PieceColour.Black, "{e2 - e4}")] // not the player who played it
    [InlineData(1, PieceColour.White, "{d2 - d4}")] // a different move
    public void IsRepeatOfLastMove_WhenAnythingDiffers_ReturnsFalse(int moveId, PieceColour colour, string move)
    {
        // Arrange: white has played move 1.
        var game = new Game(Guid.NewGuid(), PieceColour.White) { Moves = ["{e2 - e4}"], CurrentMove = 2 };

        // Act
        var isRepeat = game.IsRepeatOfLastMove(moveId, colour, move);

        // Assert
        Assert.False(isRepeat);
    }

    // TimeOut

    [Theory]
    [InlineData(PieceColour.White)]
    [InlineData(PieceColour.Black)]
    public void TimeOut_ZeroesThePlayersClockAndTheOpponentWins(PieceColour player)
    {
        // Arrange
        var now = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        var white = Guid.NewGuid();
        var black = Guid.NewGuid();
        var game = new Game(white, PieceColour.White)
        {
            BlackClientId = black,
            Status = GameStatus.InProgress,
            WhiteTimeRemainingMs = 1_000,
            BlackTimeRemainingMs = 1_000,
        };

        // Act
        game.TimeOut(player, now);

        // Assert
        Assert.Equal(player == PieceColour.White ? 0 : 1_000, game.WhiteTimeRemainingMs);
        Assert.Equal(player == PieceColour.Black ? 0 : 1_000, game.BlackTimeRemainingMs);
        Assert.Equal(GameStatus.Completed, game.Status);
        Assert.Equal(GameResult.Timeout, game.Result);
        Assert.Equal(player == PieceColour.White ? black : white, game.WinningPlayerId);
        Assert.Equal(now, game.CompletedAt);
    }

    // Complete

    [Fact]
    public void Complete_SetsStatusResultAndTime()
    {
        // Arrange
        var now = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        var game = new Game(Guid.NewGuid(), PieceColour.White) { Status = GameStatus.InProgress };

        // Act
        game.Complete(GameResult.Checkmate, PieceColour.White, now);

        // Assert
        Assert.Equal(GameStatus.Completed, game.Status);
        Assert.Equal(GameResult.Checkmate, game.Result);
        Assert.Equal(now, game.CompletedAt);
    }

    [Theory]
    [InlineData(PieceColour.White)]
    [InlineData(PieceColour.Black)]
    public void Complete_WhenThereIsAWinner_SetsTheirPlayerId(PieceColour winner)
    {
        // Arrange
        var white = Guid.NewGuid();
        var black = Guid.NewGuid();
        var game = new Game(white, PieceColour.White) { BlackClientId = black };

        // Act
        game.Complete(GameResult.Checkmate, winner, DateTime.UtcNow);

        // Assert
        Assert.Equal(winner == PieceColour.White ? white : black, game.WinningPlayerId);
    }

    [Fact]
    public void Complete_WhenADraw_SetsNoWinner()
    {
        // Arrange
        var game = new Game(Guid.NewGuid(), PieceColour.White) { BlackClientId = Guid.NewGuid() };

        // Act
        game.Complete(GameResult.Stalemate, null, DateTime.UtcNow);

        // Assert
        Assert.Null(game.WinningPlayerId);
    }
}
