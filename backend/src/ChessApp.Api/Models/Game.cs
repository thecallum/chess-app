using System.Security.Cryptography;

namespace ChessApp.Api.Models;

public enum PieceColour { White, Black }

public enum GameStatus { WaitingForOpponent, WaitingForFirstMove, InProgress, Completed }

// How a completed game ended.
public enum GameResult { Checkmate, Stalemate, InsufficientMaterial, FiftyMoveRule, Repetition, Timeout }

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

    public int WhiteTimeRemaining {get;set;} = TEN_MINUTES_IN_SECONDS;
    public int BlackTimeRemaining {get;set;} = TEN_MINUTES_IN_SECONDS;

    public int CurrentMove {get;set;} = 1;
    public GameStatus Status {get;set;} = GameStatus.WaitingForOpponent;

    // Set when the game is completed. WinningPlayerId is null for a draw.
    public GameResult? Result {get;set;}
    public Guid? WinningPlayerId {get;set;}

    public string? GameInviteCode {get;set;}

    // The position as a FEN string, from the chess engine.
    public string GameState {get;set;} = string.Empty;

    // Every legal move in order, as sent by the client. Moves[0] is move 1.
    // Stored as a Postgres text[] column.
    public List<string> Moves {get;set;} = [];

    public bool IsParticipant(Guid playerId) => WhiteClientId == playerId || BlackClientId == playerId;

    // Active means both players are seated and the game hasn't finished.
    public bool IsGameActive()
    {
        return Status != GameStatus.WaitingForOpponent
            && Status != GameStatus.Completed
            && CompletedAt is null;
    }

    public bool IsPlayersTurn(PieceColour playerColour)
    {
        // CurrentMove starts at 1. White plays the odd moves and black the even ones.
        var colourToMove = CurrentMove % 2 == 1 ? PieceColour.White : PieceColour.Black;

        return playerColour == colourToMove;
    }

    // The time since the last move comes off the player's clock.
    public int CalculateTimeRemaining(PieceColour playerColour, DateTime now)
    {
        var timeRemaining = playerColour == PieceColour.White
            ? WhiteTimeRemaining
            : BlackTimeRemaining;

        // First move of the game: there's no previous move to time from, so nothing
        // is subtracted. The clock starts once this move is made. Black's first move
        // is timed from white's first move.
        if (LastMoveAt is null) return timeRemaining;

        var secondsUsed = (int)(now - LastMoveAt.Value).TotalSeconds;

        return timeRemaining - secondsUsed;
    }

    // The first move starts the game.
    public void Start(DateTime now)
    {
        StartedAt = now;
        Status = GameStatus.InProgress;
    }

    // A legal move: the mover's clock, the new position, the move number and when it happened.
    public void RecordMove(string move, string gameState, PieceColour mover, int timeRemaining, DateTime now)
    {
        if (mover == PieceColour.White)
        {
            WhiteTimeRemaining = timeRemaining;
        }
        else
        {
            BlackTimeRemaining = timeRemaining;
        }

        Moves.Add(move);
        GameState = gameState;
        CurrentMove++;
        LastMoveAt = now;
    }

    // True when this is a resend of the last move played: the same move, from the
    // player who played it, with that move's number. A double click or a retry.
    public bool IsRepeatOfLastMove(int moveId, PieceColour playerColour, string move)
    {
        if (Moves.Count == 0 || moveId != CurrentMove - 1) return false;

        // White plays the odd moves and black the even ones.
        var lastMover = moveId % 2 == 1 ? PieceColour.White : PieceColour.Black;

        return lastMover == playerColour && Moves[^1] == move;
    }

    // The game is over. The winner is null for a draw.
    public void Complete(GameResult result, PieceColour? winner, DateTime now)
    {
        Status = GameStatus.Completed;
        Result = result;
        WinningPlayerId = winner switch
        {
            PieceColour.White => WhiteClientId,
            PieceColour.Black => BlackClientId,
            _ => null,
        };
        CompletedAt = now;
    }

}
