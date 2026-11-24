namespace ChessApp.Api.UseCases.Interfaces;

public interface IGetGameUseCase
{
    Task<GetGameResult> ExecuteAsync(Guid playerId, Guid gameId);
}
