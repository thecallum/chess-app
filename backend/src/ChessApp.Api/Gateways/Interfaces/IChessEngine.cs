using Chess;
using ChessApp.Api.Models;

namespace ChessApp.Api.Gateways.Interfaces;

public enum GameEnd { Checkmate, Stalemate, InsufficientMaterial, FiftyMoveRule, Repetition }

/// <param name="IsLegal">False if the move was rejected. All other fields are then empty.</param>
/// <param name="Fen">The position after the move.</param>
/// <param name="End">Set when the move ended the game.</param>
/// <param name="Winner">Set for a checkmate. Null for a draw.</param>
public sealed record MakeMoveResult(bool IsLegal, string? Fen, GameEnd? End, PieceColour? Winner);

// Our seam over the chess rules library, so it can be swapped without touching use cases.
// Positions are passed as FEN strings.
public interface IChessEngine
{
    /// <summary>The FEN of the standard starting position.</summary>
    string InitGame();

    /// <summary>Plays the move on the stored game state.</summary>
    // TODO: Move is a Gera.Chess type, so it leaks the library through this seam.
    // Needs a translation layer later.
    MakeMoveResult MakeMove(string gameState, Move move);
}
