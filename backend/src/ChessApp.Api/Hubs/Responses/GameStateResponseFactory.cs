using ChessApp.Api.Controllers.Responses;
using ChessApp.Api.Models;

namespace ChessApp.Api.Hubs.Responses;

public static class GameStateResponseFactory
{
    public static GameStateResponse Create(Game game)
    {
        // The winner's colour, from the stored player id. Null for a draw or an unfinished game.
        string? winner = null;
        if (game.WinningPlayerId is { } winnerId)
        {
            winner = winnerId == game.WhiteClientId ? "white" : "black";
        }

        return new GameStateResponse(
            game.Id,
            GameResponseFactory.StatusText(game.Status),
            game.GameState,
            game.CurrentMove,
            game.WhiteTimeRemainingMs,
            game.BlackTimeRemainingMs,
            game.LastMoveAt,
            game.Result?.ToString(),
            winner);
    }
}
