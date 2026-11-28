namespace ChessApp.Api.UseCases.Interfaces;

public interface IConnectToGameUseCase
{
    Task<ConnectToGameResult> ExecuteAsync(Guid playerId, Guid gameId);
}
