using System.Security.Cryptography;
using ChessApp.Api.Gateways.Interfaces;
using ChessApp.Api.Models;
using ChessApp.Api.UseCases.Interfaces;

namespace ChessApp.Api.UseCases;

public enum ColourChoice { Random, White, Black }

public sealed class CreateGameUseCase(IGamesGateway games) : ICreateGameUseCase
{
    public async Task<Game> ExecuteAsync(Guid playerId, ColourChoice choice)
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
            var game = new Game(playerId, colour, NewInviteCode());
            if (await games.CreateGameAsync(game)) return game;
        }
    }

    // Upper-case because the join use case upper-cases whatever code the player types.
    private static string NewInviteCode() => Guid.NewGuid().ToString("N").ToUpperInvariant();
}
