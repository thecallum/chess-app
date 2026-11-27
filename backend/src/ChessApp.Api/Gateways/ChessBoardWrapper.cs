using Chess;
using ChessApp.Api.Gateways.Interfaces;

namespace ChessApp.Api.Gateways;

// IChessBoard on top of the Gera.Chess library's board. Each call passes straight through.
public sealed class ChessBoardWrapper : IChessBoard
{
    private ChessBoard _board = new();

    public bool LoadFromFen(string fen)
    {
        // The library loads a FEN into a new board, so keep the one it returns.
        // AutoEndgameRules.All makes it detect draws (insufficient material,
        // fifty-move rule, repetition) as well as checkmate and stalemate.
        if (!ChessBoard.TryLoadFromFen(fen, out var board, AutoEndgameRules.All)) return false;

        _board = board!;
        return true;
    }

    public bool Move(string move)
    {
        // new Move(...) throws a ChessArgumentException for a malformed move.
        return _board.Move(new Move(move));
    }

    public string ToFen()
    {
        return _board.ToFen();
    }

    public EndGameInfo? EndGame => _board.EndGame;
}
