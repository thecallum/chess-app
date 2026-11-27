using Chess;
using ChessApp.Api.Gateways.Interfaces;
using ChessApp.Api.Models;

namespace ChessApp.Api.Gateways;

// Rules engine backed by the Gera.Chess library (github.com/Geras1mleo/Chess).
public sealed class ChessEngine : IChessEngine
{
    public string InitGame()
    {
        return new ChessBoard().ToFen();
    }

    public MakeMoveResult MakeMove(string gameState, Move move)
    {
        // Load the game from the stored state (fetched from the database).
        if (!ChessBoard.TryLoadFromFen(gameState, out var board, AutoEndgameRules.All))
        {
            return new(false, null, null, null);
        }

        // Apply the move. The library returns false for an illegal move.
        if (!board.Move(move))
        {
            return new(false, null, null, null);
        }

        // Legal. Report the new position, and whether the game ended.
        return new(true, board.ToFen(), ToGameEnd(board.EndGame), ToWinner(board.EndGame));
    }

    private static GameEnd? ToGameEnd(EndGameInfo? endGame) => endGame?.EndgameType switch
    {
        EndgameType.Checkmate => GameEnd.Checkmate,
        EndgameType.Stalemate => GameEnd.Stalemate,
        EndgameType.InsufficientMaterial => GameEnd.InsufficientMaterial,
        EndgameType.FiftyMoveRule => GameEnd.FiftyMoveRule,
        EndgameType.Repetition => GameEnd.Repetition,
        _ => null,
    };

    private static PieceColour? ToWinner(EndGameInfo? endGame) => endGame?.WonSide switch
    {
        { } side when side == PieceColor.White => PieceColour.White,
        { } side when side == PieceColor.Black => PieceColour.Black,
        _ => null,
    };
}
