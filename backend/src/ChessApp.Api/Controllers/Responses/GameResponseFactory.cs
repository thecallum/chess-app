using ChessApp.Api.Models;

namespace ChessApp.Api.Controllers.Responses;

public static class GameResponseFactory
{
    public static GameResponse Create(Game game, Guid playerId)
    {
        var colour = game.WhiteClientId == playerId ? PieceColour.White : PieceColour.Black;

        var status = game.Status switch
        {
            GameStatus.WaitingForOpponent => "waiting",
            GameStatus.Completed => "completed",
            _ => "in_progress",
        };

        // The winner's colour, from the stored player id. Null for a draw or an unfinished game.
        string? winner = null;
        if (game.WinningPlayerId is { } winnerId)
        {
            winner = winnerId == game.WhiteClientId ? "white" : "black";
        }

        return new GameResponse(
            game.Id,
            game.GameInviteCode ?? "",
            colour.ToString().ToLowerInvariant(),
            status,
            game.GameState,
            game.CurrentMove,
            game.Moves,
            game.WhiteTimeRemainingMs,
            game.BlackTimeRemainingMs,
            game.LastMoveAt,
            game.Result?.ToString(),
            winner);
    }
}
