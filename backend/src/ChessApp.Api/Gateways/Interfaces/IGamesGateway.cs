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
    /// Saves a move from the game: position, move number, time of the move and both clocks.
    /// Touches no other column.
    /// </summary>
    Task UpdateGameStateAsync(Game game);

    /// <summary>Records when the first move was made. Touches no other column.</summary>
    Task StartGameAsync(Guid gameId, DateTime startedAt);

    /// <summary>Marks the game as completed, with how it ended and who won. Touches no other column.</summary>
    Task CompleteGameAsync(Guid gameId, GameResult result, Guid? winningPlayerId);
}
