using System.Collections.Concurrent;
using ChessApp.Api.Models;

namespace ChessApp.Api.Gateways;

// v1 stand-in until Postgres is added. State is lost on restart.
public sealed class InMemoryGameGateway : IGameGateway
{
    private readonly ConcurrentDictionary<Guid, Game> _byId = new();
    private readonly ConcurrentDictionary<string, Game> _byCode = new();

    public bool TryAdd(Game game)
    {
        if (!_byCode.TryAdd(game.Code, game)) return false;
        _byId[game.Id] = game;
        return true;
    }

    public Game? GetById(Guid id) => _byId.GetValueOrDefault(id);

    public Game? GetByCode(string code) => _byCode.GetValueOrDefault(code);

    public bool TrySeatGuest(Game game, Guid guestId)
    {
        lock (game) return game.TrySeatGuest(guestId);
    }
}
