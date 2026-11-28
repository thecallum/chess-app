using ChessApp.Api.Models;

namespace ChessApp.Api.Controllers.Responses;

public static class GameResponseFactory
{
    public static GameResponse Create(Game game, Guid playerId)
    {
        var colour = game.WhiteClientId == playerId ? PieceColour.White : PieceColour.Black;

        return new GameResponse(
            game.Id,
            game.GameInviteCode ?? "",
            colour.ToString().ToLowerInvariant(),
            StatusText(game.Status));
    }

    public static string StatusText(GameStatus status) => status switch
    {
        GameStatus.WaitingForOpponent => "waiting",
        GameStatus.Completed => "completed",
        _ => "in_progress",
    };
}
