using Microsoft.AspNetCore.SignalR;

namespace ChessApp.Api.Hubs;

public record MoveMessage(string From, string To, string? Promotion);

public class GameHub : Hub
{
    // Scaffolding: no validation yet. Anyone can join any game's channel.
    private static string Group(string gameId) => $"game:{gameId}";

    // Demo: tells every other connected client that someone pinged.
    public Task Ping() => Clients.Others.SendAsync("Pinged");

    public Task JoinGame(string gameId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, Group(gameId));

    // Relays the move to the other players in the game, unchecked.
    public Task SendMove(string gameId, MoveMessage move) =>
        Clients.OthersInGroup(Group(gameId)).SendAsync("MoveMade", move);
}
