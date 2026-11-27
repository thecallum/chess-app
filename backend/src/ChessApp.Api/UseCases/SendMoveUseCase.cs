using Chess;
using ChessApp.Api.Gateways.Interfaces;
using ChessApp.Api.Models;
using ChessApp.Api.UseCases.Interfaces;

namespace ChessApp.Api.UseCases;

public enum SendMoveError { NotFound, AccessDenied, GameNotActive, NotYourTurn, OutOfTime, IllegalMove }

// End and Winner are set when the game ended, by this move or by running out of time.
// Winner is null for a draw.
public sealed record SendMoveResult(
    Game? Game,
    SendMoveError? Error,
    GameResult? End = null,
    PieceColour? Winner = null);

public sealed class SendMoveUseCase : ISendMoveUseCase
{
    private readonly IGamesGateway _gamesGateway;
    private readonly IChessEngine _chessEngine;
    private readonly TimeProvider _timeProvider;

    public SendMoveUseCase(IGamesGateway games, IChessEngine chessEngine, TimeProvider timeProvider)
    {
        _gamesGateway = games;
        _chessEngine = chessEngine;
        _timeProvider = timeProvider;
    }

    public async Task<SendMoveResult> ExecuteAsync(Guid playerId, Guid gameId, string move)
    {
        var now = _timeProvider.GetUtcNow().UtcDateTime;

        var game = await _gamesGateway.GetGameByIdAsync(gameId);
        if (game is null) return new(null, SendMoveError.NotFound);

        if (!game.IsParticipant(playerId)) return new(null, SendMoveError.AccessDenied);

        if (!IsGameActive(game)) return new(null, SendMoveError.GameNotActive);

        var playerColour = game.WhiteClientId == playerId ? PieceColour.White : PieceColour.Black;

        if (!IsPlayersTurn(game, playerColour)) return new(null, SendMoveError.NotYourTurn);

        var timeRemaining = CalculateTimeRemaining(game, playerColour, now);

        // Out of time: the move isn't played, and the opponent wins.
        if (timeRemaining < 0)
        {
            var winnerColour = playerColour == PieceColour.White ? PieceColour.Black : PieceColour.White;
            await CompleteGameAsync(game, GameResult.Timeout, winnerColour);
            return new(game, SendMoveError.OutOfTime, GameResult.Timeout, winnerColour);
        }

        // TODO: translate the client's move into the engine's Move. For now the string
        // must be the library's long notation, like "{e2 - e4}", and a malformed one throws.
        var result = _chessEngine.MakeMove(game.GameState, new Move(move));
        if (!result.IsLegal) return new(null, SendMoveError.IllegalMove);

        // The first move starts the game.
        if (game.CurrentMove == 1)
        {
            game.StartedAt = now;
            await _gamesGateway.StartGameAsync(gameId, game.StartedAt.Value);
        }

        if (playerColour == PieceColour.White)
        {
            game.WhiteTimeRemaining = timeRemaining;
        }
        else
        {
            game.BlackTimeRemaining = timeRemaining;
        }

        game.GameState = result.Fen!;
        game.CurrentMove++;
        game.LastMoveAt = now;
        await _gamesGateway.UpdateGameStateAsync(game);

        if (result.End is not null)
        {
            var end = ToGameResult(result.End.Value);
            await CompleteGameAsync(game, end, result.Winner);
            return new(game, null, end, result.Winner);
        }

        // TODO: store CompletedAt when the game ends

        return new(game, null);
    }

    private async Task CompleteGameAsync(Game game, GameResult result, PieceColour? winnerColour)
    {
        var winningPlayerId = winnerColour switch
        {
            PieceColour.White => game.WhiteClientId,
            PieceColour.Black => game.BlackClientId,
            _ => null,
        };

        await _gamesGateway.CompleteGameAsync(game.Id, result, winningPlayerId);

        game.Status = GameStatus.Completed;
        game.Result = result;
        game.WinningPlayerId = winningPlayerId;
    }

    // The time since the last move comes off the player's clock. The clock starts
    // with the first move, so before then there's nothing to take off.
    private static int CalculateTimeRemaining(Game game, PieceColour playerColour, DateTime now)
    {
        var timeRemaining = playerColour == PieceColour.White
            ? game.WhiteTimeRemaining
            : game.BlackTimeRemaining;

        if (game.LastMoveAt is null) return timeRemaining;

        var secondsUsed = (int)(now - game.LastMoveAt.Value).TotalSeconds;

        return timeRemaining - secondsUsed;
    }

    private static GameResult ToGameResult(GameEnd end) => end switch
    {
        GameEnd.Checkmate => GameResult.Checkmate,
        GameEnd.Stalemate => GameResult.Stalemate,
        GameEnd.InsufficientMaterial => GameResult.InsufficientMaterial,
        GameEnd.FiftyMoveRule => GameResult.FiftyMoveRule,
        _ => GameResult.Repetition,
    };

    // Active means both players are seated and the game hasn't finished.
    private static bool IsGameActive(Game game)
    {
        return game.Status != GameStatus.WaitingForOpponent
            && game.Status != GameStatus.Completed
            && game.CompletedAt is null;
    }

    private static bool IsPlayersTurn(Game game, PieceColour playerColour)
    {
        // CurrentMove starts at 1. White plays the odd moves and black the even ones.
        var colourToMove = game.CurrentMove % 2 == 1 ? PieceColour.White : PieceColour.Black;

        return playerColour == colourToMove;
    }
}
