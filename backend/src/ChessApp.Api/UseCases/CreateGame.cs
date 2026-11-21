using System.Security.Cryptography;
using ChessApp.Api.Gateways;
using ChessApp.Api.Models;

namespace ChessApp.Api.UseCases;

public enum ColourChoice { Random, White, Black }

public sealed class CreateGame(IGameGateway games, TimeProvider clock)
{
    public Game Execute(Guid playerId, ColourChoice choice)
    {
        var colour = choice switch
        {
            ColourChoice.White => PieceColour.White,
            ColourChoice.Black => PieceColour.Black,
            _ => RandomNumberGenerator.GetInt32(2) == 0 ? PieceColour.White : PieceColour.Black,
        };

        // A clash on the invite code is very unlikely, but retry if it happens.
        while (true)
        {
            var game = new Game(playerId, colour, clock.GetUtcNow());
            if (games.TryAdd(game)) return game;
        }
    }
}
