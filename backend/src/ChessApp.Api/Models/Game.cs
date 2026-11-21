using System.Security.Cryptography;

namespace ChessApp.Api.Models;

public enum PieceColour { White, Black }

public enum GameStatus { WaitingForOpponent, InProgress }

public sealed class Game
{
    // No 0/O, 1/I/L, so codes are easy to read out and type.
    private const string CodeAlphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private const int CodeLength = 6;
    public static readonly TimeSpan InviteLifetime = TimeSpan.FromHours(24);

    public Guid Id { get; } = Guid.NewGuid();
    public string Code { get; } = NewCode();
    public Guid HostId { get; }
    public PieceColour HostColour { get; }
    public DateTimeOffset ExpiresAt { get; }
    public Guid? GuestId { get; private set; }

    public Game(Guid hostId, PieceColour hostColour, DateTimeOffset now)
    {
        HostId = hostId;
        HostColour = hostColour;
        ExpiresAt = now + InviteLifetime;
    }

    public GameStatus Status =>
        GuestId is null ? GameStatus.WaitingForOpponent : GameStatus.InProgress;

    public bool IsExpired(DateTimeOffset now) => now >= ExpiresAt;

    public bool IsParticipant(Guid playerId) => playerId == HostId || playerId == GuestId;

    public PieceColour ColourOf(Guid playerId) =>
        playerId == HostId
            ? HostColour
            : HostColour == PieceColour.White ? PieceColour.Black : PieceColour.White;

    /// <summary>Fails if the game already has a guest. Callers must make this atomic.</summary>
    public bool TrySeatGuest(Guid guestId)
    {
        if (GuestId is not null) return false;
        GuestId = guestId;
        return true;
    }

    public static string NormaliseCode(string code) => code.Trim().ToUpperInvariant();

    private static string NewCode() =>
        string.Create(CodeLength, 0, static (span, _) =>
        {
            for (var i = 0; i < span.Length; i++)
                span[i] = CodeAlphabet[RandomNumberGenerator.GetInt32(CodeAlphabet.Length)];
        });
}
