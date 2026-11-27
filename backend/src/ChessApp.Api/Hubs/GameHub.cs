using ChessApp.Api.Auth;
using ChessApp.Api.Controllers.Responses;
using ChessApp.Api.UseCases;
using ChessApp.Api.UseCases.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ChessApp.Api.Hubs;

// public record MoveMessage(string From);

[Authorize]
public class GameHub : Hub
{
    private readonly ILogger<GameHub> _logger;
    private readonly IConnectToGameUseCase _connectToGameUseCase;
    private readonly ISendMoveUseCase _sendMoveUseCase;

    public GameHub(
        ILogger<GameHub> logger,
        IConnectToGameUseCase connectToGameUseCase,
        ISendMoveUseCase sendMoveUseCase)
    {
        _logger = logger;
        _connectToGameUseCase = connectToGameUseCase;
        _sendMoveUseCase = sendMoveUseCase;
    }

    private static string Group(Guid gameId) => $"game:{gameId}";

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Connection {ConnectionId} connected", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // removeGroup(clientId)
        await base.OnDisconnectedAsync(exception);
    }

    // Seats this connection in the game's group if the guest is a player in it,
    // then sends the current game state to the caller only.
    public async Task ConnectToGame(Guid gameId)
    {
        var playerId = Context.User!.PlayerId();

        var result = await _connectToGameUseCase.ExecuteAsync(playerId, gameId);

        if (result.Error == ConnectToGameError.NotFound) throw new HubException("not_found");

        if (result.Error is not null) throw new HubException("access_denied");

        await Groups.AddToGroupAsync(Context.ConnectionId, Group(gameId));

        await Clients.Caller.SendAsync("GameState", GameResponseFactory.Create(result.Game!, playerId));
    }

    public async Task SendMove(Guid gameId, int moveId, string move)
    {
        var playerId = Context.User!.PlayerId();

        var result = await _sendMoveUseCase.ExecuteAsync(playerId, gameId, moveId, move);
        if (result.Error == SendMoveError.NotFound) throw new HubException("not_found");

        // Already played (a double click or retry): confirm it again to the sender
        // only, and don't tell the opponent twice.
        if (result.Error == SendMoveError.RepeatedMove)
        {
            await Clients.Caller.SendAsync("MoveConfirmed", move);
            return;
        }

        if (result.Error == SendMoveError.GameNotActive) throw new HubException("game_not_active");
        if (result.Error == SendMoveError.StaleMove) throw new HubException("stale_move");
        if (result.Error == SendMoveError.NotYourTurn) throw new HubException("not_your_turn");
        if (result.Error == SendMoveError.OutOfTime)
        {
            await SendGameOverAsync(gameId, result);
            throw new HubException("out_of_time");
        }
        if (result.Error == SendMoveError.IllegalMove) throw new HubException("illegal_move");
        if (result.Error is not null) throw new HubException("access_denied");

        // The opponent (everyone else in the game) gets the move, and the sender
        // gets a confirmation that it was accepted.
        await Clients.OthersInGroup(Group(gameId)).SendAsync("MoveMade", move);
        await Clients.Caller.SendAsync("MoveConfirmed", move);

        // Both players get the clocks as of this move, so their timers agree.
        await Clients.Group(Group(gameId)).SendAsync("ClockUpdate", new
        {
            whiteTimeRemaining = result.Game!.WhiteTimeRemaining,
            blackTimeRemaining = result.Game.BlackTimeRemaining,
            lastMoveAt = result.Game.LastMoveAt,
        });

        // If the move ended the game, both players are told how.
        if (result.End is not null) await SendGameOverAsync(gameId, result);
    }

    private Task SendGameOverAsync(Guid gameId, SendMoveResult result) =>
        Clients.Group(Group(gameId)).SendAsync("GameOver", new
        {
            result = result.End.ToString(),
            winner = result.Winner?.ToString(),
        });
}
