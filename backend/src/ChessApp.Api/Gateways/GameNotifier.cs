using ChessApp.Api.Controllers.Responses;
using ChessApp.Api.Gateways.Interfaces;
using ChessApp.Api.Hubs;
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

    // Each player gets their own copy, with their own colour. Clients.User finds a
    // player's connections by the NameIdentifier claim, which is their guest id.
    // The ids themselves are never sent: they're the players' login cookies.
    public async Task SendGameStateAsync(Game game)
    {
        foreach (var playerId in new[] { game.WhiteClientId, game.BlackClientId })
        {
            if (playerId is not { } id) continue;

            await _hub.Clients.User(id.ToString())
                .SendAsync("GameState", GameResponseFactory.Create(game, id));
        }
    }
}
