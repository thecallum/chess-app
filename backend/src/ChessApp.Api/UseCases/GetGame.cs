using ChessApp.Api.Gateways;
using ChessApp.Api.Models;

namespace ChessApp.Api.UseCases;

public sealed class GetGame(IGameGateway games)
{
    // Non-participants get null, the same as a missing game, so ids don't leak.
    public Game? Execute(Guid playerId, Guid gameId)
    {
        var game = games.GetById(gameId);
        return game is not null && game.IsParticipant(playerId) ? game : null;
    }
}
