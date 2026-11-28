using ChessApp.Api.Gateways.Interfaces;
using ChessApp.Api.Hubs;
using ChessApp.Api.Hubs.Responses;
using ChessApp.Api.Models;
using Microsoft.AspNetCore.SignalR;

namespace ChessApp.Api.Gateways;

// Sends through the game hub's connections from outside the hub.
public sealed class GameNotifier : IGameNotifier
{
    private readonly IHubContext<GameHub> _hub;

    public GameNotifier(IHubContext<GameHub> hub)
    {
        _hub = hub;
    }

    // Clients.User finds a player's connections by the NameIdentifier claim, which is their guest id.
    // The ids themselves are never sent: they're the players' login cookies.
    public async Task SendGameStateAsync(Game game)
    {
        foreach (var playerId in new[] { game.WhiteClientId, game.BlackClientId })
        {
            if (playerId is not { } id) continue;

            await SendGameStateAsync(game, id);
        }
    }

    public Task SendGameStateAsync(Game game, Guid playerId) =>
        _hub.Clients.User(playerId.ToString())
            .SendAsync("GameState", GameStateResponseFactory.Create(game));
}
