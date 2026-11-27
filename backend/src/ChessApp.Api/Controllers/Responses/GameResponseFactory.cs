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
            game.LastMoveAt);
    }
}
