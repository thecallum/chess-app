using ChessApp.Api.Models;

namespace ChessApp.Api.Gateways.Interfaces;

public enum JoinGameByCodeError { InvalidCode, NotJoinable, GameFull }

public sealed record JoinGameByCodeResult(Game? Game, JoinGameByCodeError? Error);

// Where games are stored. Postgres in production.
public interface IGamesGateway
{
    /// <summary>Saves the game. Returns false if the invite code is already taken.</summary>
    Task<bool> CreateGameAsync(Game game);

    Task<Game?> GetGameByIdAsync(Guid id);

    /// <summary>Seats the player in the empty colour. Safe if two players join at once.</summary>
    Task<JoinGameByCodeResult> JoinGameByCodeAsync(string code, Guid playerId);

    /// <summary>
    /// Saves everything playing the game can change, in one update: position, moves, move number,
    /// clocks, timings, status and result. Seats and invite code are left alone.
    /// Optimistic locking: only saves if the stored game is still on <paramref name="expectedMove"/>
    /// and not completed. Returns false if it changed since it was read, and nothing is saved.
    /// </summary>
    Task<bool> SaveAsync(Game game, int expectedMove);
}
