using ChessApp.Api.Gateways.Interfaces;
using ChessApp.Api.Models;
using ChessApp.Api.UseCases.Interfaces;

namespace ChessApp.Api.UseCases;

public enum GetGameError { NotFound, AccessDenied }

public sealed record GetGameResult(Game? Game, GetGameError? Error);

public sealed class GetGameUseCase(IGamesGateway games) : IGetGameUseCase
{
    public async Task<GetGameResult> ExecuteAsync(Guid playerId, Guid gameId)
    {
        var game = await games.GetGameByIdAsync(gameId);
        if (game is null) return new(null, GetGameError.NotFound);

        if (!game.IsParticipant(playerId)) return new(null, GetGameError.AccessDenied);

        return new(game, null);
    }
}
