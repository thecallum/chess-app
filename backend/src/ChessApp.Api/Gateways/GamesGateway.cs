using ChessApp.Api.Gateways.Interfaces;
using ChessApp.Api.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace ChessApp.Api.Gateways;

public sealed class GamesGateway : IGamesGateway
{
    private readonly ChessDbContext _db;

    public GamesGateway(ChessDbContext db)
    {
        _db = db;
    }

    public async Task<bool> CreateGameAsync(Game game)
    {
        _db.Games.Add(game);
        try
        {
            await _db.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException e) when (e.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // The invite code is taken. Stop the context retrying this game on its next save.
            _db.Entry(game).State = EntityState.Detached;
            return false;
        }
    }

    public Task<Game?> GetGameByIdAsync(Guid id) =>
        _db.Games.AsNoTracking().SingleOrDefaultAsync(g => g.Id == id);

    public async Task<JoinGameByCodeResult> JoinGameByCodeAsync(string code, Guid playerId)
    {
        var game = await _db.Games.AsNoTracking().SingleOrDefaultAsync(g => g.GameInviteCode == code);
        if (game is null) return new(null, JoinGameByCodeError.InvalidCode);

        // Already in this game, so entering the code just takes you back to it.
        if (game.WhiteClientId == playerId || game.BlackClientId == playerId) return new(game, null);

        if (game.Status != GameStatus.WaitingForOpponent) return new(null, JoinGameByCodeError.NotJoinable);
        if (game.WhiteClientId is not null && game.BlackClientId is not null) return new(null, JoinGameByCodeError.GameFull);

        // Each seat update only matches while its seat is still empty. If two players join
        // at once, the database lets exactly one of them match, so no transaction is needed.
        var seated = game.WhiteClientId is null
            ? await SeatAsWhiteAsync(game.Id, playerId)
            : await SeatAsBlackAsync(game.Id, playerId);
        // False means the UPDATE matched no rows: another player took the seat, or the game
        // stopped waiting, after the read above. The only way that happens is someone else
        // joining, so it's reported as GameFull. Real database errors aren't caught here.
        // They throw and surface as a 500.
        if (!seated) return new(null, JoinGameByCodeError.GameFull);

        return new(await GetGameByIdAsync(game.Id), null);
    }

    public async Task UpdateGameStateAsync(Game game)
    {
        await _db.Games
            .Where(g => g.Id == game.Id)
            .ExecuteUpdateAsync(s => s
                .SetProperty(g => g.GameState, game.GameState)
                .SetProperty(g => g.CurrentMove, game.CurrentMove)
                .SetProperty(g => g.LastMoveAt, game.LastMoveAt)
                .SetProperty(g => g.WhiteTimeRemaining, game.WhiteTimeRemaining)
                .SetProperty(g => g.BlackTimeRemaining, game.BlackTimeRemaining));
    }

    public async Task StartGameAsync(Guid gameId, DateTime startedAt)
    {
        await _db.Games
            .Where(g => g.Id == gameId)
            .ExecuteUpdateAsync(s => s.SetProperty(g => g.StartedAt, startedAt));
    }

    public async Task CompleteGameAsync(Guid gameId, GameResult result, Guid? winningPlayerId)
    {
        await _db.Games
            .Where(g => g.Id == gameId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(g => g.Status, GameStatus.Completed)
                .SetProperty(g => g.Result, (GameResult?)result)
                .SetProperty(g => g.WinningPlayerId, winningPlayerId));
    }

    private async Task<bool> SeatAsWhiteAsync(Guid gameId, Guid playerId)
    {
        var rows = await _db.Games
            .Where(g => g.Id == gameId && g.Status == GameStatus.WaitingForOpponent && g.WhiteClientId == null)
            .ExecuteUpdateAsync(s => s
                .SetProperty(g => g.WhiteClientId, (Guid?)playerId)
                .SetProperty(g => g.Status, GameStatus.WaitingForFirstMove));
        return rows == 1;
    }

    private async Task<bool> SeatAsBlackAsync(Guid gameId, Guid playerId)
    {
        var rows = await _db.Games
            .Where(g => g.Id == gameId && g.Status == GameStatus.WaitingForOpponent && g.BlackClientId == null)
            .ExecuteUpdateAsync(s => s
                .SetProperty(g => g.BlackClientId, (Guid?)playerId)
                .SetProperty(g => g.Status, GameStatus.WaitingForFirstMove));
        return rows == 1;
    }
}
