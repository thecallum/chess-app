using Chess;

namespace ChessApp.Api.Gateways.Interfaces;

// The parts of Gera.Chess's ChessBoard that ChessEngine uses. The library's class
// can't be mocked (its members aren't virtual), so ChessEngine goes through this,
// and tests mock it. It holds one position, so it's registered per request.
public interface IChessBoard
{
    /// <summary>Replaces the position with the FEN. False if it can't be loaded.</summary>
    bool LoadFromFen(string fen);

    /// <summary>
    /// Plays a move in the library's long notation, like "{e2 - e4}". Returns false for
    /// some illegal moves, and throws a ChessException for others, as the library does.
    /// </summary>
    bool Move(string move);

    /// <summary>The current position. A new board is at the starting position.</summary>
    string ToFen();

    /// <summary>Set once a move has ended the game. Null while it's still going.</summary>
    EndGameInfo? EndGame { get; }
}
