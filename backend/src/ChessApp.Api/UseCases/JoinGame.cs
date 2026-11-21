using ChessApp.Api.Gateways;
using ChessApp.Api.Models;

namespace ChessApp.Api.UseCases;

public enum JoinError { InvalidCode, Expired, GameFull }

public sealed record JoinGameResult(Game? Game, JoinError? Error);

public sealed class JoinGame(IGameGateway games, TimeProvider clock)
{
    public JoinGameResult Execute(Guid playerId, string code)
    {
        var game = games.GetByCode(Game.NormaliseCode(code));
        if (game is null) return new(null, JoinError.InvalidCode);

        // Entering your own game's code just takes you back to it.
        if (game.IsParticipant(playerId)) return new(game, null);

        if (game.Status == GameStatus.InProgress) return new(null, JoinError.GameFull);
        if (game.IsExpired(clock.GetUtcNow())) return new(null, JoinError.Expired);

        return games.TrySeatGuest(game, playerId)
            ? new(game, null)
            : new(null, JoinError.GameFull);
    }
}
