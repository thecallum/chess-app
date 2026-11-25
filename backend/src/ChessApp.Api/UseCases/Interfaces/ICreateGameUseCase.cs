using ChessApp.Api.Models;

namespace ChessApp.Api.UseCases.Interfaces;

public interface ICreateGameUseCase
{
    Task<Game> ExecuteAsync(Guid playerId, ColourChoice choice);
}
