using System.Security.Cryptography;

namespace ChessApp.Api.Models;

public enum PieceColour { White, Black }

public enum GameStatus { WaitingForOpponent, WaitingForFirstMove, InProgress }

public sealed class Game
{
    private const int TEN_MINUTES_IN_SECONDS = 10 * 60;

    // For EF Core to load a stored game.
    private Game()
    {
    }

    public Game(Guid ownerId, PieceColour colour, string? inviteCode = null)
    {
        if (colour == PieceColour.White)
        {
            WhiteClientId = ownerId;
        } else
        {
            BlackClientId = ownerId;
        }

        if (inviteCode is not null) GameInviteCode = inviteCode;
    }

    public Guid Id { get; } = Guid.NewGuid();

    public Guid? WhiteClientId {get;set;}
    public Guid? BlackClientId {get;set;}

    public DateTime CreatedAt {get; } = DateTime.UtcNow;
    public DateTime? StartedAt {get;set;}
    public DateTime? CompletedAt {get;set;}
    public DateTime? LastMoveAt {get;set;}

    public int WhiteTimeRemaining {get;} = TEN_MINUTES_IN_SECONDS;
    public int BlackTimeRemaining {get;} = TEN_MINUTES_IN_SECONDS;

    public int CurrentMove {get;set;} = 1;
    public GameStatus Status {get;set;} = GameStatus.WaitingForOpponent;

    public string? GameInviteCode {get;set;}

    public bool IsParticipant(Guid playerId) => WhiteClientId == playerId || BlackClientId == playerId;

}
