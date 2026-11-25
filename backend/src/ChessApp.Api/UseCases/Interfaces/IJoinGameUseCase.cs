namespace ChessApp.Api.UseCases.Interfaces;

public interface IJoinGameUseCase
{
    Task<JoinGameResult> ExecuteAsync(Guid playerId, string code);
}
