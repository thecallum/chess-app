using ChessApp.Api.Gateways.Interfaces;
using ChessApp.Api.Models;
using ChessApp.Api.UseCases.Interfaces;

namespace ChessApp.Api.UseCases;

public enum ConnectToGameError { NotFound, AccessDenied }

public sealed record ConnectToGameResult(Game? Game, ConnectToGameError? Error);

// Decides whether a live connection may listen to a game. The hub adds the
// connection to the game's group only when this succeeds.
public sealed class ConnectToGameUseCase : IConnectToGameUseCase
{
    private readonly IGamesGateway _games;

    public ConnectToGameUseCase(IGamesGateway games)
    {
        _games = games;
    }

    public async Task<ConnectToGameResult> ExecuteAsync(Guid playerId, Guid gameId)
    {
        var game = await _games.GetGameByIdAsync(gameId);
        if (game is null) return new(null, ConnectToGameError.NotFound);

        if (!game.IsParticipant(playerId)) return new(null, ConnectToGameError.AccessDenied);

        return new(game, null);
    }
}
