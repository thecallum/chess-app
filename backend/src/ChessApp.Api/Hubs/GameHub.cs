using Microsoft.AspNetCore.SignalR;

namespace ChessApp.Api.Hubs;

public class GameHub : Hub
{
    // Demo: tells every other connected client that someone pinged.
    public Task Ping() => Clients.Others.SendAsync("Pinged");
}
