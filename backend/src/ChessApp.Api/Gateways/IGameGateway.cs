using ChessApp.Api.Models;

namespace ChessApp.Api.Gateways;

// Where games are stored. In-memory for now, Postgres later.
public interface IGameGateway
{
    /// <summary>Adds the game. Returns false if the invite code is already taken.</summary>
    bool TryAdd(Game game);

    Game? GetById(Guid id);

    Game? GetByCode(string code);

    /// <summary>Seats the guest atomically. Returns false if the game already has one.</summary>
    bool TrySeatGuest(Game game, Guid guestId);
}
