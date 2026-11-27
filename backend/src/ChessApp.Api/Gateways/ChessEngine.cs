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

    public MakeMoveResult MakeMove(string gameState, string move)
    {
        // Load the game from the stored state (fetched from the database).
        if (!ChessBoard.TryLoadFromFen(gameState, out var board, AutoEndgameRules.All))
        {
            return new(false, null, null, null);
        }

        try
        {
            // Apply the move. The library returns false for some illegal moves, and
            // throws a ChessException for others (a malformed move, an empty square).
            if (!board.Move(new Move(move)))
            {
                return new(false, null, null, null);
            }
        }
        catch (ChessException)
        {
            return new(false, null, null, null);
        }

        // Legal. Report the new position, and whether the game ended.
        return new(true, board.ToFen(), ToGameResult(board.EndGame), ToWinner(board.EndGame));
    }

    private static GameResult? ToGameResult(EndGameInfo? endGame) => endGame?.EndgameType switch
    {
        EndgameType.Checkmate => GameResult.Checkmate,
        EndgameType.Stalemate => GameResult.Stalemate,
        EndgameType.InsufficientMaterial => GameResult.InsufficientMaterial,
        EndgameType.FiftyMoveRule => GameResult.FiftyMoveRule,
        EndgameType.Repetition => GameResult.Repetition,
        _ => null,
    };

    private static PieceColour? ToWinner(EndGameInfo? endGame) => endGame?.WonSide switch
    {
        { } side when side == PieceColor.White => PieceColour.White,
        { } side when side == PieceColor.Black => PieceColour.Black,
        _ => null,
    };
}
