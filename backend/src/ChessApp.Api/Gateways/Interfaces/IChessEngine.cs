using ChessApp.Api.Models;

namespace ChessApp.Api.Gateways.Interfaces;

/// <param name="IsLegal">False if the move was rejected. All other fields are then empty.</param>
/// <param name="Fen">The position after the move.</param>
/// <param name="End">Set when the move ended the game. Never Timeout: the engine doesn't know about clocks.</param>
/// <param name="Winner">Set for a checkmate. Null for a draw.</param>
public sealed record MakeMoveResult(bool IsLegal, string? Fen, GameResult? End, PieceColour? Winner);

// Our seam over the chess rules library, so it can be swapped without touching use cases.
// Positions are passed as FEN strings.
public interface IChessEngine
{
    /// <summary>The FEN of the standard starting position.</summary>
    string InitGame();

    /// <summary>
    /// Plays the move on the stored game state. The move is in long notation, like
    /// "{e2 - e4}" or "{a7 - a8 - =q}". A malformed or illegal move gives IsLegal = false.
    /// </summary>
    MakeMoveResult MakeMove(string gameState, string move);
}
