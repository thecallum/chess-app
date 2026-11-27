using ChessApp.Api.Gateways.Interfaces;
using ChessApp.Api.Models;
using ChessApp.Api.UseCases;
using Moq;

namespace ChessApp.Api.Tests.UseCases;

// Game's rule checks (IsParticipant, IsRepeatOfLastMove, IsGameActive, IsPlayersTurn)
// are mocked here, and their own logic is tested in GameTests. A check that a test
// doesn't set up returns false.
public class SendMoveUseCaseTests
{
    private const string Position = "position-before";
    private const string NewPosition = "position-after";
    private const string AMove = "{e2 - e4}";

    private readonly Mock<IGamesGateway> _gateway = new();
    private readonly Mock<IChessEngine> _chessEngine = new();
    // TimeProvider's GetUtcNow is virtual, so Moq can fix the current time.
    private readonly Mock<TimeProvider> _timeProvider = new();
    private readonly Mock<IGameNotifier> _gameNotifier = new();

    private readonly Guid _white = Guid.NewGuid();
    private readonly Guid _black = Guid.NewGuid();

    private SendMoveUseCase NewUseCase() =>
        new(_gateway.Object, _chessEngine.Object, _timeProvider.Object, _gameNotifier.Object);

    [Fact]
    public async Task Execute_WhenGameNotFound_ReturnsNotFoundError()
    {
        // Arrange
        var gameId = Guid.NewGuid();
        _gateway.Setup(g => g.GetGameByIdAsync(gameId)).ReturnsAsync((Game?)null);

        // Act
        var result = await NewUseCase().ExecuteAsync(_white, gameId, 1, AMove);

        // Assert
        Assert.Null(result.Game);
        Assert.Equal(SendMoveError.NotFound, result.Error);
    }

    [Fact]
    public async Task Execute_WhenPlayerNotInGame_ReturnsAccessDeniedError()
    {
        // Arrange
        var game = new Mock<Game>(_white, PieceColour.White, null);
        game.Setup(g => g.IsParticipant(_white)).Returns(false);
        _gateway.Setup(g => g.GetGameByIdAsync(game.Object.Id)).ReturnsAsync(game.Object);

        // Act
        var result = await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        Assert.Null(result.Game);
        Assert.Equal(SendMoveError.AccessDenied, result.Error);
    }

    [Fact]
    public async Task Execute_WhenMoveAlreadyMade_ReturnsRepeatedMoveError()
    {
        // Arrange
        var game = new Mock<Game>(_white, PieceColour.White, null);
        game.Setup(g => g.IsParticipant(_white)).Returns(true);
        game.Setup(g => g.IsRepeatOfLastMove(1, PieceColour.White, AMove)).Returns(true);
        _gateway.Setup(g => g.GetGameByIdAsync(game.Object.Id)).ReturnsAsync(game.Object);

        // Act
        var result = await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        Assert.Null(result.Game);
        Assert.Equal(SendMoveError.RepeatedMove, result.Error);
    }

    [Fact]
    public async Task Execute_WhenGameNotActive_ReturnsGameNotActiveError()
    {
        // Arrange
        var game = new Mock<Game>(_white, PieceColour.White, null);
        game.Setup(g => g.IsParticipant(_white)).Returns(true);
        game.Setup(g => g.IsRepeatOfLastMove(1, PieceColour.White, AMove)).Returns(false);
        game.Setup(g => g.IsGameActive()).Returns(false);
        _gateway.Setup(g => g.GetGameByIdAsync(game.Object.Id)).ReturnsAsync(game.Object);

        // Act
        var result = await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        Assert.Null(result.Game);
        Assert.Equal(SendMoveError.GameNotActive, result.Error);
    }

    [Fact]
    public async Task Execute_WhenMoveIdIsStale_ReturnsStaleMoveError()
    {
        // Arrange: the game is on move 3, and the client sends move 2.
        var game = new Mock<Game>(_white, PieceColour.White, null);
        game.Object.CurrentMove = 3;
        game.Setup(g => g.IsParticipant(_white)).Returns(true);
        game.Setup(g => g.IsRepeatOfLastMove(2, PieceColour.White, AMove)).Returns(false);
        game.Setup(g => g.IsGameActive()).Returns(true);
        _gateway.Setup(g => g.GetGameByIdAsync(game.Object.Id)).ReturnsAsync(game.Object);

        // Act
        var result = await NewUseCase().ExecuteAsync(_white, game.Object.Id, 2, AMove);

        // Assert
        Assert.Null(result.Game);
        Assert.Equal(SendMoveError.StaleMove, result.Error);
    }

    [Fact]
    public async Task Execute_WhenNotPlayersTurn_ReturnsNotYourTurnError()
    {
        // Arrange
        var game = new Mock<Game>(_white, PieceColour.White, null);
        game.Object.BlackClientId = _black;
        game.Setup(g => g.IsParticipant(_black)).Returns(true);
        game.Setup(g => g.IsRepeatOfLastMove(1, PieceColour.Black, AMove)).Returns(false);
        game.Setup(g => g.IsGameActive()).Returns(true);
        game.Setup(g => g.IsPlayersTurn(PieceColour.Black)).Returns(false);
        _gateway.Setup(g => g.GetGameByIdAsync(game.Object.Id)).ReturnsAsync(game.Object);

        // Act
        var result = await NewUseCase().ExecuteAsync(_black, game.Object.Id, 1, AMove);

        // Assert
        Assert.Null(result.Game);
        Assert.Equal(SendMoveError.NotYourTurn, result.Error);
    }

    [Fact]
    public async Task Execute_WhenMoveValid_ReturnsGameWithNoError()
    {
        // Arrange
        var game = new Mock<Game>(_white, PieceColour.White, null);
        game.Object.BlackClientId = _black;
        game.Object.GameState = Position;
        game.Setup(g => g.IsParticipant(_white)).Returns(true);
        game.Setup(g => g.IsRepeatOfLastMove(1, PieceColour.White, AMove)).Returns(false);
        game.Setup(g => g.IsGameActive()).Returns(true);
        game.Setup(g => g.IsPlayersTurn(PieceColour.White)).Returns(true);
        _gateway.Setup(g => g.GetGameByIdAsync(game.Object.Id)).ReturnsAsync(game.Object);
        _timeProvider.Setup(t => t.GetUtcNow())
            .Returns(new DateTimeOffset(2026, 1, 1, 12, 0, 0, TimeSpan.Zero));
        _chessEngine.Setup(e => e.MakeMove(Position, AMove))
            .Returns(new MakeMoveResult(true, NewPosition, null, null));
        _gateway.Setup(g => g.SaveAsync(game.Object, 1)).ReturnsAsync(true);

        // Act
        var result = await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        Assert.Null(result.Error);
        Assert.Same(game.Object, result.Game);
    }


    private static readonly DateTimeOffset Now = new(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);
    private const int TimeLeft = 300_000;

    // A new game where white is to play move 1 and every check passes, with the clock
    // fixed at Now. The gateway returns it. Tests add the setups they're about.
    private Mock<Game> NewGameThatPassesChecks()
    {
        var game = new Mock<Game>(_white, PieceColour.White, null);
        game.Object.BlackClientId = _black;
        game.Object.GameState = Position;
        game.Setup(g => g.IsParticipant(_white)).Returns(true);
        game.Setup(g => g.IsRepeatOfLastMove(1, PieceColour.White, AMove)).Returns(false);
        game.Setup(g => g.IsGameActive()).Returns(true);
        game.Setup(g => g.IsPlayersTurn(PieceColour.White)).Returns(true);
        _gateway.Setup(g => g.GetGameByIdAsync(game.Object.Id)).ReturnsAsync(game.Object);
        _timeProvider.Setup(t => t.GetUtcNow()).Returns(Now);
        return game;
    }

    // As above, and white has time left and the engine accepts the move.
    private Mock<Game> NewGameWithLegalMove(MakeMoveResult? engineResult = null)
    {
        var game = NewGameThatPassesChecks();
        game.Setup(g => g.CalculateTimeRemaining(PieceColour.White, Now.UtcDateTime)).Returns(TimeLeft);
        _chessEngine.Setup(e => e.MakeMove(Position, AMove))
            .Returns(engineResult ?? new MakeMoveResult(true, NewPosition, null, null));
        return game;
    }

    [Fact]
    public async Task Execute_WhenMoveRepeated_ResendsGameState()
    {
        // Arrange
        var game = NewGameThatPassesChecks();
        game.Setup(g => g.IsRepeatOfLastMove(1, PieceColour.White, AMove)).Returns(true);

        // Act
        await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        _gameNotifier.Verify(n => n.SendGameStateAsync(game.Object), Times.Once);
    }

    [Fact]
    public async Task Execute_WhenPlayerRunsOutOfTime_ReturnsOutOfTimeError()
    {
        // Arrange
        var game = NewGameThatPassesChecks();
        game.Setup(g => g.CalculateTimeRemaining(PieceColour.White, Now.UtcDateTime)).Returns(-1);
        _gateway.Setup(g => g.SaveAsync(game.Object, 1)).ReturnsAsync(true);

        // Act
        var result = await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        Assert.Same(game.Object, result.Game);
        Assert.Equal(SendMoveError.OutOfTime, result.Error);
    }

    [Fact]
    public async Task Execute_WhenPlayerRunsOutOfTime_TimesOutTheGame()
    {
        // Arrange
        var game = NewGameThatPassesChecks();
        game.Setup(g => g.CalculateTimeRemaining(PieceColour.White, Now.UtcDateTime)).Returns(-1);
        _gateway.Setup(g => g.SaveAsync(game.Object, 1)).ReturnsAsync(true);

        // Act
        await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        game.Verify(g => g.TimeOut(PieceColour.White, Now.UtcDateTime), Times.Once);
    }

    [Fact]
    public async Task Execute_WhenPlayerRunsOutOfTime_SendsGameState()
    {
        // Arrange
        var game = NewGameThatPassesChecks();
        game.Setup(g => g.CalculateTimeRemaining(PieceColour.White, Now.UtcDateTime)).Returns(-1);
        _gateway.Setup(g => g.SaveAsync(game.Object, 1)).ReturnsAsync(true);

        // Act
        await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        _gameNotifier.Verify(n => n.SendGameStateAsync(game.Object), Times.Once);
    }

    [Fact]
    public async Task Execute_WhenPlayerRunsOutOfTime_ButSaveIsStale_ReturnsStaleMoveError()
    {
        // Arrange
        var game = NewGameThatPassesChecks();
        game.Setup(g => g.CalculateTimeRemaining(PieceColour.White, Now.UtcDateTime)).Returns(-1);
        _gateway.Setup(g => g.SaveAsync(game.Object, 1)).ReturnsAsync(false);

        // Act
        var result = await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        Assert.Null(result.Game);
        Assert.Equal(SendMoveError.StaleMove, result.Error);
    }

    [Fact]
    public async Task Execute_WhenMoveIllegal_ReturnsIllegalMoveError()
    {
        // Arrange
        var game = NewGameWithLegalMove(new MakeMoveResult(false, null, null, null));

        // Act
        var result = await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        Assert.Null(result.Game);
        Assert.Equal(SendMoveError.IllegalMove, result.Error);
    }

    [Fact]
    public async Task Execute_WhenFirstMove_StartsTheGame()
    {
        // Arrange: CurrentMove is 1 on a new game.
        var game = NewGameWithLegalMove();
        _gateway.Setup(g => g.SaveAsync(game.Object, 1)).ReturnsAsync(true);

        // Act
        await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        game.Verify(g => g.Start(Now.UtcDateTime), Times.Once);
    }

    [Fact]
    public async Task Execute_WhenValidMove_RecordsTheMove()
    {
        // Arrange
        var game = NewGameWithLegalMove();
        _gateway.Setup(g => g.SaveAsync(game.Object, 1)).ReturnsAsync(true);

        // Act
        await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        game.Verify(
            g => g.RecordMove(AMove, NewPosition, PieceColour.White, TimeLeft, Now.UtcDateTime),
            Times.Once);
    }

    [Fact]
    public async Task Execute_WhenMoveEndsGame_CompletesTheGame()
    {
        // Arrange
        var game = NewGameWithLegalMove(
            new MakeMoveResult(true, NewPosition, GameResult.Checkmate, PieceColour.White));
        _gateway.Setup(g => g.SaveAsync(game.Object, 1)).ReturnsAsync(true);

        // Act
        await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        game.Verify(
            g => g.Complete(GameResult.Checkmate, PieceColour.White, Now.UtcDateTime),
            Times.Once);
    }

    [Fact]
    public async Task Execute_WhenValidMove_SavesTheGame()
    {
        // Arrange
        var game = NewGameWithLegalMove();
        _gateway.Setup(g => g.SaveAsync(game.Object, 1)).ReturnsAsync(true);

        // Act
        await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert: saved against the move number the client sent.
        _gateway.Verify(g => g.SaveAsync(game.Object, 1), Times.Once);
    }

    [Fact]
    public async Task Execute_WhenValidMove_ButSaveIsStale_ReturnsStaleMoveError()
    {
        // Arrange
        var game = NewGameWithLegalMove();
        _gateway.Setup(g => g.SaveAsync(game.Object, 1)).ReturnsAsync(false);

        // Act
        var result = await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        Assert.Null(result.Game);
        Assert.Equal(SendMoveError.StaleMove, result.Error);
    }

    [Fact]
    public async Task Execute_WhenValidMove_SendsGameState()
    {
        // Arrange
        var game = NewGameWithLegalMove();
        _gateway.Setup(g => g.SaveAsync(game.Object, 1)).ReturnsAsync(true);

        // Act
        await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        _gameNotifier.Verify(n => n.SendGameStateAsync(game.Object), Times.Once);
    }

    [Fact]
    public async Task Execute_WhenMoveIllegal_SavesAndSendsNothing()
    {
        // Arrange
        var game = new Mock<Game>(_white, PieceColour.White, null);
        game.Object.BlackClientId = _black;
        game.Object.GameState = Position;
        game.Setup(g => g.IsParticipant(_white)).Returns(true);
        game.Setup(g => g.IsRepeatOfLastMove(1, PieceColour.White, AMove)).Returns(false);
        game.Setup(g => g.IsGameActive()).Returns(true);
        game.Setup(g => g.IsPlayersTurn(PieceColour.White)).Returns(true);
        _gateway.Setup(g => g.GetGameByIdAsync(game.Object.Id)).ReturnsAsync(game.Object);
        _timeProvider.Setup(t => t.GetUtcNow()).Returns(Now);
        game.Setup(g => g.CalculateTimeRemaining(PieceColour.White, Now.UtcDateTime)).Returns(TimeLeft);
        _chessEngine.Setup(e => e.MakeMove(Position, AMove))
            .Returns(new MakeMoveResult(false, null, null, null));

        // Act
        await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        _gateway.Verify(g => g.SaveAsync(It.IsAny<Game>(), It.IsAny<int>()), Times.Never);
        _gameNotifier.Verify(n => n.SendGameStateAsync(It.IsAny<Game>()), Times.Never);
    }

    [Fact]
    public async Task Execute_WhenValidMove_ButSaveIsStale_SendsNoGameState()
    {
        // Arrange
        var game = new Mock<Game>(_white, PieceColour.White, null);
        game.Object.BlackClientId = _black;
        game.Object.GameState = Position;
        game.Setup(g => g.IsParticipant(_white)).Returns(true);
        game.Setup(g => g.IsRepeatOfLastMove(1, PieceColour.White, AMove)).Returns(false);
        game.Setup(g => g.IsGameActive()).Returns(true);
        game.Setup(g => g.IsPlayersTurn(PieceColour.White)).Returns(true);
        _gateway.Setup(g => g.GetGameByIdAsync(game.Object.Id)).ReturnsAsync(game.Object);
        _timeProvider.Setup(t => t.GetUtcNow()).Returns(Now);
        game.Setup(g => g.CalculateTimeRemaining(PieceColour.White, Now.UtcDateTime)).Returns(TimeLeft);
        _chessEngine.Setup(e => e.MakeMove(Position, AMove))
            .Returns(new MakeMoveResult(true, NewPosition, null, null));
        _gateway.Setup(g => g.SaveAsync(game.Object, 1)).ReturnsAsync(false);

        // Act
        await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        _gameNotifier.Verify(n => n.SendGameStateAsync(It.IsAny<Game>()), Times.Never);
    }

    [Fact]
    public async Task Execute_WhenPlayerRunsOutOfTime_ButSaveIsStale_SendsNoGameState()
    {
        // Arrange
        var game = new Mock<Game>(_white, PieceColour.White, null);
        game.Object.BlackClientId = _black;
        game.Object.GameState = Position;
        game.Setup(g => g.IsParticipant(_white)).Returns(true);
        game.Setup(g => g.IsRepeatOfLastMove(1, PieceColour.White, AMove)).Returns(false);
        game.Setup(g => g.IsGameActive()).Returns(true);
        game.Setup(g => g.IsPlayersTurn(PieceColour.White)).Returns(true);
        _gateway.Setup(g => g.GetGameByIdAsync(game.Object.Id)).ReturnsAsync(game.Object);
        _timeProvider.Setup(t => t.GetUtcNow()).Returns(Now);
        game.Setup(g => g.CalculateTimeRemaining(PieceColour.White, Now.UtcDateTime)).Returns(-1);
        _gateway.Setup(g => g.SaveAsync(game.Object, 1)).ReturnsAsync(false);

        // Act
        await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        _gameNotifier.Verify(n => n.SendGameStateAsync(It.IsAny<Game>()), Times.Never);
    }

    [Fact]
    public async Task Execute_WhenPlayerRunsOutOfTime_DoesntPlayTheMove()
    {
        // Arrange
        var game = new Mock<Game>(_white, PieceColour.White, null);
        game.Object.BlackClientId = _black;
        game.Object.GameState = Position;
        game.Setup(g => g.IsParticipant(_white)).Returns(true);
        game.Setup(g => g.IsRepeatOfLastMove(1, PieceColour.White, AMove)).Returns(false);
        game.Setup(g => g.IsGameActive()).Returns(true);
        game.Setup(g => g.IsPlayersTurn(PieceColour.White)).Returns(true);
        _gateway.Setup(g => g.GetGameByIdAsync(game.Object.Id)).ReturnsAsync(game.Object);
        _timeProvider.Setup(t => t.GetUtcNow()).Returns(Now);
        game.Setup(g => g.CalculateTimeRemaining(PieceColour.White, Now.UtcDateTime)).Returns(-1);
        _gateway.Setup(g => g.SaveAsync(game.Object, 1)).ReturnsAsync(true);

        // Act
        await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        _chessEngine.Verify(e => e.MakeMove(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        game.Verify(
            g => g.RecordMove(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<PieceColour>(), It.IsAny<int>(), It.IsAny<DateTime>()),
            Times.Never);
    }

    [Fact]
    public async Task Execute_WhenNotTheFirstMove_DoesntStartTheGame()
    {
        // Arrange: the game is on move 3.
        var game = new Mock<Game>(_white, PieceColour.White, null);
        game.Object.BlackClientId = _black;
        game.Object.GameState = Position;
        game.Object.CurrentMove = 3;
        game.Setup(g => g.IsParticipant(_white)).Returns(true);
        game.Setup(g => g.IsRepeatOfLastMove(3, PieceColour.White, AMove)).Returns(false);
        game.Setup(g => g.IsGameActive()).Returns(true);
        game.Setup(g => g.IsPlayersTurn(PieceColour.White)).Returns(true);
        _gateway.Setup(g => g.GetGameByIdAsync(game.Object.Id)).ReturnsAsync(game.Object);
        _timeProvider.Setup(t => t.GetUtcNow()).Returns(Now);
        game.Setup(g => g.CalculateTimeRemaining(PieceColour.White, Now.UtcDateTime)).Returns(TimeLeft);
        _chessEngine.Setup(e => e.MakeMove(Position, AMove))
            .Returns(new MakeMoveResult(true, NewPosition, null, null));
        _gateway.Setup(g => g.SaveAsync(game.Object, 3)).ReturnsAsync(true);

        // Act
        await NewUseCase().ExecuteAsync(_white, game.Object.Id, 3, AMove);

        // Assert
        game.Verify(g => g.Start(It.IsAny<DateTime>()), Times.Never);
    }

    [Fact]
    public async Task Execute_WhenMoveDoesntEndTheGame_DoesntCompleteIt()
    {
        // Arrange
        var game = new Mock<Game>(_white, PieceColour.White, null);
        game.Object.BlackClientId = _black;
        game.Object.GameState = Position;
        game.Setup(g => g.IsParticipant(_white)).Returns(true);
        game.Setup(g => g.IsRepeatOfLastMove(1, PieceColour.White, AMove)).Returns(false);
        game.Setup(g => g.IsGameActive()).Returns(true);
        game.Setup(g => g.IsPlayersTurn(PieceColour.White)).Returns(true);
        _gateway.Setup(g => g.GetGameByIdAsync(game.Object.Id)).ReturnsAsync(game.Object);
        _timeProvider.Setup(t => t.GetUtcNow()).Returns(Now);
        game.Setup(g => g.CalculateTimeRemaining(PieceColour.White, Now.UtcDateTime)).Returns(TimeLeft);
        _chessEngine.Setup(e => e.MakeMove(Position, AMove))
            .Returns(new MakeMoveResult(true, NewPosition, null, null));
        _gateway.Setup(g => g.SaveAsync(game.Object, 1)).ReturnsAsync(true);

        // Act
        await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        game.Verify(
            g => g.Complete(It.IsAny<GameResult>(), It.IsAny<PieceColour?>(), It.IsAny<DateTime>()),
            Times.Never);
    }

    [Fact]
    public async Task Execute_WhenExactlyNoTimeLeft_StillPlaysTheMove()
    {
        // Arrange
        var game = new Mock<Game>(_white, PieceColour.White, null);
        game.Object.BlackClientId = _black;
        game.Object.GameState = Position;
        game.Setup(g => g.IsParticipant(_white)).Returns(true);
        game.Setup(g => g.IsRepeatOfLastMove(1, PieceColour.White, AMove)).Returns(false);
        game.Setup(g => g.IsGameActive()).Returns(true);
        game.Setup(g => g.IsPlayersTurn(PieceColour.White)).Returns(true);
        _gateway.Setup(g => g.GetGameByIdAsync(game.Object.Id)).ReturnsAsync(game.Object);
        _timeProvider.Setup(t => t.GetUtcNow()).Returns(Now);
        game.Setup(g => g.CalculateTimeRemaining(PieceColour.White, Now.UtcDateTime)).Returns(0);
        _chessEngine.Setup(e => e.MakeMove(Position, AMove))
            .Returns(new MakeMoveResult(true, NewPosition, null, null));
        _gateway.Setup(g => g.SaveAsync(game.Object, 1)).ReturnsAsync(true);

        // Act
        var result = await NewUseCase().ExecuteAsync(_white, game.Object.Id, 1, AMove);

        // Assert
        Assert.Null(result.Error);
        game.Verify(
            g => g.RecordMove(AMove, NewPosition, PieceColour.White, 0, Now.UtcDateTime),
            Times.Once);
    }
}
