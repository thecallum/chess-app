using Chess;
using ChessApp.Api.Gateways.Interfaces;
using ChessApp.Api.Models;

namespace ChessApp.Api.Gateways;

// Rules engine backed by the Gera.Chess library (github.com/Geras1mleo/Chess).
// The board is injected, so tests can mock it.
public sealed class ChessEngine : IChessEngine
{
    private readonly IChessBoard _board;

    public ChessEngine(IChessBoard board)
    {
        _board = board;
    }

    public string InitGame()
    {
        // A new board is at the starting position.
        return _board.ToFen();
    }

    public MakeMoveResult MakeMove(string gameState, string move)
    {
        // Load the game from the stored state (fetched from the database).
        if (!_board.LoadFromFen(gameState))
        {
            return new(false, null, null, null);
        }

        try
        {
            // Apply the move. The library returns false for some illegal moves, and
            // throws a ChessException for others (a malformed move, an empty square).
            if (!_board.Move(move))
            {
                return new(false, null, null, null);
            }
        }
        catch (ChessException)
        {
            return new(false, null, null, null);
        }

        // Legal. Report the new position, and whether the game ended.
        return new(true, _board.ToFen(), ToGameResult(_board.EndGame), ToWinner(_board.EndGame));
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
