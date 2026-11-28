using Chess;
using ChessApp.Api.Gateways;
using ChessApp.Api.Gateways.Interfaces;
using ChessApp.Api.Models;
using Moq;

namespace ChessApp.Api.Tests.Gateways;

public class ChessEngineTests
{
    private const string GameState = "position-before";
    private const string NewGameState = "position-after";
    private const string AMove = "{e2 - e4}";

    private readonly Mock<IChessBoard> _board = new();

    private ChessEngine NewEngine() => new(_board.Object);

    // A board that loads GameState and accepts the move.
    private void SetupBoardAcceptingMove(EndGameInfo? endGame = null)
    {
        _board.Setup(b => b.LoadFromFen(GameState)).Returns(true);
        _board.Setup(b => b.Move(AMove)).Returns(true);
        _board.Setup(b => b.ToFen()).Returns(NewGameState);
        _board.Setup(b => b.EndGame).Returns(endGame);
    }

    [Fact]
    public void InitGame_ReturnsStartingPosition()
    {
        // Arrange
        _board.Setup(b => b.ToFen()).Returns("starting-position");

        // Act
        var result = NewEngine().InitGame();

        // Assert
        Assert.Equal("starting-position", result);
    }

    [Fact]
    public void MakeMove_WhenGameStateInvalid_ReturnsIllegalResult()
    {
        // Arrange
        _board.Setup(b => b.LoadFromFen(GameState)).Returns(false);

        // Act
        var result = NewEngine().MakeMove(GameState, AMove);

        // Assert
        Assert.Equal(new MakeMoveResult(false, null, null, null), result);
    }

    [Fact]
    public void MakeMove_WhenBoardRejectsMove_ReturnsIllegalResult()
    {
        // Arrange
        _board.Setup(b => b.LoadFromFen(GameState)).Returns(true);
        _board.Setup(b => b.Move(AMove)).Returns(false);

        // Act
        var result = NewEngine().MakeMove(GameState, AMove);

        // Assert
        Assert.Equal(new MakeMoveResult(false, null, null, null), result);
    }

    [Fact]
    public void MakeMove_WhenBoardThrowsForMove_ReturnsIllegalResult()
    {
        // Arrange
        _board.Setup(b => b.LoadFromFen(GameState)).Returns(true);
        _board.Setup(b => b.Move(AMove))
            .Throws(new ChessArgumentException(new ChessBoard(), "Malformed move"));

        // Act
        var result = NewEngine().MakeMove(GameState, AMove);

        // Assert
        Assert.Equal(new MakeMoveResult(false, null, null, null), result);
    }

    [Fact]
    public void MakeMove_WhenGameNotEnded_ReturnsNewPositionWithNoResult()
    {
        // Arrange
        SetupBoardAcceptingMove(endGame: null);

        // Act
        var result = NewEngine().MakeMove(GameState, AMove);

        // Assert
        Assert.Equal(new MakeMoveResult(true, NewGameState, null, null), result);
    }

    [Theory]
    [InlineData(EndgameType.Checkmate, GameResult.Checkmate)]
    [InlineData(EndgameType.Stalemate, GameResult.Stalemate)]
    [InlineData(EndgameType.InsufficientMaterial, GameResult.InsufficientMaterial)]
    [InlineData(EndgameType.FiftyMoveRule, GameResult.FiftyMoveRule)]
    [InlineData(EndgameType.Repetition, GameResult.Repetition)]
    public void MakeMove_WhenMoveEndsGame_ReturnsResult(EndgameType endgameType, GameResult expected)
    {
        // Arrange
        SetupBoardAcceptingMove(new EndGameInfo(endgameType, PieceColor.White));

        // Act
        var result = NewEngine().MakeMove(GameState, AMove);

        // Assert
        Assert.True(result.IsLegal);
        Assert.Equal(NewGameState, result.Fen);
        Assert.Equal(expected, result.End);
    }

    [Theory]
    [InlineData(true, PieceColour.White)]
    [InlineData(false, PieceColour.Black)]
    public void MakeMove_WhenMoveWinsGame_ReturnsWinner(bool whiteWins, PieceColour expected)
    {
        // Arrange
        var wonSide = whiteWins ? PieceColor.White : PieceColor.Black;
        SetupBoardAcceptingMove(new EndGameInfo(EndgameType.Checkmate, wonSide));

        // Act
        var result = NewEngine().MakeMove(GameState, AMove);

        // Assert
        Assert.Equal(expected, result.Winner);
    }

    [Fact]
    public void MakeMove_WhenMoveEndsInDraw_ReturnsNoWinner()
    {
        // Arrange
        SetupBoardAcceptingMove(new EndGameInfo(EndgameType.Stalemate, null!));

        // Act
        var result = NewEngine().MakeMove(GameState, AMove);

        // Assert
        Assert.Equal(GameResult.Stalemate, result.End);
        Assert.Null(result.Winner);
    }
}
