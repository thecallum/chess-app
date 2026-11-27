using ChessApp.Api.Gateways.Interfaces;
using ChessApp.Api.Models;
using ChessApp.Api.UseCases.Interfaces;

namespace ChessApp.Api.UseCases;

public enum SendMoveError { NotFound, AccessDenied, GameNotActive, RepeatedMove, StaleMove, NotYourTurn, OutOfTime, IllegalMove }

public sealed record SendMoveResult(Game? Game, SendMoveError? Error);

public sealed class SendMoveUseCase : ISendMoveUseCase
{
    private readonly IGamesGateway _gamesGateway;
    private readonly IChessEngine _chessEngine;
    private readonly TimeProvider _timeProvider;
    private readonly IGameNotifier _gameNotifier;

    public SendMoveUseCase(
        IGamesGateway games,
        IChessEngine chessEngine,
        TimeProvider timeProvider,
        IGameNotifier gameNotifier)
    {
        _gamesGateway = games;
        _chessEngine = chessEngine;
        _timeProvider = timeProvider;
        _gameNotifier = gameNotifier;
    }

    public async Task<SendMoveResult> ExecuteAsync(Guid playerId, Guid gameId, int moveId, string move)
    {
        var now = _timeProvider.GetUtcNow().UtcDateTime;

        var game = await _gamesGateway.GetGameByIdAsync(gameId);
        if (game is null) return new(null, SendMoveError.NotFound);

        var playerColour = game.WhiteClientId == playerId ? PieceColour.White : PieceColour.Black;

        var gameStateError = ValidateGameState(game, playerId, playerColour, moveId, move);

        // A resend of a move that already went through: send the current state again,
        // which re-syncs the client. The hub treats it as a success.
        if (gameStateError == SendMoveError.RepeatedMove) await _gameNotifier.SendGameStateAsync(game);

        // The client is behind: send them the current state so they catch up.
        if (gameStateError is SendMoveError.GameNotActive or SendMoveError.StaleMove or SendMoveError.NotYourTurn)
            await _gameNotifier.SendGameStateAsync(game, playerId);
        if (gameStateError is not null) return new(null, gameStateError);

        var timeRemaining = game.CalculateTimeRemaining(playerColour, now);

        // Out of time: the move isn't played, and the opponent wins.
        if (timeRemaining < 0)
        {
            game.TimeOut(playerColour, now);
            if (!await _gamesGateway.SaveAsync(game, moveId)) return new(null, SendMoveError.StaleMove);

            await _gameNotifier.SendGameStateAsync(game);
            return new(game, SendMoveError.OutOfTime);
        }

        var result = _chessEngine.MakeMove(game.GameState, move);
        if (!result.IsLegal) return new(null, SendMoveError.IllegalMove);

        if (game.CurrentMove == 1) game.Start(now);

        game.RecordMove(move, result.Fen!, playerColour, timeRemaining, now);

        if (result.End is not null) game.Complete(result.End.Value, result.Winner, now);

        // Everything above only changed the game in memory. This is the one write, and it
        // only goes through if nobody else changed the game since it was read.
        if (!await _gamesGateway.SaveAsync(game, moveId)) return new(null, SendMoveError.StaleMove);

        // Both players get the new state: position, clocks, and the result if it ended.
        await _gameNotifier.SendGameStateAsync(game);

        return new(game, null);
    }

    // Null when the player is in the game, the game is active, the client is on the
    // current move and it's their turn.
    private static SendMoveError? ValidateGameState(Game game, Guid playerId, PieceColour playerColour, int moveId, string move)
    {
        if (!game.IsParticipant(playerId)) return SendMoveError.AccessDenied;

        // A resend of a move that already went through. Checked before IsGameActive so
        // a resent game-ending move is still recognised.
        if (game.IsRepeatOfLastMove(moveId, playerColour, move)) return SendMoveError.RepeatedMove;

        if (!game.IsGameActive()) return SendMoveError.GameNotActive;

        // The client acted on an older position than the stored one.
        if (moveId != game.CurrentMove) return SendMoveError.StaleMove;

        if (!game.IsPlayersTurn(playerColour)) return SendMoveError.NotYourTurn;

        return null;
    }
}
