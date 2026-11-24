using ChessApp.Api.Models;

namespace ChessApp.Api.Controllers.Responses;

public static class GameResponseFactory
{
    public static GameResponse Create(Game game, Guid playerId)
    {
        var isWaiting = game.Status == GameStatus.WaitingForOpponent;
        var colour = game.WhiteClientId == playerId ? PieceColour.White : PieceColour.Black;

        return new GameResponse(
            game.Id,
            game.GameInviteCode ?? "",
            colour.ToString().ToLowerInvariant(),
            isWaiting ? "waiting" : "in_progress");
    }
}
