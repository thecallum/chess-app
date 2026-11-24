using ChessApp.Api.Gateways.Interfaces;
using ChessApp.Api.Models;
using ChessApp.Api.UseCases.Interfaces;

namespace ChessApp.Api.UseCases;

public enum JoinError { InvalidCode, NotJoinable, GameFull }

public sealed record JoinGameResult(Game? Game, JoinError? Error);

public sealed class JoinGameUseCase(IGamesGateway games) : IJoinGameUseCase
{
    public async Task<JoinGameResult> ExecuteAsync(Guid playerId, string code)
    {
        var result = await games.JoinGameByCodeAsync(code.Trim().ToUpperInvariant(), playerId);

        if (result.Error is null) return new(result.Game, null);

        if (result.Error == JoinGameByCodeError.InvalidCode) return new(null, JoinError.InvalidCode);

        if (result.Error == JoinGameByCodeError.NotJoinable) return new(null, JoinError.NotJoinable);

        return new(null, JoinError.GameFull);
    }
}
