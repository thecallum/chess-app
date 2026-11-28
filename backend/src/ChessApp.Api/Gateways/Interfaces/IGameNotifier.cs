using ChessApp.Api.Models;

namespace ChessApp.Api.Gateways.Interfaces;

// Pushes game events to the players' open pages, for use cases that don't run in
// the hub (like joining, which is an HTTP request).
public interface IGameNotifier
{
    /// <summary>Sends each player in the game its current state.</summary>
    Task SendGameStateAsync(Game game);

    /// <summary>Sends one player the game's current state.</summary>
    Task SendGameStateAsync(Game game, Guid playerId);
}
