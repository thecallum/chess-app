using ChessApp.Api.Gateways.Interfaces;
using ChessApp.Api.Models;
using ChessApp.Api.UseCases.Interfaces;

namespace ChessApp.Api.UseCases;

public enum JoinError { InvalidCode, NotJoinable, GameFull }

public sealed record JoinGameResult(Game? Game, JoinError? Error);

public sealed class JoinGameUseCase : IJoinGameUseCase
{
    private readonly IGamesGateway _games;
    private readonly IGameNotifier _gameNotifier;

    public JoinGameUseCase(IGamesGateway games, IGameNotifier gameNotifier)
    {
        _games = games;
        _gameNotifier = gameNotifier;
    }

    public async Task<JoinGameResult> ExecuteAsync(Guid playerId, string code)
    {
        var result = await _games.JoinGameByCodeAsync(code.Trim().ToUpperInvariant(), playerId);

        if (result.Error == JoinGameByCodeError.InvalidCode) return new(null, JoinError.InvalidCode);
        if (result.Error == JoinGameByCodeError.NotJoinable) return new(null, JoinError.NotJoinable);
        if (result.Error == JoinGameByCodeError.GameFull) return new(null, JoinError.GameFull);

        // The creator's page is already open, so tell it the opponent has arrived.
        await _gameNotifier.SendGameStateAsync(result.Game!);

        return new(result.Game, null);
    }
}
